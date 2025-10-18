/**
 * Style-Transfer Settings Component
 *
 * Displays all settings controls for the Style-Transfer workflow:
 * - Transfer Mode (Dropdown)
 * - Style Strength (Slider)
 * - Structure Preservation (Slider)
 * - Material Transfer (Dropdown)
 * - Color Transfer (Dropdown)
 * - Detail Level (Dropdown)
 */

"use client";

import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import { SettingsDropdown } from "@/components/ui/SettingsDropdown";
import { SettingsSlider } from "@/components/ui/SettingsSlider";
import {
  ARCHITECTURAL_STYLES,
  TRANSFER_MODES,
  MATERIAL_TRANSFERS,
  COLOR_TRANSFERS,
  DETAIL_LEVELS,
  getSettingLabel,
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
        scrollable={true}
      />

      {/* Transfer Mode */}
      <SettingsDropdown
        icon={SETTING_ICONS.transferMode!}
        options={TRANSFER_MODES}
        value={settings.transferMode}
        onChange={(v) => updateSetting("transferMode", v as any)}
        placeholder={getSettingLabel("transferMode", settings.transferMode)}
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

      {/* Material Transfer */}
      <SettingsDropdown
        icon={SETTING_ICONS.materialTransfer!}
        options={MATERIAL_TRANSFERS}
        value={settings.materialTransfer}
        onChange={(v) => updateSetting("materialTransfer", v as any)}
        placeholder={getSettingLabel(
          "materialTransfer",
          settings.materialTransfer
        )}
      />

      {/* Color Transfer */}
      <SettingsDropdown
        icon={SETTING_ICONS.colorTransfer!}
        options={COLOR_TRANSFERS}
        value={settings.colorTransfer}
        onChange={(v) => updateSetting("colorTransfer", v as any)}
        placeholder={getSettingLabel("colorTransfer", settings.colorTransfer)}
      />

      {/* Detail Level */}
      <SettingsDropdown
        icon={SETTING_ICONS.detailLevel!}
        options={DETAIL_LEVELS}
        value={settings.detailLevel}
        onChange={(v) => updateSetting("detailLevel", v as any)}
        placeholder={getSettingLabel("detailLevel", settings.detailLevel)}
      />
    </div>
  );
}
