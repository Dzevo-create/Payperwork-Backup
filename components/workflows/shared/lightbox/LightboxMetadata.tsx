/**
 * LightboxMetadata Component
 *
 * Sidebar displaying all metadata: title, date, model, settings, prompts, source image.
 */

"use client";

import { Download, Calendar, Sparkles, ImageIcon } from "lucide-react";
import { SketchToRenderSettingsType } from "@/types/workflows/sketchToRenderSettings";
import { formatDate, getModelName, getSettingLabel } from "@/utils/lightboxHelpers";

interface RenderItem {
  id: string;
  imageUrl: string;
  timestamp: Date;
  name?: string;
  prompt?: string;
  enhancedPrompt?: string;
  settings?: SketchToRenderSettingsType;
  type?: "image" | "video" | "render" | "upscale";
  sourceImageUrl?: string;
}

interface LightboxMetadataProps {
  item: RenderItem;
  onDownload: () => void;
}

export function LightboxMetadata({ item, onDownload }: LightboxMetadataProps) {
  const modelName = getModelName(item.type);

  return (
    <div className="w-80 h-full flex flex-col bg-white/95 backdrop-blur-lg rounded-2xl p-6 overflow-y-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-pw-black/60" />
          <span className="text-pw-black/60 text-sm uppercase tracking-wide">
            {item.type === "video" ? "Video" : item.type === "upscale" ? "Upscale" : "Rendering"}
          </span>
        </div>
        <button
          onClick={onDownload}
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
  );
}
