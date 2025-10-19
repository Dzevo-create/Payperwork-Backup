// components/workflows/render-to-cad/RenderToCadSettings.tsx
"use client";

import { RenderToCadSettingsType } from "@/types/workflows/renderToCadSettings";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import {
  DETAIL_LEVELS,
  OUTPUT_TYPES,
  SETTING_ICONS,
} from "@/constants/renderToCadSettings";

interface RenderToCadSettingsProps {
  settings: RenderToCadSettingsType;
  onSettingsChange: (settings: RenderToCadSettingsType) => void;
}

/**
 * Render-to-CAD Settings Component (Simplified to 2 Essential Settings)
 *
 * 2 Settings:
 * - Output Type (Mit/Ohne Metadaten) - Ob das generierte CAD mit Metadaten kommt
 * - Detail Level (Übersicht/Standard/Detailliert) - Detailtiefe der Zeichnung
 */
export function RenderToCadSettings({
  settings,
  onSettingsChange,
}: RenderToCadSettingsProps) {
  const updateSetting = <K extends keyof RenderToCadSettingsType>(
    key: K,
    value: RenderToCadSettingsType[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {/* Detail Level */}
      <SettingsDropdown
        icon={SETTING_ICONS.detailLevel!}
        options={DETAIL_LEVELS}
        value={settings.detailLevel}
        onChange={(v) => updateSetting("detailLevel", v as any)}
        placeholder="Detail Level"
        alwaysShowTitle={true}
      />

      {/* Output Type */}
      <SettingsDropdown
        icon={SETTING_ICONS.outputType!}
        options={OUTPUT_TYPES}
        value={settings.outputType}
        onChange={(v) => updateSetting("outputType", v as any)}
        placeholder="Output Type"
        alwaysShowTitle={true}
        align="end"
      />
    </div>
  );
}
