import { useEffect, useRef, useState } from "react";
import type { VideoModel, VideoType } from "@/types/video";
import { useToast } from "@/hooks/useToast";
import { VIDEO_CONFIG } from "@/lib/video/config/videoConfig";
import { promiseAllWithLimit } from "@/lib/utils/concurrency";
import { videoCache } from "@/lib/utils/videoCache";
import { logger } from '@/lib/logger';

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
  retryCount?: number; // Track consecutive failures for retry limit
  consecutiveErrors?: number; // Track consecutive errors for auto-fail
  // Video settings for accurate metadata and progress calculation
  duration?: string; // Video duration setting (e.g., "5", "10")
  aspectRatio?: string; // Video aspect ratio (e.g., "16:9", "9:16")
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
    estimatedDuration: number = 8, // Default 8 minutes
    duration?: string, // Video duration setting
    aspectRatio?: string // Video aspect ratio setting
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
      retryCount: 0,
      consecutiveErrors: 0,
      duration,
      aspectRatio,
    };

    logger.debug('➕ [addToQueue] Adding to queue:', {
      messageId,
      taskId,
      model,
      type,
    });

    // FIX: Use callback form to ensure atomic update
    setQueue((prev) => {
      const updated = [...prev, newItem];
      logger.info('[addToQueue] Queue updated, new length:');
      return updated;
    });

    // Start polling if not already running
    if (!pollIntervalRef.current) {
      logger.debug('⏯️ [addToQueue] Starting polling interval');
      pollIntervalRef.current = setInterval(checkQueue, VIDEO_CONFIG.polling.intervalMs);
    }
  };

  // Check all videos in queue
  const checkQueue = async () => {
    // FIX: Use ref to get current queue state (prevents stale closure)
    const currentQueue = queueRef.current;

    logger.debug('[Queue Check] Current queue:', {
      totalItems: currentQueue.length,
      items: currentQueue.map(q => ({
        messageId: q.messageId,
        taskId: q.taskId,
        status: q.status,
        model: q.model,
      }))
    });

    // FIX: Check if unmounted before any operations
    if (!isMountedRef.current) {
      logger.warn('⏹️ [Queue Check] Component unmounted - skipping check');
      return;
    }

    if (currentQueue.length === 0) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        logger.debug('⏹️ [Queue Check] Queue empty - stopping polling');
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
            if (onProgressUpdate && isMountedRef.current) {
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

    logger.info('[Queue Check] Processing videos:');

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
        logger.warn('[Poll Skip] Temporary task ID not yet replaced: ${video.taskId} (messageId: ${video.messageId})');
        return;
      }

      logger.info('[Poll] Checking video status:', {
        messageId: video.messageId,
        taskId: video.taskId,
        model: video.model,
        type: video.type,
      });

      try {
        const url = `/api/generate-video?task_id=${video.taskId}&model=${video.model}&type=${video.type}`;
        logger.debug('🌐 [Poll] Fetching: ${url}');

        const response = await fetch(url, {
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error('[Poll] Video status check failed:', {
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

        logger.debug('📦 [Poll] Status response:', {
          messageId: video.messageId,
          taskId: video.taskId,
          status: data.status,
          hasVideos: !!data.videos && data.videos.length > 0,
          videoUrl: data.videos?.[0]?.url,
        });

        if (data.status === "succeed" && data.videos && data.videos.length > 0) {
          const videoUrl = data.videos[0].url;

          logger.info('VIDEO READY:', {
            messageId: video.messageId,
            videoUrl,
            taskId: video.taskId,
          });

          // FIX: Check if unmounted before any state updates or callbacks
          if (!isMountedRef.current) {
            logger.warn('⏹️ Component unmounted - skipping video completion');
            return;
          }

          // Cache the video for faster access
          videoCache.set({
            videoUrl,
            taskId: video.taskId,
            model: video.model,
          });

          // Update queue item (check mount status)
          if (isMountedRef.current) {
            setQueue((prev) =>
              prev.map((item) =>
                item.messageId === video.messageId
                  ? { ...item, status: "succeed", videoUrl, progress: 100, consecutiveErrors: 0 }
                  : item
              )
            );
          }

          // Send browser notification
          sendNotification(video.prompt, "Video erfolgreich generiert!", videoUrl);

          // Send in-app toast notification (extended duration for better visibility)
          toast.success("✅ Video wurde erfolgreich erstellt!", 5000);

          // Callback - check mount status before calling
          if (isMountedRef.current) {
            logger.debug('📞 ABOUT TO CALL onVideoReady callback');
            logger.debug('📞 Parameters:', { messageId: video.messageId, videoUrl });
            logger.debug('📞 onVideoReady function exists:');

            onVideoReady(video.messageId, videoUrl);

            logger.debug('📞 onVideoReady callback COMPLETED');
          }

          // Remove from queue after 30 seconds (extended for better visibility)
          const timeoutId = setTimeout(() => {
            if (!isMountedRef.current) return; // Don't update state if unmounted
            logger.debug('🗑️ Removing video from queue:');
            setQueue((prev) => prev.filter((item) => item.messageId !== video.messageId));
            timeoutRefsRef.current.delete(video.messageId);
          }, VIDEO_CONFIG.queue.completedVisibilityMs);
          timeoutRefsRef.current.set(video.messageId, timeoutId);
        } else if (data.status === "failed") {
          const error = data.message || "Video generation failed";

          // FIX: Check if unmounted before any state updates or callbacks
          if (!isMountedRef.current) {
            logger.warn('⏹️ Component unmounted - skipping video failure handling');
            return;
          }

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

          // Callback - check mount status before calling
          if (isMountedRef.current) {
            onVideoFailed(video.messageId, error);
          }

          // Remove from queue after 5 seconds
          const timeoutId = setTimeout(() => {
            if (!isMountedRef.current) return; // Don't update state if unmounted
            setQueue((prev) => prev.filter((item) => item.messageId !== video.messageId));
            timeoutRefsRef.current.delete(video.messageId);
          }, 5000);
          timeoutRefsRef.current.set(video.messageId, timeoutId);
        }
      } catch (error) {
        // Ignore AbortError (happens on cleanup)
        if (error instanceof Error && error.name === 'AbortError') {
          logger.debug('Polling aborted for ${video.messageId}');
          return;
        }

        logger.error('Video polling error for ${video.messageId}:', error);

        // Get current queue item to check consecutive errors
        const currentItem = queueRef.current.find(item => item.messageId === video.messageId);
        const consecutiveErrors = (currentItem?.consecutiveErrors || 0) + 1;
        const MAX_CONSECUTIVE_ERRORS = 10; // Auto-fail after 10 consecutive polling failures

        logger.warn('Consecutive errors for ${video.messageId}: ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}');

        // Check if we've exceeded the retry limit
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          logger.error('Max retry limit reached for ${video.messageId}. Marking as failed.');

          // FIX: Check if unmounted before any state updates or callbacks
          if (!isMountedRef.current) {
            logger.warn('⏹️ Component unmounted - skipping max retry failure handling');
            return;
          }

          // Permanently mark as failed
          if (isMountedRef.current) {
            setQueue((prev) =>
              prev.map((item) =>
                item.messageId === video.messageId
                  ? {
                      ...item,
                      status: "failed",
                      error: `Video generation failed after ${MAX_CONSECUTIVE_ERRORS} attempts: ${error instanceof Error ? error.message : String(error)}`
                    }
                  : item
              )
            );
          }

          // Notify failure - check mount status before calling
          if (isMountedRef.current) {
            onVideoFailed(
              video.messageId,
              `Video generation failed after ${MAX_CONSECUTIVE_ERRORS} attempts: ${error instanceof Error ? error.message : String(error)}`
            );
          }

          // Remove from queue after 5 seconds
          const timeoutId = setTimeout(() => {
            if (!isMountedRef.current) return;
            setQueue((prev) => prev.filter((item) => item.messageId !== video.messageId));
            timeoutRefsRef.current.delete(video.messageId);
          }, 5000);
          timeoutRefsRef.current.set(video.messageId, timeoutId);
        } else {
          // Increment error count but keep trying
          if (isMountedRef.current) {
            setQueue((prev) =>
              prev.map((item) =>
                item.messageId === video.messageId
                  ? { ...item, consecutiveErrors, error: error instanceof Error ? error.message : String(error) }
                  : item
              )
            );
          }

          logger.error('Will retry polling for ${video.messageId} (attempt ${consecutiveErrors + 1})');
        }
      }
    });

    // Execute with concurrency limit (max 5 parallel requests)
    await promiseAllWithLimit(checkTasks, VIDEO_CONFIG.queue.maxConcurrentRequests);
  };

  // Send browser notification
  const sendNotification = (
    prompt: string,
    message: string,
    _videoUrl?: string,
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
    logger.info('[updateQueueTaskId] Updating task ID:', {
      messageId,
      newTaskId,
      currentQueue: queueRef.current.map(q => ({ msgId: q.messageId, taskId: q.taskId })),
    });

    // FIX: Use callback form to ensure we're working with latest state
    setQueue((prevQueue) => {
      const updated = prevQueue.map((item) =>
        item.messageId === messageId ? { ...item, taskId: newTaskId } : item
      );

      logger.info('[updateQueueTaskId] Updated queue:', {
        found: updated.some(item => item.messageId === messageId),
        newTaskId,
      });

      return updated;
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logger.debug('Cleaning up useVideoQueue...');

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
      timeoutRefsRef.current.forEach((timeoutId, _messageId) => {
        logger.debug('Clearing timeout for ${_messageId}');
        clearTimeout(timeoutId);
      });
      timeoutRefsRef.current.clear();

      logger.info('Cleanup complete');
    };
  }, []);

  // Mark a video as completed (for immediate completions like fal.ai)
  const markVideoCompleted = (messageId: string, videoUrl: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.messageId === messageId
          ? { ...item, status: "succeed", videoUrl, progress: 100, consecutiveErrors: 0 }
          : item
      )
    );

    // Remove from queue after delay for visibility
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;
      setQueue((prev) => prev.filter((item) => item.messageId !== messageId));
      timeoutRefsRef.current.delete(messageId);
    }, VIDEO_CONFIG.queue.completedVisibilityMs);
    timeoutRefsRef.current.set(messageId, timeoutId);
  };

  return {
    queue,
    addToQueue,
    removeFromQueue,
    updateQueueTaskId,
    markVideoCompleted,
  };
}
