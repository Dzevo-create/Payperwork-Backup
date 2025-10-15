/**
 * Image Settings Configuration
 *
 * Central export point for all image generation settings configurations.
 * Includes presets, styles, lighting, quality, aspect ratios, and number of images options.
 *
 * Usage:
 * ```typescript
 * import { IMAGE_PRESETS, IMAGE_STYLES, getPresetDefaults } from '@/config/imageSettings';
 * ```
 */

// Export all configurations
export * from './presets';
export * from './styles';
export * from './lighting';
export * from './aspectRatios';
export * from './quality';
export * from './numImages';
export * from './types';

// Re-export commonly used types for convenience
import type { ImagePresetKey, PresetValue } from './presets';
import type { ImageStyleValue } from './styles';
import type { LightingValue } from './lighting';
import type { AspectRatioValue } from './aspectRatios';
import type { QualityValue } from './quality';
import type { NumImagesValue } from './numImages';

/**
 * Complete Image Settings Configuration Type
 *
 * Combines all configuration types into a single comprehensive type
 */
export interface ImageSettingsConfig {
  preset?: PresetValue;
  style?: ImageStyleValue;
  lighting?: LightingValue;
  quality: QualityValue;
  aspectRatio: AspectRatioValue;
  numImages: NumImagesValue;
}

/**
 * Default Image Settings
 *
 * Provides sensible defaults for image generation
 */
export const DEFAULT_IMAGE_SETTINGS: ImageSettingsConfig = {
  preset: 'none',
  style: undefined,
  lighting: undefined,
  quality: 'high',
  aspectRatio: '1:1',
  numImages: 1,
};

/**
 * Helper Types
 */
export type {
  ImagePresetKey,
  PresetValue,
  ImageStyleValue,
  LightingValue,
  AspectRatioValue,
  QualityValue,
  NumImagesValue,
};
