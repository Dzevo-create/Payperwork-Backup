"use client";

import { SketchToRenderSettingsType } from "@/types/workflows/sketchToRenderSettings";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import {
  SPACE_TYPES,
  ASPECT_RATIOS,
  DESIGN_STYLES,
  RENDER_STYLES,
  TIME_OF_DAY,
  SEASONS,
  WEATHER,
  QUALITY,
  getSettingLabel,
  getSpaceTypeIcon,
  SETTING_ICONS,
} from "@/constants/sketchToRenderSettings";

interface SketchToRenderSettingsProps {
  settings: SketchToRenderSettingsType;
  onSettingsChange: (settings: SketchToRenderSettingsType) => void;
}

/**
 * SketchToRenderSettings Component - REFACTORED
 *
 * Horizontal settings bar for Sketch-to-Render workflow
 * Uses reusable SettingsDropdown component
 *
 * Reduction: 604 lines → ~150 lines (-75%)
 */
export function SketchToRenderSettings({ settings, onSettingsChange }: SketchToRenderSettingsProps) {
  // Helper to update a single setting
  const updateSetting = <K extends keyof SketchToRenderSettingsType>(
    key: K,
    value: SketchToRenderSettingsType[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {/* Space Type Dropdown */}
      <SettingsDropdown
        icon={getSpaceTypeIcon(settings.spaceType ?? null)}
        options={SPACE_TYPES}
        value={settings.spaceType ?? null}
        onChange={(v) => updateSetting("spaceType", v as any)}
        placeholder={getSettingLabel("spaceType", settings.spaceType ?? null)}
      />

      {/* Aspect Ratio Dropdown */}
      <SettingsDropdown
        icon={SETTING_ICONS.aspectRatio!}
        options={ASPECT_RATIOS}
        value={settings.aspectRatio ?? null}
        onChange={(v) => updateSetting("aspectRatio", v as any)}
        placeholder={getSettingLabel("aspectRatio", settings.aspectRatio ?? null)}
      />

      {/* Design Style Dropdown */}
      <SettingsDropdown
        icon={SETTING_ICONS.designStyle!}
        options={DESIGN_STYLES}
        value={settings.designStyle ?? null}
        onChange={(v) => updateSetting("designStyle", v as any)}
        placeholder={getSettingLabel("designStyle", settings.designStyle ?? null)}
        align="right"
      />

      {/* Render Style Dropdown */}
      <SettingsDropdown
        icon={SETTING_ICONS.renderStyle!}
        options={RENDER_STYLES}
        value={settings.renderStyle ?? null}
        onChange={(v) => updateSetting("renderStyle", v as any)}
        placeholder={getSettingLabel("renderStyle", settings.renderStyle ?? null)}
        align="right"
      />

      {/* Time of Day Dropdown */}
      <SettingsDropdown
        icon={SETTING_ICONS.timeOfDay!}
        options={TIME_OF_DAY}
        value={settings.timeOfDay ?? null}
        onChange={(v) => updateSetting("timeOfDay", v as any)}
        placeholder={getSettingLabel("timeOfDay", settings.timeOfDay ?? null)}
        align="right"
      />

      {/* Season Dropdown */}
      <SettingsDropdown
        icon={SETTING_ICONS.season!}
        options={SEASONS}
        value={settings.season ?? null}
        onChange={(v) => updateSetting("season", v as any)}
        placeholder={getSettingLabel("season", settings.season ?? null)}
        align="right"
      />

      {/* Weather Dropdown */}
      <SettingsDropdown
        icon={SETTING_ICONS.weather!}
        options={WEATHER}
        value={settings.weather ?? null}
        onChange={(v) => updateSetting("weather", v as any)}
        placeholder={getSettingLabel("weather", settings.weather ?? null)}
        align="right"
      />

      {/* Quality Dropdown */}
      <SettingsDropdown
        icon={SETTING_ICONS.quality!}
        options={QUALITY}
        value={settings.quality ?? null}
        onChange={(v) => updateSetting("quality", v as any)}
        placeholder={getSettingLabel("quality", settings.quality ?? null)}
        align="right"
      />
    </div>
  );
}
