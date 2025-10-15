"use client";

import { Clock, Download, Video, Sparkles, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";

interface Generation {
  id: string;
  imageUrl: string;
  timestamp: Date;
  prompt?: string;
  preset?: string;
  type?: "image" | "video" | "render" | "upscale";
  sourceType?: "original" | "from_render" | "from_video";
}

interface RecentGenerationsProps {
  generations: Generation[];
  onSelect?: (generation: Generation) => void;
  onDownload?: (generation: Generation) => void;
  onDelete?: (generationId: string) => void;
  onEdit?: (generation: Generation) => void;
  onCreateVideo?: (generation: Generation) => void;
  onUpscale?: (generation: Generation) => void;
}

/**
 * RecentGenerations Component
 *
 * Grid display of recently generated renders
 * Shows thumbnails with hover actions
 */
export function RecentGenerations({
  generations,
  onSelect,
  onDownload,
  onDelete,
  onEdit,
  onCreateVideo,
  onUpscale,
}: RecentGenerationsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Gerade eben";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `vor ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours}h`;
    const days = Math.floor(hours / 24);
    return `vor ${days}d`;
  };

  if (generations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-5 bg-pw-black/5 rounded-xl mb-4">
          <Clock className="w-10 h-10 text-pw-black/30" />
        </div>
        <p className="text-base font-medium text-pw-black/60">
          Keine kürzlichen Generierungen
        </p>
        <p className="text-sm text-pw-black/40 mt-2">
          Deine generierten Renderings erscheinen hier
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 h-full">
      {/* Section Label - Larger */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-xs font-semibold text-pw-black/70 uppercase tracking-wide">
          Kürzliche Generierungen
        </h3>
        <span className="text-xs text-pw-black/50">
          {generations.length} {generations.length === 1 ? "Render" : "Renders"}
        </span>
      </div>

      {/* Horizontal Scrollable Row - Larger cards with padding */}
      <div className="flex gap-3 overflow-x-auto flex-1 min-h-0 scrollbar-thin scrollbar-thumb-pw-black/20 scrollbar-track-transparent hover:scrollbar-thumb-pw-black/30 py-2 px-1">
        {generations.map((gen) => (
          <div
            key={gen.id}
            className="group relative flex-shrink-0 w-80 aspect-video bg-pw-black/5 rounded-xl overflow-hidden border border-pw-black/10 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all hover:border-pw-accent/30"
            onClick={() => onSelect?.(gen)}
            onMouseEnter={() => setHoveredId(gen.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Media - Image or Video */}
            {gen.type === "video" ? (
              <video
                src={gen.imageUrl}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={gen.imageUrl}
                alt={gen.prompt || "Generated render"}
                className="w-full h-full object-cover"
              />
            )}

            {/* Type Badge - Top Left */}
            {(gen.type === "video" || gen.type === "upscale") && (
              <div className="absolute top-3 left-3 z-10">
                {gen.type === "video" ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pw-black/90 backdrop-blur-sm rounded-md">
                    <Video className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wide">
                      Video
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pw-accent/90 backdrop-blur-sm rounded-md">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wide">
                      Upscale
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Overlay with Actions (visible on hover) - More transparent */}
            {hoveredId === gen.id && (
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent flex flex-col justify-between p-4">
                {/* Top Actions */}
                <div className="flex items-start justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(gen.id);
                    }}
                    className="p-2 bg-pw-black hover:bg-red-500 rounded-lg transition-colors shadow-lg"
                    title="Löschen"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Bottom Info + Actions */}
                <div className="flex flex-col gap-3">
                  {/* Info - Black text */}
                  <div>
                    {gen.prompt && (
                      <p className="text-sm font-semibold line-clamp-1 mb-1 text-pw-black">
                        {gen.prompt}
                      </p>
                    )}
                    <p className="text-xs text-pw-black/60">
                      {formatTimeAgo(gen.timestamp)}
                    </p>
                  </div>

                  {/* Action Buttons - More visible */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(gen);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-pw-accent hover:bg-pw-accent/90 text-white text-xs font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateVideo?.(gen);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-pw-black hover:bg-pw-black/90 text-white text-xs font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                      title="Video erstellen"
                    >
                      <Video className="w-4 h-4" />
                      Video
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpscale?.(gen);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-pw-black/5 text-pw-black text-xs font-semibold rounded-lg transition-all border border-pw-black/20 shadow-md hover:shadow-lg"
                      title="Upscale"
                    >
                      <Sparkles className="w-4 h-4" />
                      2x
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload?.(gen);
                      }}
                      className="p-2 bg-white hover:bg-pw-black/5 rounded-lg transition-all border border-pw-black/20 shadow-md hover:shadow-lg"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-pw-black" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
