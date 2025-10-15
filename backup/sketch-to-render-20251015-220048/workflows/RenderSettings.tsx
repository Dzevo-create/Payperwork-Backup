"use client";

import {
  Home,
  TreePine,
  RectangleHorizontal,
  Palette,
  Sun,
  Calendar,
  Cloud,
  Sparkles,
  Zap,
  ChevronDown
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { RenderSettingsType } from "@/types/workflows/renderSettings";

// Options Definitions
const SPACE_TYPES = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
] as const;

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 Landscape" },
  { value: "9:16", label: "9:16 Portrait" },
  { value: "1:1", label: "1:1 Quadrat" },
  { value: "4:3", label: "4:3 Classic" },
] as const;

const DESIGN_STYLES = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Modern Minimalistisch" },
  { value: "mediterranean", label: "Mediterran" },
  { value: "scandinavian", label: "Skandinavisch" },
  { value: "industrial", label: "Industrial" },
  { value: "contemporary", label: "Contemporary" },
  { value: "rustic", label: "Rustikal" },
  { value: "bauhaus", label: "Bauhaus" },
  { value: "art-deco", label: "Art Deco" },
  { value: "japanese", label: "Japanisch" },
  { value: "brutalist", label: "Brutalistisch" },
] as const;

const RENDER_STYLES = [
  { value: "hyperrealistic", label: "Hyperrealistisch" },
  { value: "photorealistic", label: "Photorealistisch" },
  { value: "3d-render", label: "3D Render" },
  { value: "architectural-visualization", label: "Architekturvisualisierung" },
  { value: "concept-art", label: "Concept Art" },
] as const;

const TIME_OF_DAY = [
  { value: "morning", label: "Morgens" },
  { value: "midday", label: "Mittags" },
  { value: "afternoon", label: "Nachmittags" },
  { value: "evening", label: "Abends" },
  { value: "night", label: "Nachts" },
] as const;

const SEASONS = [
  { value: "spring", label: "Frühling" },
  { value: "summer", label: "Sommer" },
  { value: "autumn", label: "Herbst" },
  { value: "winter", label: "Winter" },
] as const;

const WEATHER = [
  { value: "sunny", label: "Sonnig" },
  { value: "cloudy", label: "Bewölkt" },
  { value: "rainy", label: "Regnerisch" },
  { value: "foggy", label: "Neblig" },
] as const;

const QUALITY = [
  { value: "ultra", label: "Ultra" },
  { value: "high", label: "High" },
  { value: "standard", label: "Standard" },
] as const;

interface RenderSettingsProps {
  settings: RenderSettingsType;
  onSettingsChange: (settings: RenderSettingsType) => void;
}

type DropdownType = "spaceType" | "aspect" | "designStyle" | "renderStyle" | "time" | "season" | "weather" | "quality" | null;

/**
 * RenderSettings Component
 *
 * Horizontal settings bar for Sketch-to-Render workflow
 * Similar to ImageSettings/VideoSettings pattern
 */
