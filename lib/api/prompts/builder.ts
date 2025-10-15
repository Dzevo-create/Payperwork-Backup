/**
 * Prompt Builder - Modulares System für Prompt-Generierung
 */

import {
  BASE_FRAGMENTS,
  STYLE_GUIDES,
  LIGHTING_GUIDES,
  QUALITY_GUIDES,
  ASPECT_RATIO_GUIDES,
  PRESET_GUIDES,
} from './fragments';

export interface ImageSettings {
  style?: string;
  lighting?: string;
  quality?: string;
  aspectRatio?: string;
  preset?: string;
}

// Helper to build image settings context
export function buildImageSettingsContext(imageSettings?: ImageSettings): string {
  if (!imageSettings) return "";

  let context = "\n\n# BILD-EINSTELLUNGEN (User-Vorgaben)";

  if (imageSettings.style && STYLE_GUIDES[imageSettings.style]) {
    context += `\n- Stil: ${STYLE_GUIDES[imageSettings.style]}`;
  }

  if (imageSettings.lighting && LIGHTING_GUIDES[imageSettings.lighting]) {
    context += `\n- Beleuchtung: ${LIGHTING_GUIDES[imageSettings.lighting]}`;
  }

  if (imageSettings.quality && QUALITY_GUIDES[imageSettings.quality]) {
    context += `\n- Qualität: ${QUALITY_GUIDES[imageSettings.quality]}`;
  }

  if (imageSettings.aspectRatio && ASPECT_RATIO_GUIDES[imageSettings.aspectRatio]) {
    context += `\n- Format: ${ASPECT_RATIO_GUIDES[imageSettings.aspectRatio]}`;
  }

  if (imageSettings.preset && imageSettings.preset !== "none" && PRESET_GUIDES[imageSettings.preset]) {
    context += `\n- Preset: ${PRESET_GUIDES[imageSettings.preset]}`;
  }

  context += `\n\nINTEGRIERE diese Vorgaben natürlich in den Prompt.`;
  return context;
}

// Video context helpers
export function buildVideoSettingsContext(videoContext: string): string {
  if (!videoContext) return "";

  let result = `\n\n# VIDEO-EINSTELLUNGEN\n${videoContext}`;

  const cameraMovement = videoContext.match(/Kamera: (.+)/)?.[1];
  if (cameraMovement && cameraMovement !== "none" && !cameraMovement.includes("Keine")) {
    result += `\n\nKRITISCH: Die Kamerabewegung MUSS natürlich in den Prompt integriert werden.`;
    if (cameraMovement.includes("forward_up") || cameraMovement.includes("Vorwärts")) {
      result += ` Beschreibe, wie die Kamera sich vorwärts bewegt und nach oben neigt, um mehr vom Himmel/der Umgebung zu enthüllen.`;
    } else if (cameraMovement.includes("down_back") || cameraMovement.includes("Abwärts")) {
      result += ` Beschreibe, wie die Kamera sich abwärts und zurück bewegt, um Tiefe zu zeigen.`;
    } else if (cameraMovement.includes("right_turn") || cameraMovement.includes("Rechts")) {
      result += ` Beschreibe, wie die Kamera sich nach rechts dreht während sie vorwärts fährt.`;
    } else if (cameraMovement.includes("left_turn") || cameraMovement.includes("Links")) {
      result += ` Beschreibe, wie die Kamera sich nach links dreht während sie vorwärts fährt.`;
    }
  }

  const duration = videoContext.match(/(\d+) Sekunden/)?.[1];
  if (duration === "5") {
    result += `\n\nDas Video ist kurz (5 Sekunden). Fokussiere auf eine einzelne, klare Aktion oder Bewegung.`;
  } else {
    result += `\n\nDas Video ist länger (10 Sekunden). Du kannst eine komplexere Sequenz oder mehrere Aktionen beschreiben.`;
  }

  return result;
}
