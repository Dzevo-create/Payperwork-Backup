"use client";

import { Palette, Sun, Zap, RectangleHorizontal, Sparkles, ChevronDown, Copy } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  IMAGE_PRESETS,
  IMAGE_STYLES,
  LIGHTING_OPTIONS,
  QUALITY_OPTIONS,
  ASPECT_RATIOS,
  NUM_IMAGES_OPTIONS,
  getPresetDefaults,
  type ImageSettingsType,
  type ImagePresetKey
} from "@/config/imageSettings";

interface ImageSettingsProps {
  settings: ImageSettingsType;
  onSettingsChange: (settings: ImageSettingsType) => void;
}

type DropdownType = "preset" | "style" | "lighting" | "quality" | "aspect" | "numImages" | null;

export default function ImageSettings({ settings, onSettingsChange }: ImageSettingsProps) {
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

  const handlePresetChange = (presetId: ImagePresetKey) => {
    const presetDefaults = getPresetDefaults(presetId);
    onSettingsChange({
      ...settings,
      preset: presetId,
      style: presetDefaults.style ?? settings.style,
      lighting: presetDefaults.lighting ?? settings.lighting,
      quality: presetDefaults.quality ?? settings.quality,
      aspectRatio: presetDefaults.aspectRatio ?? settings.aspectRatio,
    });
    setOpenDropdown(null);
  };

  const getCurrentLabel = (type: string) => {
    switch (type) {
      case "preset":
        const preset = IMAGE_PRESETS[settings.preset as ImagePresetKey] || IMAGE_PRESETS.none;
        return preset.icon || "✨";
      case "style":
        if (!settings.style) return "Auto";
        const style = IMAGE_STYLES.find(s => s.value === settings.style);
        return style?.label.split(" ")[0] || "Auto";
      case "lighting":
        if (!settings.lighting) return "Auto";
        const lighting = LIGHTING_OPTIONS.find(l => l.value === settings.lighting);
        return lighting?.label.split(" ")[0] || "Auto";
      case "quality":
        return settings.quality === "ultra" ? "Ultra" : settings.quality === "high" ? "High" : "Std";
      case "aspect":
        return settings.aspectRatio;
      case "numImages":
        return `${settings.numImages}x`;
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {/* Preset Card */}
      <div className="relative" ref={el => { dropdownRefs.current["preset"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "preset" ? null : "preset")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "preset" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 transition-colors ${openDropdown === "preset" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("preset")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "preset" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "preset" && (
          <div className="absolute bottom-full mb-2 right-0 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {Object.entries(IMAGE_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetChange(key as ImagePresetKey)}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  (settings.preset || "none") === key
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {(settings.preset || "none") === key && <span className="text-xs">✓</span>}
                  <span>{preset.icon}</span>
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Style Card */}
      <div className="relative" ref={el => { dropdownRefs.current["style"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "style" ? null : "style")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "style" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Palette className={`w-3.5 h-3.5 transition-colors ${openDropdown === "style" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("style")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "style" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "style" && (
          <div className="absolute bottom-full mb-2 right-0 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {IMAGE_STYLES.map((option) => (
              <button
                key={option.value || "auto"}
                onClick={() => {
                  onSettingsChange({ ...settings, style: option.value as any });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.style === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.style === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lighting Card */}
      <div className="relative" ref={el => { dropdownRefs.current["lighting"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "lighting" ? null : "lighting")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "lighting" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Sun className={`w-3.5 h-3.5 transition-colors ${openDropdown === "lighting" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("lighting")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "lighting" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "lighting" && (
          <div className="absolute bottom-full mb-2 right-0 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {LIGHTING_OPTIONS.map((option) => (
              <button
                key={option.value || "auto"}
                onClick={() => {
                  onSettingsChange({ ...settings, lighting: option.value as any });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.lighting === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.lighting === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quality Card */}
      <div className="relative" ref={el => { dropdownRefs.current["quality"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "quality" ? null : "quality")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "quality" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Zap className={`w-3.5 h-3.5 transition-colors ${openDropdown === "quality" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("quality")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "quality" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "quality" && (
          <div className="absolute bottom-full mb-2 right-0 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {QUALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, quality: option.value as any });
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

      {/* Aspect Ratio Card */}
      <div className="relative" ref={el => { dropdownRefs.current["aspect"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "aspect" ? null : "aspect")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "aspect" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <RectangleHorizontal className={`w-3.5 h-3.5 transition-colors ${openDropdown === "aspect" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("aspect")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "aspect" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "aspect" && (
          <div className="absolute bottom-full mb-2 right-0 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {ASPECT_RATIOS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, aspectRatio: option.value as any });
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

      {/* Number of Images Card */}
      <div className="relative" ref={el => { dropdownRefs.current["numImages"] = el; }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === "numImages" ? null : "numImages")}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            openDropdown === "numImages" ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <Copy className={`w-3.5 h-3.5 transition-colors ${openDropdown === "numImages" ? "text-pw-accent" : "text-pw-black/40"}`} />
          <span className="text-xs font-medium text-pw-black/70">{getCurrentLabel("numImages")}</span>
          <ChevronDown className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${openDropdown === "numImages" ? "rotate-180" : ""}`} />
        </button>

        {openDropdown === "numImages" && (
          <div className="absolute bottom-full mb-2 right-0 w-44 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {NUM_IMAGES_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSettingsChange({ ...settings, numImages: option.value as any });
                  setOpenDropdown(null);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  settings.numImages === option.value
                    ? "bg-pw-accent text-white font-medium"
                    : "text-pw-black/70 hover:bg-pw-black/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  {settings.numImages === option.value && <span className="text-xs">✓</span>}
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Structure Fidelity removed from chat UI - setting still exists in backend but not exposed to users */}
    </div>
  );
}

// Re-export the type for backward compatibility
export type { ImageSettingsType };
