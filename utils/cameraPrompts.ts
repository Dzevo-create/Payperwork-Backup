/**
 * Converts camera movement settings into natural language prompt text
 * This replaces Kling AI's buggy camera_control API parameter
 */

type CameraMovement = "none" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "tilt_up" | "tilt_down";

const CAMERA_PROMPTS: Record<CameraMovement, string> = {
  none: "",
  zoom_in: "The camera slowly zooms in, getting closer to the subject. Smooth cinematic zoom movement.",
  zoom_out: "The camera smoothly zooms out, revealing more of the scene. Gradual pullback shot.",
  pan_left: "The camera pans slowly to the left. Smooth horizontal camera movement from right to left.",
  pan_right: "The camera pans slowly to the right. Smooth horizontal camera movement from left to right.",
  tilt_up: "The camera tilts upward, revealing what's above. Smooth vertical camera movement upwards.",
  tilt_down: "The camera tilts downward, showing what's below. Smooth vertical camera movement downwards.",
};

/**
 * Adds camera movement description to the prompt if a movement is selected
 */
export function addCameraMovementToPrompt(originalPrompt: string, cameraMovement?: CameraMovement): string {
  if (!cameraMovement || cameraMovement === "none") {
    return originalPrompt;
  }

  const cameraText = CAMERA_PROMPTS[cameraMovement];
  if (!cameraText) {
    return originalPrompt;
  }

  // Add camera movement at the end of the prompt
  return `${originalPrompt}. ${cameraText}`;
}
