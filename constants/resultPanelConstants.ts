/**
 * ResultPanel Constants
 *
 * Shared constants for ResultPanel component and sub-components.
 */

export const CAMERA_MOVEMENTS = [
  { label: "Push In", value: "push in" },
  { label: "Push Out", value: "push out" },
  { label: "Pan Left", value: "pan left" },
  { label: "Pan Right", value: "pan right" },
  { label: "Pan Up", value: "pan up" },
  { label: "Pan Down", value: "pan down" },
  { label: "Orbit Left", value: "orbit left" },
  { label: "Orbit Right", value: "orbit right" },
  { label: "Crane Up", value: "crane up" },
  { label: "Crane Down", value: "crane down" },
  { label: "Dolly In", value: "dolly in" },
  { label: "Dolly Out", value: "dolly out" },
  { label: "Tilt Up", value: "tilt up" },
  { label: "Tilt Down", value: "tilt down" },
  { label: "Zoom In", value: "zoom in" },
  { label: "Zoom Out", value: "zoom out" },
  { label: "Static", value: "static camera" },
] as const;

export const VIDEO_DURATIONS = [
  { label: "5 Sekunden", value: 5 },
  { label: "10 Sekunden", value: 10 },
] as const;

export type CameraMovement = typeof CAMERA_MOVEMENTS[number];
export type VideoDuration = typeof VIDEO_DURATIONS[number];
