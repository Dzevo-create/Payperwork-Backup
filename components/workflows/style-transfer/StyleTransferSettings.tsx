/**
 * Style-Transfer Settings Component
 *
 * Option 2 - Mit mehr Kontrolle:
 * - Architectural Style (Dropdown)
 * - Transfer Intensity (Dropdown - Subtle/Balanced/Strong)
 * - Style Strength (Slider - 0-100%)
 * - Structure Preservation (Slider - 0-100%)
 * - Material Palette (Dropdown - Natural/Industrial/Luxury/etc.)
 * - Color Scheme (Dropdown - Warm/Cool/Neutral/Vibrant/etc.)
 * - Accent Color (Dropdown - Red/Blue/Gold/etc.)
 */

"use client";

import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import { SettingsSlider } from "@/components/ui/SettingsSlider";
import {
  ARCHITECTURAL_STYLES,
  TRANSFER_INTENSITIES,
  MATERIAL_PALETTES,
  COLOR_SCHEMES,
  ACCENT_COLORS,
  SETTING_ICONS,
} from "@/constants/styleTransferSettings";

interface StyleTransferSettingsProps {
  settings: StyleTransferSettingsType;
  onSettingsChange: (settings: StyleTransferSettingsType) => void;
}

export function StyleTransferSettings({
  settings,
  onSettingsChange,
}: StyleTransferSettingsProps) {
  const updateSetting = <K extends keyof StyleTransferSettingsType>(
    key: K,
    value: StyleTransferSettingsType[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {/* Architectural Style */}
      <SettingsDropdown
        icon={SETTING_ICONS.architecturalStyle!}
        options={ARCHITECTURAL_STYLES}
        value={settings.architecturalStyle}
        onChange={(v) => updateSetting("architecturalStyle", v as any)}
        placeholder="Stil"
        alwaysShowTitle={true}
        scrollable={true}
      />

      {/* Transfer Intensity */}
      <SettingsDropdown
        icon={SETTING_ICONS.transferIntensity!}
        options={TRANSFER_INTENSITIES}
        value={settings.transferIntensity}
        onChange={(v) => updateSetting("transferIntensity", v as any)}
        placeholder="Intensität"
        alwaysShowTitle={true}
      />

      {/* Style Strength Slider */}
      <SettingsSlider
        icon={SETTING_ICONS.styleStrength!}
        label="Stil-Stärke"
        value={settings.styleStrength}
        onChange={(v) => updateSetting("styleStrength", v)}
        min={0}
        max={100}
        unit="%"
      />

      {/* Structure Preservation Slider */}
      <SettingsSlider
        icon={SETTING_ICONS.structurePreservation!}
        label="Struktur"
        value={settings.structurePreservation}
        onChange={(v) => updateSetting("structurePreservation", v)}
        min={0}
        max={100}
        unit="%"
      />

      {/* Material Palette */}
      <SettingsDropdown
        icon={SETTING_ICONS.materialPalette!}
        options={MATERIAL_PALETTES}
        value={settings.materialPalette}
        onChange={(v) => updateSetting("materialPalette", v as any)}
        placeholder="Material Palette"
        alwaysShowTitle={true}
        scrollable={true}
      />

      {/* Color Scheme */}
      <SettingsDropdown
        icon={SETTING_ICONS.colorScheme!}
        options={COLOR_SCHEMES}
        value={settings.colorScheme}
        onChange={(v) => updateSetting("colorScheme", v as any)}
        placeholder="Color Scheme"
        alwaysShowTitle={true}
        scrollable={true}
        align="right"
      />

      {/* Accent Color */}
      <SettingsDropdown
        icon={SETTING_ICONS.accentColor!}
        options={ACCENT_COLORS}
        value={settings.accentColor}
        onChange={(v) => updateSetting("accentColor", v as any)}
        placeholder="Accent Color"
        alwaysShowTitle={true}
        scrollable={true}
        align="right"
      />
    </div>
  );
}
