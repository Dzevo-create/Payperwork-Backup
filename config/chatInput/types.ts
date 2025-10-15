/**
 * Type definitions for ChatInput configuration
 */

import { LucideIcon } from "lucide-react";

/**
 * Chat mode types
 */
export type ChatMode = "chat" | "image" | "video";

/**
 * Configuration for a single chat mode option
 */
export interface ChatModeConfig {
  /** Mode identifier */
  mode: ChatMode;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label (German) */
  label: string;
  /** Icon for the toolbar button */
  toolbarIcon: LucideIcon;
  /** Whether this mode is enabled */
  enabled: boolean;
}

/**
 * UI text configurations
 */
export interface UITextConfig {
  /** Placeholder text for textarea */
  placeholder: string;
  /** Text shown during transcription */
  transcribing: string;
  /** Text shown during file upload */
  uploading: string;
  /** Drag & drop overlay text */
  dropOverlay: {
    title: string;
    subtitle: string;
  };
  /** Reply preview text */
  replyPreview: {
    contextImage: string;
    contextFile: string;
    contextFallback: string;
    cancelLabel: string;
  };
}

/**
 * Input constraints configuration
 */
export interface InputConstraintsConfig {
  /** Maximum textarea height in pixels */
  maxHeight: number;
  /** File input accept attribute */
  fileAccept: string;
  /** Whether to allow multiple file uploads */
  allowMultiple: boolean;
}

/**
 * Animation/UI behavior configuration
 */
export interface UIBehaviorConfig {
  /** Auto-resize textarea */
  autoResize: boolean;
  /** Show dropdown by default */
  defaultShowDropdown: boolean;
  /** Enable drag & drop */
  enableDragDrop: boolean;
}
