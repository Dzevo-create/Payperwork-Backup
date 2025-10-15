/**
 * Chat mode configurations
 * Defines available chat modes with their icons and labels
 */

import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Plus,
} from "lucide-react";
import { ChatModeConfig, ChatMode } from "./types";

/**
 * Available chat modes with their display configurations
 */
export const CHAT_MODES = {
  chat: {
    mode: "chat",
    icon: MessageSquare,
    label: "Chat-Modus",
    toolbarIcon: Plus,
    enabled: true,
  },
  image: {
    mode: "image",
    icon: ImageIcon,
    label: "Erstelle Bilder",
    toolbarIcon: ImageIcon,
    enabled: true,
  },
  video: {
    mode: "video",
    icon: Video,
    label: "Erstelle Videos",
    toolbarIcon: Video,
    enabled: true,
  },
} as const satisfies Record<ChatMode, ChatModeConfig>;

/**
 * Default chat mode
 */
export const DEFAULT_CHAT_MODE: ChatMode = "chat";

/**
 * Get mode configuration by mode identifier
 */
export function getModeConfig(mode: ChatMode): ChatModeConfig {
  return CHAT_MODES[mode];
}

/**
 * Get all enabled modes
 */
export function getEnabledModes(): ChatModeConfig[] {
  return Object.values(CHAT_MODES).filter((config) => config.enabled);
}

/**
 * Check if a mode is enabled
 */
export function isModeEnabled(mode: ChatMode): boolean {
  return CHAT_MODES[mode].enabled;
}
