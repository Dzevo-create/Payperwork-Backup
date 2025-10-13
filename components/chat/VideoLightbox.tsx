"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface VideoLightboxProps {
  videoUrl: string | null;
  onClose: () => void;
  videoName?: string;
}

export function VideoLightbox({ videoUrl, onClose, videoName }: VideoLightboxProps) {
  useEffect(() => {
    if (videoUrl) {
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [videoUrl]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!videoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Video Player */}
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full max-h-[70vh] rounded-lg shadow-2xl object-contain"
        />

        {/* Download Button */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-white/70 text-sm">{videoName || "video.mp4"}</p>
          <a
            href={videoUrl}
            download={videoName || "video.mp4"}
            className="px-4 py-2 bg-pw-accent hover:bg-pw-accent-hover text-pw-black font-semibold rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
