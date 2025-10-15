/**
 * Constants and configuration values for ChatInput
 */

import { InputConstraintsConfig, UITextConfig, UIBehaviorConfig } from "./types";

/**
 * UI text constants (German localization)
 */
export const UI_TEXT: UITextConfig = {
  placeholder: "Nachricht eingeben...",
  transcribing: "Wird transkribiert...",
  uploading: "Datei wird verarbeitet...",
  dropOverlay: {
    title: "Datei hier ablegen",
    subtitle: "Bilder & PDFs werden unterstützt",
  },
  replyPreview: {
    contextImage: "Kontext - {name}",
    contextFile: "Kontext - {name}",
    contextFallback: "Kontext",
    cancelLabel: "Abbrechen",
  },
} as const;

/**
 * Input field constraints
 */
export const INPUT_CONSTRAINTS: InputConstraintsConfig = {
  maxHeight: 200, // Maximum textarea height in pixels
  fileAccept: "image/*,.pdf",
  allowMultiple: true,
} as const;

/**
 * UI behavior settings
 */
export const UI_BEHAVIOR: UIBehaviorConfig = {
  autoResize: true,
  defaultShowDropdown: false,
  enableDragDrop: true,
} as const;

/**
 * CSS class names for styling consistency
 */
export const STYLE_CLASSES = {
  container: "px-3 sm:px-4 md:px-6 py-4 bg-transparent",
  maxWidth: "max-w-3xl mx-auto",
  inputWrapper:
    "flex flex-col gap-2 px-3 py-2 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-2xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-pw-accent/50 relative",
  textarea:
    "flex-1 bg-transparent text-sm text-pw-black placeholder:text-pw-black/40 resize-none outline-none min-h-[20px] max-h-[150px] py-1.5",
  indicator: "mb-2 flex items-center gap-2 text-sm text-pw-black/60",
  dragOverlay:
    "absolute inset-0 z-50 flex items-center justify-center bg-pw-accent/10 backdrop-blur-sm rounded-2xl border-2 border-dashed border-pw-accent",
  replyPreview:
    "mb-2 flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border border-pw-black/10",
} as const;

/**
 * Keyboard shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  send: {
    key: "Enter",
    modifiers: { shift: false },
    description: "Send message",
  },
  newLine: {
    key: "Enter",
    modifiers: { shift: true },
    description: "New line",
  },
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  textareaResize: 0, // Instant resize
  dropdownToggle: 150,
  modalTransition: 200,
} as const;
