"use client";

import {
  Home,
  TreePine,
  RectangleHorizontal,
  Palette,
  Type,
  Sun,
  Sparkles,
  Zap,
} from "lucide-react";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import {
  SPACE_TYPES,
  ASPECT_RATIOS,
  VENUE_TYPES,
  RENDER_STYLES,
  TIME_OF_DAY,
  QUALITY,
} from "@/constants/workflowSettings";
import { BRANDS } from "@/constants/brands";

interface BrandingSettingsProps {
  settings: BrandingSettingsType;
  onSettingsChange: (settings: BrandingSettingsType) => void;
}

/**
 * BrandingSettings Component - REFACTORED
 *
 * Horizontal settings bar for Branding workflow
 * Uses reusable SettingsDropdown component
 *
 * Reduction: 778 lines → ~180 lines (-77%)
 */
export function BrandingSettings({ settings, onSettingsChange }: BrandingSettingsProps) {
  // Helper to update a single setting
  const updateSetting = <K extends keyof BrandingSettingsType>(
    key: K,
    value: BrandingSettingsType[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Get icon based on space type
  const getSpaceTypeIcon = (value: string | null) => {
    if (value === "exterior") return TreePine;
    return Home;
  };

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {/* Space Type Dropdown */}
      <SettingsDropdown
        icon={Home}
        options={SPACE_TYPES}
        value={settings.spaceType ?? null}
        onChange={(v) => updateSetting("spaceType", v as any)}
        placeholder="Space Type"
        getIcon={getSpaceTypeIcon}
      />

      {/* Aspect Ratio Dropdown */}
      <SettingsDropdown
        icon={RectangleHorizontal}
        options={ASPECT_RATIOS}
        value={settings.aspectRatio ?? null}
        onChange={(v) => updateSetting("aspectRatio", v as any)}
        placeholder="Aspect Ratio"
      />

      {/* Venue Type Dropdown (Scrollable) */}
      <SettingsDropdown
        icon={Type}
        options={VENUE_TYPES}
        value={settings.venueType ?? null}
        onChange={(v) => updateSetting("venueType", v as any)}
        placeholder="Art"
        align="right"
        scrollable={true}
        maxHeight="20rem"
      />

      {/* Brand Dropdown (Searchable & Scrollable) */}
      <SettingsDropdown
        icon={Palette}
        options={BRANDS}
        value={settings.brandingText ?? null}
        onChange={(v) => updateSetting("brandingText", v)}
        placeholder="Brand"
        searchable={true}
        align="right"
        scrollable={true}
        maxHeight="18rem"
      />

      {/* Render Style Dropdown */}
      <SettingsDropdown
        icon={Sparkles}
        options={RENDER_STYLES}
        value={settings.renderStyle ?? null}
        onChange={(v) => updateSetting("renderStyle", v as any)}
        placeholder="Render-Stil"
        align="right"
      />

      {/* Time of Day Dropdown */}
      <SettingsDropdown
        icon={Sun}
        options={TIME_OF_DAY}
        value={settings.timeOfDay ?? null}
        onChange={(v) => updateSetting("timeOfDay", v as any)}
        placeholder="Zeit"
        align="right"
      />

      {/* Empty Space Preservation Toggle */}
      <div className="relative group">
        <button
          onClick={() => {
            updateSetting("preserveEmptySpace", !settings.preserveEmptySpace);
          }}
          className={`flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border hover:shadow transition-all cursor-pointer ${
            settings.preserveEmptySpace ? "border-green-400/30 bg-green-50/30" : "border-pw-black/10"
          }`}
        >
          <RectangleHorizontal className={`w-3 h-3 transition-colors ${settings.preserveEmptySpace ? "text-green-600" : "text-pw-black/40"}`} />
          <span className="text-[10px] font-medium text-pw-black/70">
            {settings.preserveEmptySpace ? "Leer ✓" : "Füllen"}
          </span>
        </button>

        {/* Hover Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-white text-pw-black text-[10px] font-medium rounded-lg shadow-xl border border-pw-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999]">
          {settings.preserveEmptySpace
            ? "🔒 Leere Flächen BEIBEHALTEN - Minimalismus"
            : "✨ Leere Flächen FÜLLEN - Details hinzufügen"}
          <div className="absolute top-full right-4 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.1))' }}></div>
        </div>
      </div>

      {/* Quality Dropdown */}
      <SettingsDropdown
        icon={Zap}
        options={QUALITY}
        value={settings.quality ?? null}
        onChange={(v) => updateSetting("quality", v as any)}
        placeholder="Qualität"
        align="right"
      />

      {/* Structure Fidelity Slider */}
      <div className="relative group">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border border-pw-black/10 hover:shadow transition-all min-w-[120px]">
          {/* Icon and Label */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-pw-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            <span className="text-[10px] font-medium text-pw-black/70 whitespace-nowrap">
              {settings.structureFidelity ?? 100}%
            </span>
          </div>

          {/* Slider Track */}
          <div className="relative flex-1 h-1.5 bg-gradient-to-r from-orange-300 via-yellow-300 to-green-300 rounded-full shadow-inner">
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={settings.structureFidelity ?? 100}
              onChange={(e) => {
                updateSetting("structureFidelity", parseInt(e.target.value));
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Thumb indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-pw-accent border border-white rounded-full shadow-md pointer-events-none transition-all group-hover:scale-125"
              style={{
                left: `${((settings.structureFidelity ?? 100) - 10) / 90 * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>

        {/* Hover Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-white text-pw-black text-[10px] font-medium rounded-lg shadow-xl border border-pw-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[9999]">
          {settings.structureFidelity === 100 && "🎯 Exakte Struktur - Nur Materialien ändern"}
          {settings.structureFidelity === 90 && "📐 Sehr hohe Treue - Minimale Abweichung"}
          {settings.structureFidelity === 80 && "🏗️ Hohe Treue - Gleiche Grundstruktur"}
          {settings.structureFidelity === 70 && "🎨 Medium-Hoch - Mehr Kreativität"}
          {settings.structureFidelity === 60 && "🖼️ Medium - Layout als Guide"}
          {settings.structureFidelity === 50 && "⚖️ Balanciert - 50/50 Mix"}
          {settings.structureFidelity === 40 && "🎭 Low-Medium - Größere Änderungen OK"}
          {settings.structureFidelity === 30 && "🌈 Niedrig - Nur Inspiration"}
          {settings.structureFidelity === 20 && "✨ Sehr niedrig - Maximum Kreativität"}
          {settings.structureFidelity === 10 && "💡 Inspiration - Komplette Freiheit"}
          {/* Arrow pointing down to the right */}
          <div className="absolute top-full right-4 -mt-px w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.1))' }}></div>
        </div>
      </div>
    </div>
  );
}
