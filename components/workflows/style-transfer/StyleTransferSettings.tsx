/**
 * Style-Transfer Settings Component
 *
 * Settings System:
 * - Mode (Preset / Referenzbild)
 *
 * PRESET MODE:
 * - Bereich (Interieur / Exterieur)
 * - Stil (6 Optionen: mediterran, ikea, minimalistisch, modern, mittelalterlich, industrial)
 * - Tageszeit (6 Optionen: morgen, mittag, abend, nacht, daemmerung, golden_hour)
 * - Wetter (6 Optionen: sonnig, bewoelkt, regen, schnee, nebel, sturm)
 * - Render-Art (5 Optionen)
 * - Structure Preservation (0-100%)
 *
 * REFERENCE MODE:
 * - Render-Art (5 Optionen)
 * - Structure Preservation (0-100%) - Geometrie vom Ausgangsbild
 * - Style Intensity (0-100%) - Style-Transfer vom Referenzbild
 */

"use client";

import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import { SettingsSlider } from "@/components/ui/SettingsSlider";
import {
  MODES,
  SPACE_TYPES,
  ARCHITECTURAL_STYLES,
  TIME_OF_DAY,
  WEATHER,
  RENDER_STYLES,
  SETTING_ICONS,
} from "@/constants/styleTransferSettings";
import {
  Building,
  Palette,
  Clock,
  Cloud,
  Paintbrush,
  Lock,
  LayoutGrid,
  Sparkles,
} from "lucide-react";

interface StyleTransferSettingsProps {
  settings: StyleTransferSettingsType;
  onSettingsChange: (settings: StyleTransferSettingsType) => void;
  hasReferenceImage?: boolean; // Ob ein Referenzbild hochgeladen wurde
}

export function StyleTransferSettings({
  settings,
  onSettingsChange,
  hasReferenceImage = false,
}: StyleTransferSettingsProps) {
  const updateSetting = <K extends keyof StyleTransferSettingsType>(
    key: K,
    value: StyleTransferSettingsType[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Icon-Mapping für Lucide Icons
  const iconMap = {
    LayoutGrid: LayoutGrid,
    Building: Building,
    Palette: Palette,
    Clock: Clock,
    Cloud: Cloud,
    Paintbrush: Paintbrush,
    Lock: Lock,
    Sparkles: Sparkles,
  };

  // Wenn Mode = "reference" ist, zeige nur Structure Preservation
  const showPresetOptions = settings.mode === "preset";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {/* Mode (Preset / Referenzbild) */}
      <SettingsDropdown
        icon={iconMap[SETTING_ICONS.mode]}
        options={MODES}
        value={settings.mode}
        onChange={(v) => updateSetting("mode", v as any)}
        placeholder="Modus"
        alwaysShowTitle={true}
      />

      {/* Preset-Optionen (nur zeigen wenn mode = "preset") */}
      {showPresetOptions && (
        <>
          {/* Bereich (Interieur / Exterieur) */}
          <SettingsDropdown
            icon={iconMap[SETTING_ICONS.spaceType]}
            options={SPACE_TYPES}
            value={settings.spaceType}
            onChange={(v) => updateSetting("spaceType", v as any)}
            placeholder="Bereich"
            alwaysShowTitle={true}
          />

          {/* Architekturstil */}
          <SettingsDropdown
            icon={iconMap[SETTING_ICONS.architecturalStyle]}
            options={ARCHITECTURAL_STYLES}
            value={settings.architecturalStyle}
            onChange={(v) => updateSetting("architecturalStyle", v as any)}
            placeholder="Stil"
            alwaysShowTitle={true}
            scrollable={true}
          />

          {/* Tageszeit */}
          <SettingsDropdown
            icon={iconMap[SETTING_ICONS.timeOfDay]}
            options={TIME_OF_DAY}
            value={settings.timeOfDay}
            onChange={(v) => updateSetting("timeOfDay", v as any)}
            placeholder="Tageszeit"
            alwaysShowTitle={true}
            scrollable={true}
          />

          {/* Wetter */}
          <SettingsDropdown
            icon={iconMap[SETTING_ICONS.weather]}
            options={WEATHER}
            value={settings.weather}
            onChange={(v) => updateSetting("weather", v as any)}
            placeholder="Wetter"
            alwaysShowTitle={true}
            scrollable={true}
          />
        </>
      )}

      {/* Render-Art (IMMER zeigen - in beiden Modi) */}
      <SettingsDropdown
        icon={iconMap[SETTING_ICONS.renderStyle]}
        options={RENDER_STYLES}
        value={settings.renderStyle}
        onChange={(v) => updateSetting("renderStyle", v as any)}
        placeholder="Render-Art"
        alwaysShowTitle={true}
        scrollable={true}
        align="right"
      />

      {/* Structure Preservation (IMMER zeigen) */}
      <SettingsSlider
        icon={iconMap[SETTING_ICONS.structurePreservation]}
        label="Struktur"
        value={settings.structurePreservation}
        onChange={(v) => updateSetting("structurePreservation", v)}
        min={0}
        max={100}
        unit="%"
      />

      {/* Style Intensity (NUR zeigen wenn mode = "reference") */}
      {settings.mode === "reference" && (
        <SettingsSlider
          icon={Sparkles}
          label="Style-Int."
          value={settings.styleIntensity}
          onChange={(v) => updateSetting("styleIntensity", v)}
          min={0}
          max={100}
          unit="%"
        />
      )}
    </div>
  );
}
