/**
 * Image Style Options
 *
 * Defines available visual styles for image generation
 * (photorealistic, cinematic, artistic, anime, 3D render)
 */

export const IMAGE_STYLES = [
  {
    value: undefined,
    label: 'Auto (Enhancer wählt)'
  },
  {
    value: 'photorealistic' as const,
    label: 'Fotorealistisch'
  },
  {
    value: 'cinematic' as const,
    label: 'Cinematic'
  },
  {
    value: 'artistic' as const,
    label: 'Künstlerisch'
  },
  {
    value: 'anime' as const,
    label: 'Anime'
  },
  {
    value: '3d_render' as const,
    label: '3D Render'
  },
] as const;

// Type for style values
export type ImageStyleValue = 'photorealistic' | 'cinematic' | 'artistic' | 'anime' | '3d_render' | undefined;

// Helper to get style label
export const getStyleLabel = (value: ImageStyleValue): string => {
  const style = IMAGE_STYLES.find(s => s.value === value);
  return style?.label || 'Auto';
};

// Helper to get short style label (for compact UI)
export const getStyleLabelShort = (value: ImageStyleValue): string => {
  if (!value) return 'Auto';
  const style = IMAGE_STYLES.find(s => s.value === value);
  return style?.label.split(' ')[0] || 'Auto';
};
