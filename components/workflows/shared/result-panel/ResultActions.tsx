/**
 * ResultActions Component
 *
 * Action buttons (Upscale, Crop, Download) and render name input.
 */

"use client";

import { Download, Sparkles, Crop } from "lucide-react";

interface ResultActionsProps {
  mediaType?: "image" | "video";
  renderName?: string;
  onUpscale?: () => void;
  onCrop?: () => void;
  onDownload?: () => void;
  onRenderNameChange?: (name: string) => void;
}

export function ResultActions({
  mediaType = "image",
  renderName = "",
  onUpscale,
  onCrop,
  onDownload,
  onRenderNameChange,
}: ResultActionsProps) {
  return (
    <>
      {/* Upscale Button - Slides down when video/edit mode active */}
      <button
        onClick={onUpscale}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-pw-black text-xs font-medium rounded-lg border border-pw-black/20 hover:bg-pw-black/5 hover:shadow-lg transition-all hover:scale-[1.02]"
      >
        <Sparkles className="w-4 h-4" />
        Upscale 2x
      </button>

      {/* Crop Button - Only show for images */}
      {mediaType === "image" && (
        <button
          onClick={onCrop}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-pw-black text-xs font-medium rounded-lg border border-pw-black/20 hover:bg-pw-black/5 hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          <Crop className="w-4 h-4" />
          Crop
        </button>
      )}

      {/* Download Button - Slides down when video/edit mode active */}
      <button
        onClick={onDownload}
        className="flex items-center justify-center gap-2 px-3 py-2 bg-white text-pw-black text-xs font-medium rounded-lg border border-pw-black/20 hover:bg-pw-black/5 hover:shadow-lg transition-all hover:scale-[1.02]"
      >
        <Download className="w-4 h-4" />
        Download
      </button>

      {/* Render Name Input - Fixed at bottom */}
      <div className="flex-shrink-0 pt-2 px-1 bg-gradient-to-br from-white/80 to-white/70">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-medium text-pw-black/50 uppercase tracking-wide">
            Name
          </label>
          <input
            type="text"
            value={renderName}
            onChange={(e) => onRenderNameChange?.(e.target.value)}
            placeholder="Rendering benennen..."
            className="w-full px-2 py-1.5 text-xs bg-white/80 border border-pw-black/10 rounded-lg outline-none focus:ring-2 focus:ring-pw-accent/50 transition-all"
          />
        </div>
      </div>
    </>
  );
}
