/**
 * Quality Options
 *
 * Defines available quality levels for image generation
 * (standard, high, ultra)
 */

export const QUALITY_OPTIONS = [
  {
    value: 'standard' as const,
    label: 'Standard',
    description: 'Schnelle Generierung, gute Qualität'
  },
  {
    value: 'high' as const,
    label: 'Hoch',
    description: 'Ausgewogene Qualität und Geschwindigkeit'
  },
  {
    value: 'ultra' as const,
    label: 'Ultra',
    description: 'Höchste Qualität, längere Generierung'
  },
] as const;

// Type for quality values
export type QualityValue = 'standard' | 'high' | 'ultra';

// Helper to get quality label
export const getQualityLabel = (value: QualityValue): string => {
  const quality = QUALITY_OPTIONS.find(q => q.value === value);
  return quality?.label || 'Standard';
};

// Helper to get short quality label (for compact UI)
export const getQualityLabelShort = (value: QualityValue): string => {
  switch (value) {
    case 'ultra':
      return 'Ultra';
    case 'high':
      return 'High';
    case 'standard':
      return 'Std';
    default:
      return 'Std';
  }
};

// Helper to get quality description
export const getQualityDescription = (value: QualityValue): string => {
  const quality = QUALITY_OPTIONS.find(q => q.value === value);
  return quality?.description || '';
};
