/**
 * ResultDisplay Component
 *
 * Displays the result (image/video), loading state, or empty state.
 */

"use client";

import { Loader2, Sparkles } from "lucide-react";

interface ResultDisplayProps {
  imageUrl: string | null;
  mediaType?: "image" | "video";
  isGenerating: boolean;
  generatingType?: "render" | "video" | "upscale" | "edit";
  onImageClick?: () => void;
}

export function ResultDisplay({
  imageUrl,
  mediaType,
  isGenerating,
  generatingType,
  onImageClick,
}: ResultDisplayProps) {
  return (
    <div className="flex-[3] min-w-0">
      <div className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-pw-black/5 to-pw-black/10 rounded-lg ${
        !imageUrl && !isGenerating ? "border border-pw-black/20" : "p-3"
      }`}>
      {isGenerating ? (
        // Loading State - Larger
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-pw-accent animate-spin" />
          <div className="text-center">
            <p className="text-base font-medium text-pw-black/70">
              {generatingType === "video" && "Video wird generiert..."}
              {generatingType === "upscale" && "Bild wird upscaled..."}
              {generatingType === "edit" && "Bild wird bearbeitet..."}
              {generatingType === "render" && "Rendering wird generiert..."}
            </p>
            <p className="text-sm text-pw-black/50 mt-2">
              30-60 Sekunden
            </p>
          </div>
        </div>
      ) : imageUrl ? (
        // Generated Media (Image or Video) with border - object-contain to show full result
        mediaType === "video" ? (
          <video
            src={imageUrl}
            onClick={onImageClick}
            className="max-w-full max-h-full object-contain border border-pw-black/20 rounded-lg cursor-pointer"
            autoPlay
            loop
            muted
            playsInline
            controls
          />
        ) : (
          <img
            src={imageUrl}
            alt="Generated render"
            onClick={onImageClick}
            className="max-w-full max-h-full object-contain border border-pw-black/20 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          />
        )
      ) : (
        // Empty State - Larger
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="p-4 bg-pw-black/5 rounded-xl">
            <Sparkles className="w-8 h-8 text-pw-black/30" />
          </div>
          <div>
            <p className="text-base font-medium text-pw-black/60">
              Noch kein Rendering
            </p>
            <p className="text-sm text-pw-black/40 mt-2">
              Lade ein Ausgangsbild hoch
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
