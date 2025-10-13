import { useEffect, useRef, useState } from "react";
import type { VideoModel, VideoType } from "@/types/video";
import { useToast } from "@/hooks/useToast";
import { VIDEO_CONFIG } from "@/lib/video/config/videoConfig";
import { promiseAllWithLimit } from "@/lib/utils/concurrency";

export interface VideoQueueItem {
  messageId: string;
  taskId: string;
  model: VideoModel; // "payperwork-v1" | "payperwork-v2"
  type: VideoType; // "text2video" | "image2video"
  prompt: string;
  thumbnailUrl?: string; // Base64 or URL from uploaded image
  startTime: number;
  estimatedDuration: number; // in minutes
  status: "processing" | "succeed" | "failed";
  videoUrl?: string;
  error?: string;
  progress?: number; // 0-100
}

interface UseVideoQueueOptions {
  onVideoReady: (messageId: string, videoUrl: string) => void;
  onVideoFailed: (messageId: string, error: string) => void;
  onProgressUpdate?: (messageId: string, progress: number, estimatedTimeRemaining: number) => void;
}

export function useVideoQueue({ onVideoReady, onVideoFailed, onProgressUpdate }: UseVideoQueueOptions) {
  const [queue, setQueue] = useState<VideoQueueItem[]>([]);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queueRef = useRef<VideoQueueItem[]>([]); // FIX: Keep ref to current queue for async operations
  const abortControllerRef = useRef<AbortController | null>(null); // FIX: Add abort controller for cleanup
  const timeoutRefsRef = useRef<Map<string, NodeJS.Timeout>>(new Map()); // FIX: Track all timeouts for cleanup
  const isMountedRef = useRef(true); // FIX: Track mount status
  const toast = useToast();

  // Sync ref with state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Track mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Add a new video to the queue
  const addToQueue = (
    messageId: string,
    taskId: string,
    model: VideoModel,
    type: VideoType,
    prompt: string,
    thumbnailUrl?: string,
    estimatedDuration: number = 8 // Default 8 minutes
  ) => {
    const newItem: VideoQueueItem = {
      messageId,
      taskId,
      model,
      type,
      prompt,
      thumbnailUrl,
      startTime: Date.now(),
      estimatedDuration,
      status: "processing",
      progress: 0,
    };

    setQueue((prev) => [...prev, newItem]);

    // Start polling if not already running
    if (!pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(checkQueue, VIDEO_CONFIG.polling.intervalMs);
    }
  };

  // Check all videos in queue
  const checkQueue = async () => {
    // FIX: Use ref to get current queue state (prevents stale closure)
    const currentQueue = queueRef.current;

    if (currentQueue.length === 0) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Update progress for all processing videos (check mount status)
    if (isMountedRef.current) {
      setQueue((prevQueue) => {
        return prevQueue.map((item) => {
          if (item.status === "processing") {
            const elapsed = (Date.now() - item.startTime) / 1000 / 60; // minutes
            const progress = Math.min(95, (elapsed / item.estimatedDuration) * 100); // Cap at 95% until confirmed
            const estimatedTimeRemaining = Math.max(0, (item.estimatedDuration - elapsed) * 60); // seconds

            // Notify parent component of progress update
            if (onProgressUpdate) {
              onProgressUpdate(item.messageId, progress, estimatedTimeRemaining);
            }

            return { ...item, progress };
          }
          return item;
        });
      });
    }

    // Get processing videos from current queue state
    const processingVideos = currentQueue.filter((item) => item.status === "processing");

    if (processingVideos.length === 0) return;

    // Create new abort controller for this batch of requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Create task functions for concurrent execution
    const checkTasks = processingVideos.map((video) => async () => {
      // Skip polling for temporary task IDs (not yet replaced with real ones)
      if (video.taskId.startsWith('temp-')) {
        console.warn(`⚠️ Skipping poll for temporary task ID: ${video.taskId}`);
        return;
      }

      try {
        const response = await fetch(
          `/api/generate-video?task_id=${video.taskId}&model=${video.model}&type=${video.type}`,
          {
            signal: abortControllerRef.current?.signal,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ Video status check failed:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || errorData.message,
            taskId: video.taskId,
            model: video.model,
            type: video.type,
            url: response.url,
          });

          throw new Error(
            errorData.error ||
            errorData.message ||
            `Failed to check video status (HTTP ${response.status})`
          );
        }

        const data = await response.json();

        if (data.status === "succeed" && data.videos && data.videos.length > 0) {
          const videoUrl = data.videos[0].url;

          console.log("✅ VIDEO READY:", {
            messageId: video.messageId,
            videoUrl,
            taskId: video.taskId,
          });

          // Update queue item (check mount status)
          if (isMountedRef.current) {
            setQueue((prev) =>
              prev.map((item) =>
                item.messageId === video.messageId
                  ? { ...item, status: "succeed", videoUrl, progress: 100 }
                  : item
              )
            );
          }

          // Send browser notification
          sendNotification(video.prompt, "Video erfolgreich generiert!", videoUrl);

          // Send in-app toast notification (extended duration for better visibility)
          toast.success("✅ Video wurde erfolgreich erstellt!", 5000);

          // Callback
          console.log("📞 ABOUT TO CALL onVideoReady callback");
          console.log("📞 Parameters:", { messageId: video.messageId, videoUrl });
          console.log("📞 onVideoReady function exists:", typeof onVideoReady === "function");

          onVideoReady(video.messageId, videoUrl);

          console.log("📞 onVideoReady callback COMPLETED");

          // Remove from queue after 30 seconds (extended for better visibility)
          const timeoutId = setTimeout(() => {
            if (!isMountedRef.current) return; // Don't update state if unmounted
            console.log("🗑️ Removing video from queue:", video.messageId);
            setQueue((prev) => prev.filter((item) => item.messageId !== video.messageId));
            timeoutRefsRef.current.delete(video.messageId);
          }, VIDEO_CONFIG.queue.completedVisibilityMs);
          timeoutRefsRef.current.set(video.messageId, timeoutId);
        } else if (data.status === "failed") {
          const error = data.message || "Video generation failed";

          // Update queue item (check mount status)
          if (isMountedRef.current) {
            setQueue((prev) =>
              prev.map((item) =>
                item.messageId === video.messageId
                  ? { ...item, status: "failed", error }
                  : item
              )
            );
          }

          // Send notification
          sendNotification(video.prompt, "Video-Generierung fehlgeschlagen", undefined, true);

          // Callback
          onVideoFailed(video.messageId, error);

          // Remove from queue after 5 seconds
          const timeoutId = setTimeout(() => {
            if (!isMountedRef.current) return; // Don't update state if unmounted
            setQueue((prev) => prev.filter((item) => item.messageId !== video.messageId));
            timeoutRefsRef.current.delete(video.messageId);
          }, 5000);
          timeoutRefsRef.current.set(video.messageId, timeoutId);
        }
      } catch (error: any) {
        // Ignore AbortError (happens on cleanup)
        if (error.name === 'AbortError') {
          console.log(`Polling aborted for ${video.messageId}`);
          return;
        }

        console.error(`Video polling error for ${video.messageId}:`, error);

        // Update queue item (check mount status)
        if (isMountedRef.current) {
          setQueue((prev) =>
            prev.map((item) =>
              item.messageId === video.messageId
                ? { ...item, status: "failed", error: error.message }
                : item
            )
          );
        }

        onVideoFailed(video.messageId, error.message || "Unknown error");

        const timeoutId = setTimeout(() => {
          if (!isMountedRef.current) return;
          setQueue((prev) => prev.filter((item) => item.messageId !== video.messageId));
          timeoutRefsRef.current.delete(video.messageId);
        }, 5000);
        timeoutRefsRef.current.set(video.messageId, timeoutId);
      }
    });

    // Execute with concurrency limit (max 5 parallel requests)
    await promiseAllWithLimit(checkTasks, VIDEO_CONFIG.queue.maxConcurrentRequests);
  };

  // Send browser notification
  const sendNotification = (
    prompt: string,
    message: string,
    videoUrl?: string,
    isError: boolean = false
  ) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const truncatedPrompt = prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt;
    const notification = new Notification(message, {
      body: truncatedPrompt,
      icon: isError ? "/error-icon.png" : "/video-icon.png",
      badge: "/badge-icon.png",
      tag: `video-${Date.now()}`,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Optionally: scroll to the message
    };
  };

  // Remove a video from queue manually
  const removeFromQueue = (messageId: string) => {
    setQueue((prev) => prev.filter((item) => item.messageId !== messageId));
  };

  // Update task ID in queue (replace temp ID with real ID from API)
  const updateQueueTaskId = (messageId: string, newTaskId: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.messageId === messageId ? { ...item, taskId: newTaskId } : item
      )
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up useVideoQueue...");

      // Clear interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Abort ongoing fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Clear all pending timeouts
      timeoutRefsRef.current.forEach((timeoutId, messageId) => {
        console.log(`🧹 Clearing timeout for ${messageId}`);
        clearTimeout(timeoutId);
      });
      timeoutRefsRef.current.clear();

      console.log("✅ Cleanup complete");
    };
  }, []);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    updateQueueTaskId,
  };
}
