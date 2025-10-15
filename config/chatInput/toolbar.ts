/**
 * Toolbar configuration for ChatInput
 * Defines toolbar button options and their behavior
 */

import { FileText } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { ChatMode } from "./types";

/**
 * Toolbar action types
 */
export type ToolbarActionType = "mode" | "file" | "divider";

/**
 * Base toolbar item configuration
 */
interface BaseToolbarItem {
  type: ToolbarActionType;
  enabled: boolean;
}

/**
 * Mode change toolbar item
 */
interface ModeToolbarItem extends BaseToolbarItem {
  type: "mode";
  mode: ChatMode;
  icon: LucideIcon;
  label: string;
}

/**
 * File upload toolbar item
 */
interface FileToolbarItem extends BaseToolbarItem {
  type: "file";
  icon: LucideIcon;
  label: string;
}

/**
 * Divider toolbar item
 */
interface DividerToolbarItem extends BaseToolbarItem {
  type: "divider";
}

/**
 * Union type for all toolbar items
 */
export type ToolbarItem = ModeToolbarItem | FileToolbarItem | DividerToolbarItem;

/**
 * Toolbar dropdown configuration
 * Defines the order and content of toolbar dropdown items
 */
export const TOOLBAR_ITEMS: ToolbarItem[] = [
  // Note: Chat mode button is handled by getModeConfig("chat")
  // and appears in InputToolbar separately as the first item
  {
    type: "file",
    icon: FileText,
    label: "Fotos und Dateien hinzufügen",
    enabled: true,
  },
  {
    type: "divider",
    enabled: true,
  },
  // Note: Image and Video mode buttons are handled by CHAT_MODES config
  // and appear in InputToolbar after the divider
] as const;

/**
 * Toolbar button styling
 */
export const TOOLBAR_STYLES = {
  button: "flex-shrink-0 p-2 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  dropdown: "absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-lg border border-pw-black/10 py-1 z-50",
  dropdownItem: "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pw-black/5 transition-colors text-left",
  divider: "my-1 border-t border-pw-black/10",
  icon: "w-4 h-4 text-pw-black/60",
  label: "text-sm text-pw-black/80",
} as const;

/**
 * Get enabled toolbar items
 */
export function getEnabledToolbarItems(): ToolbarItem[] {
  return TOOLBAR_ITEMS.filter((item) => item.enabled);
}