export function RenderSettings({ settings, onSettingsChange }: RenderSettingsProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown && !Object.values(dropdownRefs.current).some(ref => ref?.contains(e.target as Node))) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const getCurrentLabel = (type: string) => {
    switch (type) {
      case "spaceType":
        if (!settings.spaceType) return "Space Type";
        return settings.spaceType === "interior" ? "Interior" : "Exterior";
      case "aspect":
        return settings.aspectRatio || "Aspect Ratio";
      case "designStyle":
        if (!settings.designStyle) return "Design-Stil";
        const designStyle = DESIGN_STYLES.find(s => s.value === settings.designStyle);
        return designStyle?.label.split(" ")[0] || "Design-Stil";
      case "renderStyle":
        if (!settings.renderStyle) return "Render-Stil";
        const renderStyle = RENDER_STYLES.find(s => s.value === settings.renderStyle);
        return renderStyle?.label || "Render-Stil";
      case "time":
        if (!settings.timeOfDay) return "Zeit";
        const time = TIME_OF_DAY.find(t => t.value === settings.timeOfDay);
        return time?.label || "Zeit";
      case "season":
        if (!settings.season) return "Saison";
        const season = SEASONS.find(s => s.value === settings.season);
        return season?.label || "Saison";
      case "weather":
        if (!settings.weather) return "Wetter";
        const weather = WEATHER.find(w => w.value === settings.weather);
        return weather?.label || "Wetter";
      case "quality":
        if (!settings.quality) return "Qualität";
        return settings.quality === "ultra" ? "Ultra" : settings.quality === "high" ? "High" : "Std";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {/* Space Type */}
      <div className="relative" ref={el => { dropdownRefs.current["spaceType"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "spaceType" ? null : "spaceType")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "spaceType" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          {!settings.spaceType ? (
            <Home className={`w-3 h-3 transition-colors ${openDropdown === "spaceType" ? "text-pw-accent" : "text-pw-black/40"}`} />
          ) : settings.spaceType === "interior" ? (
            <Home className={`w-3 h-3 transition-colors ${openDropdown === "spaceType" ? "text-pw-accent" : "text-pw-black/40"}`} />
          ) : (
            <TreePine className={`w-3 h-3 transition-colors ${openDropdown === "spaceType" ? "text-pw-accent" : "text-pw-black/40"}`} />
          )}
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("spaceType")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "spaceType" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "spaceType" && (
          <div className="absolute bottom-full mb-2 right-0 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Default Button */}
            <button
              onClick={() => {
                onSettingsChange({ ...settings, spaceType: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.spaceType === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.spaceType === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {SPACE_TYPES.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, spaceType: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.spaceType === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.spaceType === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Aspect Ratio */}
      <div className="relative" ref={el => { dropdownRefs.current["aspect"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "aspect" ? null : "aspect")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "aspect" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <RectangleHorizontal className={`w-3 h-3 transition-colors ${openDropdown === "aspect" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("aspect")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "aspect" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "aspect" && (
          <div className="absolute bottom-full mb-2 right-0 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Default Button */}
            <button
              onClick={() => {
                onSettingsChange({ ...settings, aspectRatio: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.aspectRatio === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.aspectRatio === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {ASPECT_RATIOS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, aspectRatio: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.aspectRatio === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.aspectRatio === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Design-Stil */}
      <div className="relative" ref={el => { dropdownRefs.current["designStyle"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "designStyle" ? null : "designStyle")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "designStyle" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Palette className={`w-3 h-3 transition-colors ${openDropdown === "designStyle" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("designStyle")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "designStyle" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "designStyle" && (
          <div className="absolute bottom-full mb-2 right-0 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Default Button */}
            <button
              onClick={() => {
                onSettingsChange({ ...settings, designStyle: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.designStyle === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.designStyle === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {DESIGN_STYLES.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, designStyle: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.designStyle === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.designStyle === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Render-Stil */}
      <div className="relative" ref={el => { dropdownRefs.current["renderStyle"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "renderStyle" ? null : "renderStyle")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "renderStyle" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Sparkles className={`w-3 h-3 transition-colors ${openDropdown === "renderStyle" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("renderStyle")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "renderStyle" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "renderStyle" && (
          <div className="absolute bottom-full mb-2 right-0 w-60 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Default Button */}
            <button
              onClick={() => {
                onSettingsChange({ ...settings, renderStyle: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.renderStyle === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.renderStyle === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {RENDER_STYLES.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, renderStyle: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.renderStyle === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.renderStyle === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Time of Day */}
      <div className="relative" ref={el => { dropdownRefs.current["time"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "time" ? null : "time")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "time" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Sun className={`w-3 h-3 transition-colors ${openDropdown === "time" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("time")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "time" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "time" && (
          <div className="absolute bottom-full mb-2 right-0 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Default Button */}
            <button
              onClick={() => {
                onSettingsChange({ ...settings, timeOfDay: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.timeOfDay === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.timeOfDay === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {TIME_OF_DAY.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, timeOfDay: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.timeOfDay === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.timeOfDay === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Season */}
      <div className="relative" ref={el => { dropdownRefs.current["season"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "season" ? null : "season")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "season" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Calendar className={`w-3 h-3 transition-colors ${openDropdown === "season" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("season")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "season" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "season" && (
          <div className="absolute bottom-full mb-2 right-0 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Default Button */}
            <button
              onClick={() => {
                onSettingsChange({ ...settings, season: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.season === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.season === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {SEASONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, season: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.season === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.season === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Weather */}
      <div className="relative" ref={el => { dropdownRefs.current["weather"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "weather" ? null : "weather")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "weather" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Cloud className={`w-3 h-3 transition-colors ${openDropdown === "weather" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("weather")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "weather" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "weather" && (
          <div className="absolute bottom-full mb-2 right-0 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Default Button */}
            <button
              onClick={() => {
                onSettingsChange({ ...settings, weather: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.weather === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.weather === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {WEATHER.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, weather: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.weather === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.weather === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quality */}
      <div className="relative" ref={el => { dropdownRefs.current["quality"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "quality" ? null : "quality")}
          className={`group flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "quality" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Zap className={`w-3 h-3 transition-colors ${openDropdown === "quality" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">{getCurrentLabel("quality")}</span>
          <ChevronDown className={`w-2.5 h-2.5 text-pw-black/40 transition-transform duration-200 ${openDropdown === "quality" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "quality" && (
          <div className="absolute bottom-full mb-2 right-0 w-52 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Default Button */}
            <button
              onClick={() => {
                onSettingsChange({ ...settings, quality: null });
                setOpenDropdown(null);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-pw-black/10 ${
                settings.quality === null
                  ? "bg-pw-accent text-white font-medium"
                  : "text-pw-black/50 hover:bg-pw-black/5 italic"
              }`}
            >
              <span className="flex items-center gap-2">
                {settings.quality === null && <span className="text-xs">✓</span>}
                Default
              </span>
            </button>

            {QUALITY.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, quality: option.value });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.quality === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.quality === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
