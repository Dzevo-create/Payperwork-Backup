"use client";

import { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";

interface SliderTooltip {
  value: number;
  label: string;
  emoji?: string;
}

interface SettingsSliderProps {
  /** Icon to display (from lucide-react) */
  icon: LucideIcon;
  /** Label text */
  label: string;
  /** Current value */
  value: number;
  /** onChange callback */
  onChange: (value: number) => void;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Step size (default: 1) */
  step?: number;
  /** Unit to display (e.g., "%", "px") */
  unit?: string;
  /** Slider variant - dropdown (panel) or inline (gradient track) */
  variant?: "dropdown" | "inline";
  /** Tooltips for specific values (only for inline variant) */
  tooltips?: SliderTooltip[];
  /** Additional className for the container */
  className?: string;
}

/**
 * SettingsSlider Component
 *
 * Reusable slider component for workflow settings with two variants:
 * - "dropdown": Panel style (default) - click to open dropdown with slider
 * - "inline": Gradient track style - always visible with hover tooltip
 *
 * Features:
 * - Click-outside-to-close (dropdown variant)
 * - Visual slider with live value
 * - Matches SettingsDropdown style
 * - Custom tooltips with emojis (inline variant)
 * - Gradient track (inline variant)
 *
 * @example Dropdown variant
 * ```tsx
 * <SettingsSlider
 *   icon={Sparkles}
 *   label="Stil-Stärke"
 *   value={settings.styleStrength}
 *   onChange={(v) => updateSetting("styleStrength", v)}
 *   variant="dropdown"
 * />
 * ```
 *
 * @example Inline variant with tooltips
 * ```tsx
 * <SettingsSlider
 *   icon={Grid}
 *   label="Struktur"
 *   value={settings.structureFidelity}
 *   onChange={(v) => updateSetting("structureFidelity", v)}
 *   variant="inline"
 *   tooltips={STRUCTURE_FIDELITY_TOOLTIPS}
 *   min={10}
 *   max={100}
 *   step={10}
 *   unit="%"
 * />
 * ```
 */
export function SettingsSlider({
  icon: Icon,
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  variant = "dropdown",
  tooltips = [],
  className = "",
}: SettingsSliderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside (only for dropdown variant)
  useEffect(() => {
    if (variant === "dropdown") {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, variant]);

  // Get tooltip for current value (inline variant)
  const getCurrentTooltip = () => {
    const tooltip = tooltips.find((t) => t.value === value);
    if (tooltip) {
      return `${tooltip.emoji ? tooltip.emoji + " " : ""}${tooltip.label}`;
    }
    return `${value}${unit}`;
  };

  // Calculate thumb position (0-100%) for inline variant
  const thumbPosition = ((value - min) / (max - min)) * 100;

  // INLINE VARIANT - Gradient track with hover tooltip
  if (variant === "inline") {
    return (
      <div className={`group relative ${className}`}>
        <div className="border-pw-black/10 flex min-w-[120px] items-center gap-1.5 rounded-lg border bg-gradient-to-br from-white/80 to-white/70 px-2.5 py-1.5 backdrop-blur-sm transition-all hover:shadow">
          {/* Icon and Label */}
          <div className="flex items-center gap-1.5">
            <Icon className="text-pw-black/40 h-3.5 w-3.5" />
            <span className="text-pw-black/70 whitespace-nowrap text-[10px] font-medium">
              {value}
              {unit}
            </span>
          </div>

          {/* Slider Track */}
          <div className="relative h-1.5 flex-1 rounded-full bg-gradient-to-r from-orange-300 via-yellow-300 to-green-300 shadow-inner">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            {/* Thumb indicator */}
            <div
              className="pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white bg-pw-accent shadow-md transition-all group-hover:scale-125"
              style={{
                left: `${thumbPosition}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        </div>

        {/* Hover Tooltip */}
        <div className="border-pw-black/10 pointer-events-none absolute bottom-full right-0 z-[9999] mb-2 whitespace-nowrap rounded-lg border bg-white px-3 py-1.5 text-[10px] font-medium text-pw-black opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
          {getCurrentTooltip()}
          {/* Arrow pointing down to the right */}
          <div
            className="absolute right-4 top-full -mt-px h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"
            style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.1))" }}
          />
        </div>
      </div>
    );
  }

  // DROPDOWN VARIANT - Panel style
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-pw-black/5 hover:bg-pw-black/10 text-pw-black/80 flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium transition-all hover:text-pw-black"
        title={label}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-xs">
          {value}
          {unit}
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="border-pw-black/10 absolute bottom-full right-0 z-50 mb-1 min-w-[220px] overflow-hidden rounded-lg border bg-white shadow-lg">
          <div className="space-y-3 px-4 py-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-pw-black/60 text-xs font-medium">{label}</span>
              <span className="text-sm font-semibold text-pw-black">
                {value}
                {unit}
              </span>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-2">
              <span className="text-pw-black/40 w-8 text-left text-[10px]">
                {min}
                {unit}
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="bg-pw-black/10 h-1.5 flex-1 cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-pw-accent [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pw-accent [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
              />
              <span className="text-pw-black/40 w-8 text-right text-[10px]">
                {max}
                {unit}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
