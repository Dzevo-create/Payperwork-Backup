/**
 * Image Settings Types
 *
 * TypeScript type definitions for image generation settings
 */

import type {
  PresetValue,
  ImageStyleValue,
  LightingValue,
  AspectRatioValue,
  QualityValue,
  NumImagesValue,
} from './index';

/**
 * Complete Image Settings Type
 *
 * This type is used throughout the application for image generation settings
 */
export interface ImageSettingsType {
  preset?: PresetValue;
  style?: ImageStyleValue;
  lighting?: LightingValue;
  quality: QualityValue;
  aspectRatio: AspectRatioValue;
  numImages: NumImagesValue;
}

/**
 * Partial Image Settings Type
 *
 * Used when updating settings (not all fields required)
 */
export type PartialImageSettings = Partial<ImageSettingsType>;

/**
 * Image Settings Props
 *
 * Props for ImageSettings component
 */
export interface ImageSettingsProps {
  settings: ImageSettingsType;
  onSettingsChange: (settings: ImageSettingsType) => void;
}

/**
 * Dropdown Type
 *
 * Used for managing which dropdown is currently open
 */
export type DropdownType = 'preset' | 'style' | 'lighting' | 'quality' | 'aspect' | 'numImages' | null;
