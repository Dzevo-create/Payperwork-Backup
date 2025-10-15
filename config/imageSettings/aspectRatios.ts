/**
 * Aspect Ratio Options
 *
 * Defines available aspect ratios for image generation
 * (1:1, 16:9, 9:16, 4:3, 3:2, 21:9)
 */

export const ASPECT_RATIOS = [
  {
    value: '1:1' as const,
    label: '1:1 (Quadrat)',
    description: 'Perfekt für Social Media Posts'
  },
  {
    value: '16:9' as const,
    label: '16:9 (Landscape)',
    description: 'Standard Widescreen Format'
  },
  {
    value: '9:16' as const,
    label: '9:16 (Portrait)',
    description: 'Ideal für Stories & Reels'
  },
  {
    value: '4:3' as const,
    label: '4:3 (Klassisch)',
    description: 'Klassisches TV-Format'
  },
  {
    value: '3:2' as const,
    label: '3:2 (Foto)',
    description: 'Standard Fotoformat'
  },
  {
    value: '21:9' as const,
    label: '21:9 (Cinematic)',
    description: 'Ultra-Wide Kinoformat'
  },
] as const;

// Type for aspect ratio values
export type AspectRatioValue = '1:1' | '16:9' | '9:16' | '4:3' | '3:2' | '21:9';

// Helper to get aspect ratio label
export const getAspectRatioLabel = (value: AspectRatioValue): string => {
  const ratio = ASPECT_RATIOS.find(r => r.value === value);
  return ratio?.label || value;
};

// Helper to get aspect ratio dimensions (for calculations)
export const getAspectRatioDimensions = (value: AspectRatioValue): { width: number; height: number } => {
  const [width, height] = value.split(':').map(Number);
  return { width, height };
};

// Helper to check if aspect ratio is portrait orientation
export const isPortraitRatio = (value: AspectRatioValue): boolean => {
  const { width, height } = getAspectRatioDimensions(value);
  return height > width;
};

// Helper to check if aspect ratio is landscape orientation
export const isLandscapeRatio = (value: AspectRatioValue): boolean => {
  const { width, height } = getAspectRatioDimensions(value);
  return width > height;
};

// Helper to check if aspect ratio is square
export const isSquareRatio = (value: AspectRatioValue): boolean => {
  const { width, height } = getAspectRatioDimensions(value);
  return width === height;
};
