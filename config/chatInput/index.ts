/**
 * ChatInput Configuration
 * Centralized configuration for the chat input component
 *
 * This module provides:
 * - Chat mode configurations (chat, image, video)
 * - UI text constants (German localization)
 * - Input constraints and behavior settings
 * - Toolbar configurations
 * - Helper functions for common operations
 *
 * @example
 * ```tsx
 * import { CHAT_MODES, UI_TEXT, getModeConfig } from '@/config/chatInput';
 *
 * const chatConfig = getModeConfig('chat');
 * console.log(chatConfig.label); // "Chat-Modus"
 * ```
 */

// Types
export type { ChatMode, ChatModeConfig, UITextConfig, InputConstraintsConfig, UIBehaviorConfig } from "./types";
export type { ToolbarItem, ToolbarActionType } from "./toolbar";

// Mode configurations
export {
  CHAT_MODES,
  DEFAULT_CHAT_MODE,
  getModeConfig,
  getEnabledModes,
  isModeEnabled,
} from "./modes";

// Constants
export {
  UI_TEXT,
  INPUT_CONSTRAINTS,
  UI_BEHAVIOR,
  STYLE_CLASSES,
  KEYBOARD_SHORTCUTS,
  ANIMATION_DURATIONS,
} from "./constants";

// Toolbar configurations
export {
  TOOLBAR_ITEMS,
  TOOLBAR_STYLES,
  getEnabledToolbarItems,
} from "./toolbar";

// Helper functions
export {
  formatReplyPreviewText,
  calculateTextareaHeight,
  hasImageAttachments,
  canSendMessage,
  getFileAcceptAttribute,
} from "./helpers";
