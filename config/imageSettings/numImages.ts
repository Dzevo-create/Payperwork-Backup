/**
 * Number of Images Options
 *
 * Defines available options for number of images to generate
 * (1, 2, 3, 4)
 */

export const NUM_IMAGES_OPTIONS = [
  {
    value: 1 as const,
    label: '1 Bild',
    description: 'Einzelnes Bild'
  },
  {
    value: 2 as const,
    label: '2 Bilder',
    description: 'Zwei Varianten'
  },
  {
    value: 3 as const,
    label: '3 Bilder',
    description: 'Drei Varianten'
  },
  {
    value: 4 as const,
    label: '4 Bilder',
    description: 'Vier Varianten'
  },
] as const;

// Type for number of images values
export type NumImagesValue = 1 | 2 | 3 | 4;

// Helper to get number of images label
export const getNumImagesLabel = (value: NumImagesValue): string => {
  const option = NUM_IMAGES_OPTIONS.find(o => o.value === value);
  return option?.label || '1 Bild';
};

// Helper to get short number of images label (for compact UI)
export const getNumImagesLabelShort = (value: NumImagesValue): string => {
  return `${value}x`;
};

// Helper to get number of images description
export const getNumImagesDescription = (value: NumImagesValue): string => {
  const option = NUM_IMAGES_OPTIONS.find(o => o.value === value);
  return option?.description || '';
};
