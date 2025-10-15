/**
 * Lighting Options
 *
 * Defines available lighting conditions for image generation
 * (natural, studio, dramatic, golden hour, neon, soft)
 */

export const LIGHTING_OPTIONS = [
  {
    value: undefined,
    label: 'Auto (Enhancer wählt)'
  },
  {
    value: 'natural' as const,
    label: 'Natürliches Licht'
  },
  {
    value: 'studio' as const,
    label: 'Studio-Beleuchtung'
  },
  {
    value: 'dramatic' as const,
    label: 'Dramatisch'
  },
  {
    value: 'golden_hour' as const,
    label: 'Golden Hour'
  },
  {
    value: 'neon' as const,
    label: 'Neon'
  },
  {
    value: 'soft' as const,
    label: 'Weiches Licht'
  },
] as const;

// Type for lighting values
export type LightingValue = 'natural' | 'studio' | 'dramatic' | 'golden_hour' | 'neon' | 'soft' | undefined;

// Helper to get lighting label
export const getLightingLabel = (value: LightingValue): string => {
  const lighting = LIGHTING_OPTIONS.find(l => l.value === value);
  return lighting?.label || 'Auto';
};

// Helper to get short lighting label (for compact UI)
export const getLightingLabelShort = (value: LightingValue): string => {
  if (!value) return 'Auto';
  const lighting = LIGHTING_OPTIONS.find(l => l.value === value);
  return lighting?.label.split(' ')[0] || 'Auto';
};
