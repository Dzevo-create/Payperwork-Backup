"use client";

import { Video, Clock, Loader2, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { VideoQueueItem } from "@/hooks/useVideoQueue";
import { useState } from "react";

interface VideoQueuePanelProps {
  queue: VideoQueueItem[];
  onRetry?: (messageId: string) => void;
  onCancel?: (messageId: string) => void;
}

export function VideoQueuePanel({ queue, onRetry, onCancel }: VideoQueuePanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Don't show panel if queue is empty
  if (queue.length === 0) {
    return null;
  }

  // Count by status
  const processing = queue.filter((item) => item.status === "processing").length;
  const succeeded = queue.filter((item) => item.status === "succeed").length;
  const failed = queue.filter((item) => item.status === "failed").length;

  return (
    <div className="fixed bottom-20 right-4 z-50 w-72 bg-white/95 dark:bg-pw-black/95 backdrop-blur-xl rounded-xl shadow-2xl border border-pw-black/10 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-pw-black/5 dark:bg-pw-black/20 border-b border-pw-black/10 cursor-pointer hover:bg-pw-black/10 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-pw-black/60" />
          <span className="text-xs font-medium text-pw-black/80">
            Videos ({queue.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Status badges */}
          {processing > 0 && (
            <div className="flex items-center gap-1 bg-pw-accent/20 rounded px-1.5 py-0.5">
              <Loader2 className="w-2.5 h-2.5 animate-spin text-pw-accent" />
              <span className="text-[10px] font-medium text-pw-black/70">{processing}</span>
            </div>
          )}
          {succeeded > 0 && (
            <div className="flex items-center gap-1 bg-green-500/20 rounded px-1.5 py-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
              <span className="text-[10px] font-medium text-pw-black/70">{succeeded}</span>
            </div>
          )}
          {failed > 0 && (
            <div className="flex items-center gap-1 bg-red-500/20 rounded px-1.5 py-0.5">
              <XCircle className="w-2.5 h-2.5 text-red-600" />
              <span className="text-[10px] font-medium text-pw-black/70">{failed}</span>
            </div>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-pw-black/60 transition-transform ${
              isMinimized ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Queue items */}
      {!isMinimized && (
        <div className="max-h-64 overflow-y-auto">
          {queue.map((item) => (
            <VideoQueueItemCompact
              key={item.messageId}
              item={item}
              onRetry={onRetry}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface VideoQueueItemProps {
  item: VideoQueueItem;
  onRetry?: (messageId: string) => void;
  onCancel?: (messageId: string) => void;
}

function VideoQueueItemCompact({ item, onRetry, onCancel }: VideoQueueItemProps) {
  // REALISTIC PROGRESS: 3-5 minutes for video generation
  const elapsedTime = Math.floor((Date.now() - item.startTime) / 1000);

  // Realistic estimated time based on model and type
  // Kling AI (payperwork-v1): 3-5 min depending on duration/mode
  // fal.ai Sora 2 (payperwork-v2): 1-2 min (faster but still realistic)
  let estimatedTotalSeconds: number;
  if (item.model === "payperwork-v2") {
    // fal.ai is faster: 60-120 seconds
    estimatedTotalSeconds = 90; // 1.5 minutes average
  } else {
    // Kling AI: 180-300 seconds based on actual duration setting
    const duration = parseInt(item.duration || "5");
    estimatedTotalSeconds = duration <= 5 ? 180 : 240; // 3-4 minutes
  }

  // Calculate realistic progress (max 95% until actual completion)
  const rawProgress = (elapsedTime / estimatedTotalSeconds) * 100;
  const progress = item.progress || Math.min(rawProgress, 95);
  const remainingSeconds = Math.max(estimatedTotalSeconds - elapsedTime, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-2.5 border-b border-pw-black/5 last:border-b-0 hover:bg-pw-black/5 transition-colors">
      <div className="flex items-start gap-2">
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {item.status === "processing" && (
            <Loader2 className="w-3.5 h-3.5 text-pw-accent animate-spin" />
          )}
          {item.status === "succeed" && (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          )}
          {item.status === "failed" && (
            <XCircle className="w-3.5 h-3.5 text-red-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Prompt */}
          <p className="text-xs font-medium text-pw-black/80 line-clamp-1">
            {item.prompt.length > 35 ? item.prompt.substring(0, 35) + "..." : item.prompt}
          </p>

          {/* Model & Type badges */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pw-black/10 text-pw-black/60">
              {item.model === "payperwork-v1" ? "v1" : "v2"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-pw-black/10 text-pw-black/60">
              {item.type === "text2video" ? "T2V" : "I2V"}
            </span>
          </div>

          {/* Progress bar (only for processing) */}
          {item.status === "processing" && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-pw-black/60 mb-1">
                <span>{Math.round(progress)}%</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(remainingSeconds)}
                </span>
              </div>
              <div className="w-full h-1 bg-pw-black/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pw-accent transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error message (only for failed) */}
          {item.status === "failed" && item.error && (
            <div className="mt-1.5 text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">
              {item.error.length > 50 ? item.error.substring(0, 50) + "..." : item.error}
            </div>
          )}

          {/* Actions (only for failed) */}
          {item.status === "failed" && (
            <div className="flex items-center gap-1.5 mt-2">
              {onRetry && (
                <button
                  onClick={() => onRetry(item.messageId)}
                  className="text-[10px] px-2 py-1 bg-pw-accent hover:bg-pw-accent-hover text-pw-black rounded transition-colors"
                >
                  Retry
                </button>
              )}
              {onCancel && (
                <button
                  onClick={() => onCancel(item.messageId)}
                  className="text-[10px] px-2 py-1 bg-pw-black/10 hover:bg-pw-black/20 text-pw-black/70 rounded transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
