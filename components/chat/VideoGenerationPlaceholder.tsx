"use client";

import { XCircle, RotateCw } from "lucide-react";

interface VideoGenerationPlaceholderProps {
  model: "payperwork-v1" | "payperwork-v2";
  duration: string;
  aspectRatio: string;
  progress?: number;
  estimatedTimeRemaining?: number; // in seconds
  thumbnailUrl?: string; // If image2video
  status?: "processing" | "succeed" | "failed"; // Add status prop
  error?: string; // Add error message prop
  className?: string; // Accept Tailwind classes from parent
}

export function VideoGenerationPlaceholder({
  model,
  duration,
  aspectRatio,
  progress: _progress = 0,
  estimatedTimeRemaining,
  thumbnailUrl,
  status = "processing",
  error,
  className = "",
}: VideoGenerationPlaceholderProps) {
  const modelName = model === "payperwork-v2" ? "Payperwork Move v2" : "Payperwork Move v1";
  const minutes = estimatedTimeRemaining ? Math.ceil(estimatedTimeRemaining / 60) : null;
  const isFailed = status === "failed";

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className} ${
        isFailed
          ? "bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300"
          : "bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/10 shadow-2xl"
      }`}
      style={{
        width: '100%',
        minWidth: '768px',
        maxWidth: '768px',
      }}
    >
      {/* Aspect ratio container */}
      <div
        className="relative"
        style={{
          width: '100%',
          paddingBottom:
            aspectRatio === "9:16"
              ? "177.78%" // 9:16
              : aspectRatio === "1:1"
              ? "100%" // 1:1
              : "56.25%", // 16:9 (default)
        }}
      >
        {/* Thumbnail or skeleton */}
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50" />
        )}

        {/* Overlay with status - CENTERED CONTENT WITH FULL WIDTH */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 backdrop-blur-md bg-black/20">
          {isFailed ? (
            <>
              {/* Error State */}
              <XCircle className="w-12 h-12 text-red-400 mb-4" />

              <p className="text-white font-semibold text-lg mb-2 text-center w-full">
                ❌ Video-Generierung fehlgeschlagen
              </p>

              {/* Error message */}
              {error && (
                <p className="text-red-300 text-sm mb-4 text-center w-full max-w-md">
                  {error}
                </p>
              )}

              {/* Video settings info */}
              <div className="flex gap-3 text-xs text-white/70 flex-wrap justify-center w-full">
                <span className="font-medium">{modelName}</span>
                <span>•</span>
                <span>{duration}s</span>
                <span>•</span>
                <span>{aspectRatio}</span>
              </div>

              <p className="text-white/60 text-xs mt-4 text-center w-full">
                Diese Nachricht verschwindet automatisch in 5 Sekunden
              </p>
            </>
          ) : (
            <>
              {/* Processing State */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gray-400/20 blur-xl rounded-full animate-pulse" />
                <RotateCw className="relative w-10 h-10 text-gray-300 animate-spin" style={{ animationDuration: '2s' }} />
              </div>

              <p className="text-white font-medium text-base mb-4 text-center w-full">
                Video wird generiert...
              </p>

              {/* Video settings info - Glassmorphic card */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg px-4 py-2.5 shadow-xl w-full max-w-md">
                <div className="flex gap-3 text-sm text-gray-200 flex-wrap justify-center">
                  <span className="font-semibold text-white">{modelName}</span>
                  <span className="text-white/40">•</span>
                  <span>{duration}s</span>
                  <span className="text-white/40">•</span>
                  <span>{aspectRatio}</span>
                </div>
              </div>

              {/* Estimated time remaining */}
              {minutes !== null && minutes > 0 && (
                <p className="text-xs text-gray-300 mt-3 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 w-auto">
                  Verbleibend: ~{minutes} {minutes === 1 ? "Minute" : "Minuten"}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
