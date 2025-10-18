/**
 * LightboxImage Component
 *
 * Displays the main image/video in the lightbox with empty state fallback.
 */

"use client";

import { ImageIcon } from "lucide-react";

interface LightboxImageProps {
  imageUrl: string | null;
}

export function LightboxImage({ imageUrl }: LightboxImageProps) {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Rendering"
          className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 text-white/60">
          <ImageIcon className="w-16 h-16" />
          <p className="text-lg">Bild nicht verfügbar</p>
        </div>
      )}
    </div>
  );
}
