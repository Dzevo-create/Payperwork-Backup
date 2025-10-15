/**
 * Image Generation Presets
 *
 * Defines pre-configured presets for image generation with optimal settings
 * for different use cases (cinematic, portrait, landscape, etc.)
 */

export const IMAGE_PRESETS = {
  none: {
    value: 'none',
    label: 'Keine Vorgabe',
    icon: '✨',
    style: undefined,
    lighting: undefined,
  },
  cinematic: {
    value: 'cinematic',
    label: 'Cinematic',
    icon: '🎬',
    style: 'cinematic' as const,
    lighting: 'dramatic' as const,
    quality: 'ultra' as const,
    aspectRatio: '21:9' as const,
  },
  portrait: {
    value: 'portrait',
    label: 'Portrait',
    icon: '📸',
    style: 'photorealistic' as const,
    lighting: 'soft' as const,
    quality: 'ultra' as const,
    aspectRatio: '3:2' as const,
  },
  landscape: {
    value: 'landscape',
    label: 'Landscape',
    icon: '🏞️',
    style: 'photorealistic' as const,
    lighting: 'natural' as const,
    quality: 'ultra' as const,
    aspectRatio: '16:9' as const,
  },
  product: {
    value: 'product',
    label: 'Product',
    icon: '📦',
    style: 'photorealistic' as const,
    lighting: 'studio' as const,
    quality: 'ultra' as const,
    aspectRatio: '1:1' as const,
  },
  artistic: {
    value: 'artistic',
    label: 'Artistic',
    icon: '🎨',
    style: 'artistic' as const,
    lighting: 'dramatic' as const,
    quality: 'high' as const,
    aspectRatio: '16:9' as const,
  },
  night: {
    value: 'night',
    label: 'Night Scene',
    icon: '🌃',
    style: 'cinematic' as const,
    lighting: 'neon' as const,
    quality: 'ultra' as const,
    aspectRatio: '16:9' as const,
  },
} as const;

export type ImagePresetKey = keyof typeof IMAGE_PRESETS;

// Array of presets for iteration (useful for UI rendering)
export const PRESET_OPTIONS = Object.values(IMAGE_PRESETS);

// Type for preset values
export type PresetValue = typeof IMAGE_PRESETS[ImagePresetKey]['value'];

// Helper to get preset by value
export const getPresetByValue = (value: string) => {
  return Object.values(IMAGE_PRESETS).find(preset => preset.value === value) || IMAGE_PRESETS.none;
};

// Helper to get preset defaults (for applying preset to settings)
export const getPresetDefaults = (presetKey: ImagePresetKey) => {
  const preset = IMAGE_PRESETS[presetKey];
  return {
    style: preset.style,
    lighting: preset.lighting,
    quality: preset.quality,
    aspectRatio: preset.aspectRatio,
  };
};
