"use client";

import { RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

interface ImageGenerationPlaceholderProps {
  className?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9";
  quality?: "standard" | "high" | "ultra";
  style?: string;
}

// Convert aspect ratio string to CSS aspect ratio value
const getAspectRatioValue = (ratio: string): string => {
  switch (ratio) {
    case "1:1": return "1 / 1";
    case "16:9": return "16 / 9";
    case "9:16": return "9 / 16";
    case "4:3": return "4 / 3";
    case "3:2": return "3 / 2";
    case "21:9": return "21 / 9";
    default: return "1 / 1";
  }
};

export function ImageGenerationPlaceholder({
  className = "",
  aspectRatio = "1:1",
  quality = "ultra",
  style
}: ImageGenerationPlaceholderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Cap at 95% until real completion
        return prev + Math.random() * 3;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Dynamic width based on aspect ratio
  const getWidth = () => {
    if (aspectRatio === "9:16") {
      return {
        minWidth: '384px', // max-w-sm (384px)
        maxWidth: '384px',
      };
    }
    return {
      minWidth: '768px', // max-w-3xl (768px)
      maxWidth: '768px',
    };
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-100 border border-pw-black/10 shadow-lg ${className}`}
      style={{
        width: '100%',
        ...getWidth(),
        aspectRatio: getAspectRatioValue(aspectRatio),
      }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pw-accent/5 via-pw-accent/10 to-pw-accent/5 animate-pulse" />
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-pw-accent/5 to-transparent"
          style={{
            animation: 'shimmer 2.5s infinite',
            transform: 'translateX(-100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-8">
        {/* Rotating icon with glow */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-pw-accent/10 blur-xl rounded-full animate-pulse" />
          <RotateCw
            className="relative w-12 h-12 text-pw-accent animate-spin"
            style={{ animationDuration: '2s' }}
          />
        </div>

        {/* Text */}
        <p className="text-pw-black/80 font-medium text-base mb-4 text-center">
          Bild wird generiert...
        </p>

        {/* Settings info - Glassmorphic card */}
        <div className="bg-white/60 backdrop-blur-lg border border-pw-black/10 rounded-lg px-4 py-2.5 shadow-md w-full max-w-md">
          <div className="flex gap-3 text-sm text-pw-black/70 flex-wrap justify-center items-center">
            {style && (
              <>
                <span className="font-semibold text-pw-black capitalize">{style.replace('_', ' ')}</span>
                <span className="text-pw-black/30">•</span>
              </>
            )}
            <span className="font-semibold text-pw-accent">{quality.toUpperCase()}</span>
            <span className="text-pw-black/30">•</span>
            <span>{aspectRatio}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md mt-4">
          <div className="h-2 bg-pw-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-pw-accent rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-pw-black/60 mt-2 text-center font-medium">
            {Math.round(progress)}% abgeschlossen
          </p>
        </div>

        {/* Estimated time */}
        <p className="text-xs text-pw-black/50 mt-3 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-pw-black/10">
          Durchschnittlich ~10-20 Sekunden
        </p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
