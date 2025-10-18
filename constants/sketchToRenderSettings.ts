import { Home, TreePine, RectangleHorizontal, Palette, Sun, Calendar, Cloud, Sparkles, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DropdownOption } from "@/components/ui/SettingsDropdown";

/**
 * Sketch-to-Render Settings Constants
 *
 * Extracted from RenderSettings.tsx component
 * Contains all dropdown options and helper functions for the Sketch-to-Render workflow
 */

// === DROPDOWN OPTIONS ===

export const SPACE_TYPES = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
] as const satisfies readonly DropdownOption[];

export const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 Landscape" },
  { value: "9:16", label: "9:16 Portrait" },
  { value: "1:1", label: "1:1 Quadrat" },
  { value: "4:3", label: "4:3 Classic" },
] as const satisfies readonly DropdownOption[];

export const DESIGN_STYLES = [
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
] as const satisfies readonly DropdownOption[];

export const RENDER_STYLES = [
  { value: "hyperrealistic", label: "Hyperrealistisch" },
  { value: "photorealistic", label: "Photorealistisch" },
  { value: "3d-render", label: "3D Render" },
  { value: "architectural-visualization", label: "Architekturvisualisierung" },
  { value: "concept-art", label: "Concept Art" },
] as const satisfies readonly DropdownOption[];

export const TIME_OF_DAY = [
  { value: "morning", label: "Morgens" },
  { value: "midday", label: "Mittags" },
  { value: "afternoon", label: "Nachmittags" },
  { value: "evening", label: "Abends" },
  { value: "night", label: "Nachts" },
] as const satisfies readonly DropdownOption[];

export const SEASONS = [
  { value: "spring", label: "Frühling" },
  { value: "summer", label: "Sommer" },
  { value: "autumn", label: "Herbst" },
  { value: "winter", label: "Winter" },
] as const satisfies readonly DropdownOption[];

export const WEATHER = [
  { value: "sunny", label: "Sonnig" },
  { value: "cloudy", label: "Bewölkt" },
  { value: "rainy", label: "Regnerisch" },
  { value: "foggy", label: "Neblig" },
] as const satisfies readonly DropdownOption[];

export const QUALITY = [
  { value: "ultra", label: "Ultra" },
  { value: "high", label: "High" },
  { value: "standard", label: "Standard" },
] as const satisfies readonly DropdownOption[];

// === ICON MAPPINGS ===

/**
 * Maps setting keys to their corresponding icons
 */
export const SETTING_ICONS: Record<string, LucideIcon> = {
  spaceType: Home,
  aspectRatio: RectangleHorizontal,
  designStyle: Palette,
  renderStyle: Sparkles,
  timeOfDay: Sun,
  season: Calendar,
  weather: Cloud,
  quality: Zap,
};

// === HELPER FUNCTIONS ===

/**
 * Get the label for a setting value
 * @param settingKey - The setting key (e.g., "spaceType")
 * @param value - The current value
 * @returns The label to display
 */
export function getSettingLabel(settingKey: string, value: string | null): string {
  if (value === null) {
    return getDefaultLabel(settingKey);
  }

  switch (settingKey) {
    case "spaceType": {
      const option = SPACE_TYPES.find((s) => s.value === value);
      return option?.label || getDefaultLabel(settingKey);
    }
    case "aspectRatio": {
      const option = ASPECT_RATIOS.find((a) => a.value === value);
      return option?.label || getDefaultLabel(settingKey);
    }
    case "designStyle": {
      const option = DESIGN_STYLES.find((s) => s.value === value);
      return option?.label.split(" ")[0] || getDefaultLabel(settingKey);
    }
    case "renderStyle": {
      const option = RENDER_STYLES.find((s) => s.value === value);
      return option?.label || getDefaultLabel(settingKey);
    }
    case "timeOfDay": {
      const option = TIME_OF_DAY.find((t) => t.value === value);
      return option?.label || getDefaultLabel(settingKey);
    }
    case "season": {
      const option = SEASONS.find((s) => s.value === value);
      return option?.label || getDefaultLabel(settingKey);
    }
    case "weather": {
      const option = WEATHER.find((w) => w.value === value);
      return option?.label || getDefaultLabel(settingKey);
    }
    case "quality": {
      if (value === "ultra") return "Ultra";
      if (value === "high") return "High";
      if (value === "standard") return "Std";
      return getDefaultLabel(settingKey);
    }
    default:
      return getDefaultLabel(settingKey);
  }
}

/**
 * Get the default placeholder label for a setting
 * @param settingKey - The setting key
 * @returns The placeholder label
 */
export function getDefaultLabel(settingKey: string): string {
  switch (settingKey) {
    case "spaceType":
      return "Space Type";
    case "aspectRatio":
      return "Aspect Ratio";
    case "designStyle":
      return "Design-Stil";
    case "renderStyle":
      return "Render-Stil";
    case "timeOfDay":
      return "Zeit";
    case "season":
      return "Saison";
    case "weather":
      return "Wetter";
    case "quality":
      return "Qualität";
    default:
      return "";
  }
}

/**
 * Get the icon for a space type value
 * @param value - The space type value
 * @returns The corresponding icon
 */
export function getSpaceTypeIcon(value: string | null): LucideIcon {
  if (value === "exterior") return TreePine;
  return Home;
}
