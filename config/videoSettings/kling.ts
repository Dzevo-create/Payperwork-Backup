/**
 * Kling AI Video Generation Configuration
 * All configuration options for Kling video model
 */

// Duration options for Kling AI
export const KLING_DURATIONS = [
  { value: '5', label: '5 Sekunden' },
  { value: '10', label: '10 Sekunden' }
] as const;

// Aspect ratio options for text-to-video (without image attachment)
export const KLING_ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '9:16', label: '9:16 (Portrait)' },
  { value: '1:1', label: '1:1 (Quadrat)' }
] as const;

// Aspect ratio options for image-to-video (with image attachment)
export const KLING_ASPECT_RATIOS_WITH_ORIGINAL = [
  { value: 'original', label: 'Original (vom Bild)' },
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '9:16', label: '9:16 (Portrait)' },
  { value: '1:1', label: '1:1 (Quadrat)' }
] as const;

// Quality modes for Kling AI
export const KLING_MODES = [
  { value: 'std', label: 'Standard' },
  { value: 'pro', label: 'Professional' }
] as const;

// Camera movement options for Kling AI (image-to-video only)
export const KLING_CAMERA_MOVEMENTS = [
  { value: 'none', label: 'Statisch' },
  { value: 'zoom_in', label: 'Zoom rein' },
  { value: 'zoom_out', label: 'Zoom raus' },
  { value: 'pan_left', label: 'Nach links' },
  { value: 'pan_right', label: 'Nach rechts' },
  { value: 'tilt_up', label: 'Nach oben' },
  { value: 'tilt_down', label: 'Nach unten' }
] as const;

// Type exports for type safety
export type KlingDuration = typeof KLING_DURATIONS[number]['value'];
export type KlingAspectRatio = typeof KLING_ASPECT_RATIOS[number]['value'];
export type KlingAspectRatioWithOriginal = typeof KLING_ASPECT_RATIOS_WITH_ORIGINAL[number]['value'];
export type KlingMode = typeof KLING_MODES[number]['value'];
export type KlingCameraMovement = typeof KLING_CAMERA_MOVEMENTS[number]['value'];
