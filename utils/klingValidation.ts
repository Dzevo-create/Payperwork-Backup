/**
 * Validates and auto-corrects Kling AI video settings to prevent API errors
 * Simplified: No more camera_control (moved to prompt text instead)
 */

interface VideoSettings {
  duration: "5" | "10";
  aspectRatio: "16:9" | "9:16" | "1:1";
  mode: "std" | "pro";
}

interface KlingAPIParams {
  model_name: string;
  mode: string;
  duration: string;
  aspect_ratio: string;
}

export function validateAndFixKlingSettings(settings: VideoSettings): {
  params: KlingAPIParams;
  warnings: string[];
} {
  const warnings: string[] = [];
  const { duration, aspectRatio, mode } = settings;

  // Build API params (simple now without camera_control)
  const params: KlingAPIParams = {
    model_name: "kling-v1",
    mode,
    duration,
    aspect_ratio: aspectRatio,
  };

  return { params, warnings };
}
