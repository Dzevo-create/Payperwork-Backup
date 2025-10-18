/**
 * Video Settings Configuration Index
 * Central export and helper functions for video model configurations
 */

// Export all Kling configurations
export {
  KLING_DURATIONS,
  KLING_ASPECT_RATIOS,
  KLING_ASPECT_RATIOS_WITH_ORIGINAL,
  KLING_MODES,
  KLING_CAMERA_MOVEMENTS,
  type KlingDuration,
  type KlingAspectRatio,
  type KlingAspectRatioWithOriginal,
  type KlingMode,
  type KlingCameraMovement
} from './kling';

// Export all Sora configurations
export {
  SORA_DURATIONS,
  SORA_ASPECT_RATIOS,
  SORA_ASPECT_RATIOS_WITH_AUTO,
  type SoraDuration,
  type SoraAspectRatio,
  type SoraAspectRatioWithAuto
} from './sora';

// Video model type
export type VideoModel = 'kling' | 'sora2';

// Video configuration interface
export interface VideoConfig {
  durations: readonly { value: string; label: string }[];
  aspectRatios: readonly { value: string; label: string }[];
  aspectRatiosWithImage: readonly { value: string; label: string }[];
  hasModes: boolean;
  hasCameraMovement: boolean;
  hasAudio: boolean;
  supports1x1: boolean;
}

/**
 * Get complete video configuration based on the selected model
 *
 * @param model - The video model to get configuration for ('kling' | 'sora2')
 * @returns Complete configuration object for the specified model
 *
 * @example
 * ```typescript
 * const config = getVideoConfig('sora2');
 * console.log(config.durations); // [4s, 8s, 12s]
 * console.log(config.hasAudio); // true
 * ```
 */
export function getVideoConfig(model: VideoModel): VideoConfig {
  if (model === 'sora2') {
    return {
      durations: SORA_DURATIONS,
      aspectRatios: SORA_ASPECT_RATIOS,
      aspectRatiosWithImage: SORA_ASPECT_RATIOS_WITH_AUTO,
      hasModes: false,
      hasCameraMovement: false,
      hasAudio: true,
      supports1x1: false // Sora 2 does NOT support 1:1 aspect ratio
    };
  }

  // Default: Kling AI
  return {
    durations: KLING_DURATIONS,
    aspectRatios: KLING_ASPECT_RATIOS,
    aspectRatiosWithImage: KLING_ASPECT_RATIOS_WITH_ORIGINAL,
    hasModes: true,
    hasCameraMovement: true,
    hasAudio: false,
    supports1x1: true // Kling supports 1:1 aspect ratio
  };
}

/**
 * Get duration options based on the selected model
 *
 * @param model - The video model to get durations for
 * @returns Array of duration options
 */
export function getDurationOptions(model: VideoModel) {
  return getVideoConfig(model).durations;
}

/**
 * Get aspect ratio options based on the selected model and image attachment
 *
 * @param model - The video model to get aspect ratios for
 * @param hasImageAttachment - Whether an image is attached
 * @returns Array of aspect ratio options
 */
export function getAspectRatioOptions(model: VideoModel, hasImageAttachment: boolean) {
  const config = getVideoConfig(model);
  return hasImageAttachment ? config.aspectRatiosWithImage : config.aspectRatios;
}

/**
 * Check if a specific feature is available for the given model
 *
 * @param model - The video model to check
 * @param feature - The feature to check for
 * @returns Boolean indicating if the feature is available
 */
export function hasFeature(
  model: VideoModel,
  feature: 'modes' | 'cameraMovement' | 'audio' | '1x1'
): boolean {
  const config = getVideoConfig(model);

  switch (feature) {
    case 'modes':
      return config.hasModes;
    case 'cameraMovement':
      return config.hasCameraMovement;
    case 'audio':
      return config.hasAudio;
    case '1x1':
      return config.supports1x1;
    default:
      return false;
  }
}

// Import statements for re-export
import {
  KLING_DURATIONS,
  KLING_ASPECT_RATIOS,
  KLING_ASPECT_RATIOS_WITH_ORIGINAL,
  // KLING_MODES,
  // KLING_CAMERA_MOVEMENTS
} from './kling';

import {
  SORA_DURATIONS,
  SORA_ASPECT_RATIOS,
  SORA_ASPECT_RATIOS_WITH_AUTO
} from './sora';
