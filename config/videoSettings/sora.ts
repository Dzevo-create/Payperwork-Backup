/**
 * Sora 2 Video Generation Configuration
 * All configuration options for Sora 2 video model (fal.ai API specs)
 */

// Duration options for Sora 2
export const SORA_DURATIONS = [
  { value: '4', label: '4 Sekunden' },
  { value: '8', label: '8 Sekunden' },
  { value: '12', label: '12 Sekunden' }
] as const;

// Aspect ratio options for text-to-video (without image attachment)
// Note: Sora 2 does NOT support 1:1 aspect ratio
export const SORA_ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '9:16', label: '9:16 (Portrait)' }
] as const;

// Aspect ratio options for image-to-video (with image attachment)
// Note: Sora 2 uses "auto" instead of "original" for image-based aspect ratios
export const SORA_ASPECT_RATIOS_WITH_AUTO = [
  { value: 'auto', label: 'Auto (vom Bild)' },
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '9:16', label: '9:16 (Portrait)' }
] as const;

// Type exports for type safety
export type SoraDuration = typeof SORA_DURATIONS[number]['value'];
export type SoraAspectRatio = typeof SORA_ASPECT_RATIOS[number]['value'];
export type SoraAspectRatioWithAuto = typeof SORA_ASPECT_RATIOS_WITH_AUTO[number]['value'];
