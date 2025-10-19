// constants/renderToCadSettings.ts

import { DropdownOption } from "@/components/ui/SettingsDropdown";
import {
  FileOutput,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Output Type Options
 */
export const OUTPUT_TYPES: readonly DropdownOption<string>[] = [
  { value: "with_metadata", label: "Mit Metadaten" },
  { value: "without_metadata", label: "Ohne Metadaten" },
] as const;

/**
 * Detail Level Options
 */
export const DETAIL_LEVELS: readonly DropdownOption<string>[] = [
  { value: "overview", label: "Übersicht" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailliert" },
] as const;

/**
 * Setting Icons (2 Settings Only)
 */
export const SETTING_ICONS: Record<string, LucideIcon> = {
  outputType: FileOutput,
  detailLevel: Layers,
};
