"use client";

import { Building2, Home, TreePine, Sparkles, Shapes, Minimize2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { RenderSettingsType, PRESET_CONFIGURATIONS } from "@/types/workflows/renderSettings";

export type RenderPreset =
  | "architektur"
  | "interior"
  | "exterior"
  | "modern"
  | "classical"
  | "minimalist"
  | "none";

interface Preset {
  value: RenderPreset;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRESETS: Preset[] = [
  { value: "architektur", label: "Architektur", icon: Building2 },
  { value: "interior", label: "Interior", icon: Home },
  { value: "exterior", label: "Exterior", icon: TreePine },
  { value: "modern", label: "Modern", icon: Sparkles },
  { value: "classical", label: "Classical", icon: Shapes },
  { value: "minimalist", label: "Minimalist", icon: Minimize2 },
];

interface PresetsBarProps {
  selectedPreset: RenderPreset;
  onPresetChange: (preset: RenderPreset, settings: RenderSettingsType) => void;
}

/**
 * PresetsBar Component
 *
 * Horizontal preset selector for Sketch-to-Render workflow
 * Follows the same design pattern as ImageSettings and VideoSettings
 */
export function PresetsBar({ selectedPreset, onPresetChange }: PresetsBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentPreset = PRESETS.find((p) => p.value === selectedPreset) || PRESETS[0];
  const CurrentIcon = currentPreset?.icon || Building2;

  return (
    <div className="flex items-center justify-end gap-1.5 flex-wrap">
      {/* Preset Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            isOpen ? "border-pw-accent/20 shadow-sm" : "border-pw-black/10"
          }`}
        >
          <CurrentIcon
            className={`w-3.5 h-3.5 transition-colors ${
              isOpen ? "text-pw-accent" : "text-pw-black/40"
            }`}
          />
          <span className="text-xs font-medium text-pw-black/70">
            {currentPreset.label}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-pw-black/40 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute bottom-full mb-2 right-0 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-pw-black/10 py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.value}
                  onClick={() => {
                    // Apply preset defaults from PRESET_CONFIGURATIONS
                    const presetSettings = PRESET_CONFIGURATIONS[preset.value];
                    onPresetChange(preset.value, presetSettings);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    selectedPreset === preset.value
                      ? "bg-pw-accent text-white font-medium"
                      : "text-pw-black/70 hover:bg-pw-black/5"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {selectedPreset === preset.value && (
                      <span className="text-xs">✓</span>
                    )}
                    <Icon className="w-3.5 h-3.5" />
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
