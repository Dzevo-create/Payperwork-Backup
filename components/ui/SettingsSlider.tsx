"use client";

import { useState, useRef, useEffect } from "react";
import type { LucideIcon } from "lucide-react";

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
  /** Additional className for the container */
  className?: string;
}

/**
 * SettingsSlider Component
 *
 * Reusable slider component for workflow settings
 *
 * Features:
 * - Click-outside-to-close
 * - Visual slider with live value
 * - Matches SettingsDropdown style
 * - Responsive
 *
 * @example
 * ```tsx
 * <SettingsSlider
 *   icon={Sparkles}
 *   label="Stil-Stärke"
 *   value={settings.styleStrength}
 *   onChange={(v) => updateSetting("styleStrength", v)}
 *   min={0}
 *   max={100}
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
  className = "",
}: SettingsSliderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 bg-pw-black/5 hover:bg-pw-black/10 rounded-lg transition-all text-xs font-medium text-pw-black/80 hover:text-pw-black whitespace-nowrap"
        title={label}
      >
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xs">
          {value}
          {unit}
        </span>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-pw-black/10 overflow-hidden z-50 min-w-[220px]">
          <div className="px-4 py-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-pw-black/60">
                {label}
              </span>
              <span className="text-sm font-semibold text-pw-black">
                {value}
                {unit}
              </span>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-pw-black/40 w-8 text-left">
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
                className="flex-1 h-1.5 bg-pw-black/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-pw-accent
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-4
                  [&::-moz-range-thumb]:h-4
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-pw-accent
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:transition-all
                  [&::-moz-range-thumb]:hover:scale-110"
              />
              <span className="text-[10px] text-pw-black/40 w-8 text-right">
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
