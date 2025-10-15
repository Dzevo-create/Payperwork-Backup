"use client";

import { useEffect } from "react";
import { X, Download, ChevronLeft, ChevronRight, Calendar, Sparkles, ImageIcon } from "lucide-react";
import { RenderSettingsType } from "@/types/workflows/renderSettings";

interface RenderItem {
  id: string;
  imageUrl: string;
  timestamp: Date;
  name?: string;
  prompt?: string;
  enhancedPrompt?: string;
  settings?: RenderSettingsType;
  type?: "image" | "video" | "render" | "upscale";
  sourceImageUrl?: string; // Original input image
}

interface RenderLightboxProps {
  isOpen: boolean;
  item: RenderItem;
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onDownload?: (item: RenderItem) => void;
}

export function RenderLightbox({ isOpen, item, onClose, onNavigate, hasNext, hasPrev, onDownload }: RenderLightboxProps) {
  // Debug: Log item data
  useEffect(() => {
    if (isOpen) {
      console.log("[Lightbox] Item data:", {
        type: item.type,
        hasSourceImage: !!item.sourceImageUrl,
        sourceImageUrl: item.sourceImageUrl?.substring(0, 50) + "...",
        name: item.name,
      });
    }
  }, [isOpen, item]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev && onNavigate) {
        onNavigate("prev");
      } else if (e.key === "ArrowRight" && hasNext && onNavigate) {
        onNavigate("next");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNavigate, hasNext, hasPrev]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDownloadClick = () => {
    if (onDownload) {
      // Use parent's download function if provided
      onDownload(item);
    } else {
      // Fallback to simple download (won't work for all cases)
      if (!item.imageUrl) return;
      const a = document.createElement("a");
      a.href = item.imageUrl;
      const extension = item.type === "video" ? ".mp4" : ".jpg";
      a.download = `${item.name || `render-${item.id}`}${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get type-specific model name
  const getModelName = () => {
    switch (item.type) {
      case "video":
        return "Payperwork v.Turbo";
      case "upscale":
        return "Payperwork Upscaler";
      default:
        return "Payperwork Flash v.1";
    }
  };

  const modelName = getModelName();

  const getSettingLabel = (key: string, value: string | null) => {
    if (!value) return null;

    const labels: { [key: string]: { [value: string]: string } } = {
      spaceType: {
        interior: "Innenraum",
        exterior: "Außenbereich",
      },
      designStyle: {
        modern: "Modern",
        minimalist: "Minimalistisch",
        mediterranean: "Mediterran",
        scandinavian: "Skandinavisch",
        industrial: "Industrial",
        classical: "Klassisch",
        contemporary: "Zeitgenössisch",
        rustic: "Rustikal",
        bauhaus: "Bauhaus",
        "art-deco": "Art Deco",
        japanese: "Japanisch",
        tropical: "Tropisch",
        brutalist: "Brutalistisch",
      },
      renderStyle: {
        hyperrealistic: "Hyperrealistisch",
        photorealistic: "Fotorealistisch",
        "3d-render": "3D Render",
        "architectural-visualization": "Architekturvisualisierung",
        "concept-art": "Concept Art",
      },
      timeOfDay: {
        morning: "Morgen",
        midday: "Mittag",
        afternoon: "Nachmittag",
        evening: "Abend",
        night: "Nacht",
      },
      season: {
        spring: "Frühling",
        summer: "Sommer",
        autumn: "Herbst",
        winter: "Winter",
      },
      weather: {
        sunny: "Sonnig",
        cloudy: "Bewölkt",
        rainy: "Regnerisch",
        foggy: "Neblig",
      },
      quality: {
        ultra: "Ultra",
        high: "Hoch",
        standard: "Standard",
      },
    };

    return labels[key]?.[value] || value;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-pw-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all z-10 shadow-lg"
        title="Schließen (ESC)"
      >
        <X className="w-5 h-5 text-pw-black" />
      </button>

      {/* Navigation Buttons */}
      {hasPrev && onNavigate && (
        <button
          onClick={() => onNavigate("prev")}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-pw-black/80 hover:bg-pw-black/90 flex items-center justify-center transition-all z-10"
          title="Vorheriges (←)"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {hasNext && onNavigate && (
        <button
          onClick={() => onNavigate("next")}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-pw-black/80 hover:bg-pw-black/90 flex items-center justify-center transition-all z-10"
          title="Nächstes (→)"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-center gap-8 h-full w-full px-20 py-16">
        {/* Image Display */}
        <div className="flex-1 flex items-center justify-center h-full">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
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

        {/* Metadata Sidebar */}
        <div className="w-80 h-full flex flex-col bg-white/95 backdrop-blur-lg rounded-2xl p-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-pw-black/60" />
              <span className="text-pw-black/60 text-sm uppercase tracking-wide">
                {item.type === "video" ? "Video" : item.type === "upscale" ? "Upscale" : "Rendering"}
              </span>
            </div>
            <button
              onClick={handleDownloadClick}
              className="px-3 py-1.5 rounded-full bg-pw-black/10 hover:bg-pw-black/20 flex items-center gap-2 text-pw-black text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          {/* Title */}
          <h2 className="text-pw-black text-xl font-semibold mb-6 break-words">
            {item.name || "Rendering"}
          </h2>

          {/* Details */}
          <div className="space-y-4">
            {/* Created Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-pw-black/60 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-1">Erstellt</p>
                <p className="text-pw-black text-sm">{formatDate(item.timestamp)}</p>
              </div>
            </div>

            {/* Model */}
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-pw-black/60 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-1">Modell</p>
                <p className="text-pw-black text-sm font-medium">{modelName}</p>
              </div>
            </div>

            {/* Source/Input Image */}
            {item.sourceImageUrl && (
              <div className="pt-4 mt-4 border-t border-pw-black/10">
                <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-2">Input Bild</p>
                <div className="rounded-lg overflow-hidden border border-pw-black/10">
                  <img
                    src={item.sourceImageUrl}
                    alt="Input"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}

            {/* Settings */}
            {item.settings && (
              <div className="pt-4 mt-4 border-t border-pw-black/10">
                <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-3">Einstellungen</p>
                <div className="space-y-2">
                  {item.settings.spaceType && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pw-black/60">Raumtyp:</span>
                      <span className="text-pw-black">
                        {getSettingLabel("spaceType", item.settings.spaceType)}
                      </span>
                    </div>
                  )}
                  {item.settings.designStyle && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pw-black/60">Design-Stil:</span>
                      <span className="text-pw-black">
                        {getSettingLabel("designStyle", item.settings.designStyle)}
                      </span>
                    </div>
                  )}
                  {item.settings.renderStyle && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pw-black/60">Render-Stil:</span>
                      <span className="text-pw-black">
                        {getSettingLabel("renderStyle", item.settings.renderStyle)}
                      </span>
                    </div>
                  )}
                  {item.settings.timeOfDay && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pw-black/60">Tageszeit:</span>
                      <span className="text-pw-black">
                        {getSettingLabel("timeOfDay", item.settings.timeOfDay)}
                      </span>
                    </div>
                  )}
                  {item.settings.season && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pw-black/60">Jahreszeit:</span>
                      <span className="text-pw-black">
                        {getSettingLabel("season", item.settings.season)}
                      </span>
                    </div>
                  )}
                  {item.settings.weather && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pw-black/60">Wetter:</span>
                      <span className="text-pw-black">
                        {getSettingLabel("weather", item.settings.weather)}
                      </span>
                    </div>
                  )}
                  {item.settings.quality && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pw-black/60">Qualität:</span>
                      <span className="text-pw-black">
                        {getSettingLabel("quality", item.settings.quality)}
                      </span>
                    </div>
                  )}
                  {item.settings.aspectRatio && (
                    <div className="flex justify-between text-sm">
                      <span className="text-pw-black/60">Seitenverhältnis:</span>
                      <span className="text-pw-black">{item.settings.aspectRatio}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Original Prompt */}
            {item.prompt && (
              <div className="pt-4 mt-4 border-t border-pw-black/10">
                <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-2">Prompt</p>
                <p className="text-pw-black/80 text-sm leading-relaxed">{item.prompt}</p>
              </div>
            )}

            {/* Enhanced Prompt */}
            {item.enhancedPrompt && item.enhancedPrompt !== item.prompt && (
              <div className="pt-4 mt-4 border-t border-pw-black/10">
                <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-2">
                  Verbesserter Prompt (GPT-4o)
                </p>
                <p className="text-pw-black/80 text-sm leading-relaxed">{item.enhancedPrompt}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
