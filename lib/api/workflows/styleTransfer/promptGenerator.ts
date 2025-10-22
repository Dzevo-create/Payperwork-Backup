/**
 * Style-Transfer Prompt Generator
 *
 * Neues Preset-System mit zwei Modi:
 *
 * MODE 1 - PRESET:
 * - Bereich (Interieur / Exterieur)
 * - Stil (6 Optionen: mediterran, ikea, minimalistisch, modern, mittelalterlich, industrial)
 * - Tageszeit (6 Optionen: morgen, mittag, abend, nacht, daemmerung, golden_hour)
 * - Wetter (6 Optionen: sonnig, bewoelkt, regen, schnee, nebel, sturm)
 * - Render-Art (5 Optionen: fotorealistisch, skizze, wasserfarben, blaupause, kuenstlerisch)
 * - Structure Preservation (0-100%)
 *
 * MODE 2 - REFERENZBILD:
 * - Material-Transfer von hochgeladenem Referenzbild
 * - Structure Preservation (0-100%)
 */

import {
  StyleTransferSettingsType,
  STYLE_DETAILS,
  TIME_OF_DAY_DESCRIPTIONS,
  WEATHER_DESCRIPTIONS,
  RENDER_STYLE_DESCRIPTIONS,
} from "@/types/workflows/styleTransferSettings";
import { StyleDescription } from "./styleAnalyzer";

/**
 * Hauptfunktion - Route zwischen Preset und Referenzbild-Modus
 */
export function generateStyleTransferPrompt(
  settings: StyleTransferSettingsType,
  hasReferenceImage: boolean = false,
  userPrompt?: string
): string {
  // Wenn Referenzbild vorhanden ist, verwende Material-Transfer
  if (settings.mode === "reference" || hasReferenceImage) {
    return generateReferencePrompt(settings, userPrompt);
  }

  // Ansonsten verwende Preset-System
  return generatePresetPrompt(settings, userPrompt);
}

/**
 * MODE 1: Preset-basierter Prompt
 *
 * Erstellt detaillierten Prompt basierend auf gewählten Preset-Optionen
 */
function generatePresetPrompt(settings: StyleTransferSettingsType, userPrompt?: string): string {
  const { spaceType, architecturalStyle, timeOfDay, weather, renderStyle, structurePreservation } =
    settings;

  // Hole Details für den gewählten Stil
  const styleDetails = STYLE_DETAILS[architecturalStyle];
  const timeDescription = TIME_OF_DAY_DESCRIPTIONS[timeOfDay];
  const weatherDescription = WEATHER_DESCRIPTIONS[weather];
  const renderDescription = RENDER_STYLE_DESCRIPTIONS[renderStyle];

  // Bereich-spezifische Einleitung
  const spaceIntro =
    spaceType === "interieur"
      ? "Transform this interior space"
      : "Transform this exterior architectural scene";

  // Hauptprompt zusammenbauen
  let prompt = `${spaceIntro} into a stunning ${renderStyle} rendering in ${styleDetails.name} style.\n\n`;

  // Stil-Beschreibung
  prompt += `ARCHITECTURAL STYLE:\n`;
  prompt += `${styleDetails.beschreibung}\n\n`;

  prompt += `KEY CHARACTERISTICS:\n`;
  prompt += `- ${styleDetails.charakteristik}\n`;
  prompt += `- Materials: ${styleDetails.materialien.join(", ")}\n`;
  prompt += `- Colors: ${styleDetails.farben.join(", ")}\n\n`;

  // Tageszeit & Beleuchtung
  prompt += `LIGHTING & TIME OF DAY:\n`;
  prompt += `${timeDescription}\n\n`;

  // Wetter & Atmosphäre
  prompt += `WEATHER & ATMOSPHERE:\n`;
  prompt += `${weatherDescription}\n\n`;

  // Render-Art Spezifikationen
  prompt += `RENDERING STYLE:\n`;
  prompt += `${renderDescription}\n\n`;

  // Structure Preservation
  prompt += `COMPOSITION & STRUCTURE:\n`;
  if (structurePreservation >= 80) {
    prompt += `Strictly preserve the exact composition, proportions, and perspective of the original image. Maintain all architectural elements in their precise positions and relationships.\n`;
  } else if (structurePreservation >= 50) {
    prompt += `Maintain the general composition and key architectural elements while allowing moderate creative interpretation of details and materiality.\n`;
  } else {
    prompt += `Use the original composition as inspiration, but allow significant creative freedom in interpretation, proportions, and architectural details.\n`;
  }

  // Technische Qualitätsanforderungen
  prompt += `\nQUALITY REQUIREMENTS:\n`;
  prompt += `- High attention to architectural detail and material accuracy\n`;
  prompt += `- Proper scale and proportions consistent with ${styleDetails.name} architecture\n`;
  prompt += `- Realistic shadows and reflections appropriate for the chosen lighting conditions\n`;
  prompt += `- Atmospheric depth and environmental context\n`;

  // User Prompt anhängen
  if (userPrompt && userPrompt.trim()) {
    prompt += `\n\nADDITIONAL REQUIREMENTS:\n${userPrompt.trim()}`;
  }

  return prompt;
}

/**
 * MODE 2: Referenzbild-basierter Prompt (Material Transfer)
 *
 * Überträgt nur Materialien und Texturen vom Referenzbild,
 * behält aber die Struktur des Originalbildes bei.
 */
function generateReferencePrompt(settings: StyleTransferSettingsType, userPrompt?: string): string {
  const { structurePreservation, renderStyle } = settings;

  // Render-Art Beschreibung
  const renderDescription = RENDER_STYLE_DESCRIPTIONS[renderStyle];

  let prompt = `Transfer the materials, textures, colors, and surface qualities from the reference image to this architectural scene.\n\n`;

  prompt += `MATERIAL TRANSFER INSTRUCTIONS:\n`;
  prompt += `- Analyze the materials visible in the reference image (e.g., wood grain, stone texture, metal finishes, fabric patterns, surface colors)\n`;
  prompt += `- Apply these exact materials and textures to the corresponding surfaces in the target image\n`;
  prompt += `- Maintain the color palette and material characteristics from the reference\n`;
  prompt += `- Preserve lighting properties and reflectance qualities of the reference materials\n\n`;

  // Render-Art Spezifikation (NEU!)
  prompt += `RENDERING STYLE:\n`;
  prompt += `${renderDescription}\n\n`;

  prompt += `STRUCTURE PRESERVATION:\n`;
  if (structurePreservation >= 80) {
    prompt += `CRITICAL: Do NOT change the composition, perspective, or architectural forms of the target image. Only apply the materials from the reference image to the existing structures. Every wall, window, door, and architectural element must remain in its exact original position and proportion.\n`;
  } else if (structurePreservation >= 50) {
    prompt += `Maintain the general architectural layout and key structural elements of the target image, while allowing moderate adjustments to details when applying the reference materials.\n`;
  } else {
    prompt += `Use the target image's composition as a guide, but allow creative freedom in how the reference materials are applied and interpreted across the architectural elements.\n`;
  }

  prompt += `\nQUALITY REQUIREMENTS:\n`;
  prompt += `- Seamless material application that respects the target architecture's geometry\n`;
  prompt += `- Consistent lighting that matches the reference material properties\n`;
  prompt += `- Natural integration of textures that follows architectural surfaces correctly\n`;
  prompt += `- ${renderStyle} rendering of all transferred materials\n`;

  // User Prompt anhängen
  if (userPrompt && userPrompt.trim()) {
    prompt += `\n\nADDITIONAL REQUIREMENTS:\n${userPrompt.trim()}`;
  }

  return prompt;
}

/**
 * MODE 2 (ENHANCED): Referenzbild-basierter Prompt MIT Stil-Analyse
 *
 * Diese Funktion verwendet die extrahierte Stil-Beschreibung aus dem Reference Image
 * um einen detaillierten, konkreten Prompt zu generieren.
 *
 * WICHTIG: Das Reference Image wird NICHT an Nano Banana geschickt!
 * Nur das Source Image + dieser detaillierte Prompt.
 *
 * Use-Case:
 * - Source: Weißes Volumen-Modell (simple 3D massing)
 * - Reference: Holzfassade (für Stil-Extraktion)
 * - Output: Hyper-realistisches Rendering mit Holzfassade
 */
export function generateReferencePromptWithStyleAnalysis(
  settings: StyleTransferSettingsType,
  styleDescription: StyleDescription,
  userPrompt?: string,
  sourceImageDescription?: string // ✅ NEW: Phase 1 - WHAT IS in source image
): string {
  const { structurePreservation, renderStyle } = settings;
  const renderDescription = RENDER_STYLE_DESCRIPTIONS[renderStyle];

  // ✅ PHASE 1: WHAT IS (beschreibe was IST)
  let prompt = `SOURCE IMAGE DESCRIPTION:\n`;
  if (sourceImageDescription) {
    // Use actual analysis of source image
    prompt += `${sourceImageDescription}\n\n`;
  } else {
    // Fallback (should not happen with 2-phase approach)
    prompt += `A white architectural volume model (simple massing study)\n\n`;
  }

  // ✅ PHASE 2: WHAT SHOULD BECOME (beschreibe was werden soll)
  prompt += `TRANSFORMATION GOAL:\n`;
  prompt += `Transform the source image into a fully photorealistic architectural rendering with the following specifications.\n\n`;

  // Stil-Beschreibung aus Reference Image
  prompt += `TARGET STYLE & MATERIALS (extracted from reference):\n`;
  prompt += `${styleDescription.detailedDescription}\n\n`;

  // Materialien detailliert auflisten
  prompt += `MATERIALS TO APPLY:\n`;
  styleDescription.materials.forEach((material) => {
    prompt += `- ${material}\n`;
  });
  prompt += `\n`;

  // Farb-Palette
  prompt += `COLOR PALETTE:\n`;
  styleDescription.colors.forEach((color) => {
    prompt += `- ${color}\n`;
  });
  prompt += `\n`;

  // Texturen & Muster
  prompt += `TEXTURES & SURFACE QUALITIES:\n`;
  styleDescription.textures.forEach((texture) => {
    prompt += `- ${texture}\n`;
  });
  if (styleDescription.patterns.length > 0) {
    prompt += `\nPATTERNS & RHYTHMS:\n`;
    styleDescription.patterns.forEach((pattern) => {
      prompt += `- ${pattern}\n`;
    });
  }
  prompt += `\n`;

  // Oberflächen-Finishes
  prompt += `SURFACE FINISHES:\n`;
  styleDescription.finishes.forEach((finish) => {
    prompt += `- ${finish}\n`;
  });
  prompt += `\n`;

  // ✅ NEW: Window Style (CRITICAL!)
  if (styleDescription.windowStyle) {
    prompt += `WINDOW DESIGN (CRITICAL - Apply STYLE from reference to SOURCE building windows):\n`;
    prompt += `${styleDescription.windowStyle}\n`;
    prompt += `IMPORTANT: Keep the SOURCE building's window POSITIONS and SIZES unchanged. Only apply the reference's window STYLING:\n`;
    prompt += `- Frame style and colors from reference\n`;
    prompt += `- Frame thickness and details from reference\n`;
    prompt += `- Window shape/form (rounded corners, arches, etc.) from reference\n`;
    prompt += `- BUT: Maintain SOURCE building's window locations, count, and overall size\n\n`;
  }

  // ✅ NEW: Facade Structure (CRITICAL!)
  if (styleDescription.facadeStructure) {
    prompt += `FACADE STRUCTURE (CRITICAL - Apply 3D STYLING from reference, NOT geometry):\n`;
    prompt += `${styleDescription.facadeStructure}\n`;
    prompt += `IMPORTANT: Keep the SOURCE building's VOLUME, FORM, and GEOMETRY unchanged. Only apply the reference's facade TREATMENT:\n`;
    prompt += `- Surface relief and depth treatment (panels, reveals) from reference\n`;
    prompt += `- Material layering and 3D texture from reference\n`;
    prompt += `- Facade articulation style from reference\n`;
    prompt += `- BUT: Maintain SOURCE building's overall shape, height, width, and proportions\n`;
    prompt += `- Think: "Same building, different skin treatment"\n\n`;
  }

  // ✅ NEW: Architectural Elements
  if (styleDescription.architecturalElements && styleDescription.architecturalElements.length > 0) {
    prompt += `ARCHITECTURAL ELEMENTS (Apply from reference):\n`;
    styleDescription.architecturalElements.forEach((element) => {
      prompt += `- ${element}\n`;
    });
    prompt += `Integrate these exact architectural elements into the design.\n\n`;
  }

  // ✅ NEW: Proportions
  if (styleDescription.proportions) {
    prompt += `PROPORTIONS & RHYTHM:\n`;
    prompt += `${styleDescription.proportions}\n`;
    prompt += `Match these proportions and spacing rhythms from the reference image.\n\n`;
  }

  // ✅ SOURCE IMAGE TRANSFORMATION (no assumptions!)
  prompt += `TRANSFORMATION REQUIREMENTS:\n`;
  prompt += `Apply the following to the source image to create a FULLY PHOTOREALISTIC architectural rendering:\n`;
  prompt += `- All materials, textures, and colors listed above applied to appropriate surfaces\n`;
  prompt += `- Window design exactly as specified (frames, colors, shapes, arrangement)\n`;
  prompt += `- Facade structure with correct 3D depth and relief\n`;
  prompt += `- All architectural elements as listed\n`;
  prompt += `- Correct proportions and spacing rhythm\n`;
  prompt += `- Detailed facade elements (balconies, canopies, sun shading, etc.)\n`;
  prompt += `- Realistic surrounding environment (ground, landscaping, trees, sky, neighboring context)\n`;
  prompt += `- Natural daylight lighting with soft shadows, ambient occlusion, and realistic reflections\n`;
  prompt += `- Atmospheric perspective and depth (sky gradients, distant haze, environmental context)\n`;
  prompt += `- Professional architectural visualization quality with ${renderStyle} rendering\n\n`;

  // STRUCTURE PRESERVATION - Sehr wichtig!
  prompt += `CRITICAL STRUCTURE PRESERVATION (${structurePreservation}%):\n`;
  prompt += `\nIMPORTANT DISTINCTION:\n`;
  prompt += `- PRESERVE: Source building's volume, form, geometry, perspective, camera angle\n`;
  prompt += `- TRANSFER: Reference image's materials, colors, window styling, facade treatment\n`;
  prompt += `- METAPHOR: "Same building, different skin"\n\n`;

  if (structurePreservation >= 80) {
    prompt += `MAINTAIN EXACT BUILDING GEOMETRY:\n`;
    prompt += `- Keep PRECISE building proportions (height, width, depth) FROM SOURCE\n`;
    prompt += `- Preserve ALL window and door opening POSITIONS FROM SOURCE\n`;
    prompt += `- Maintain exact roof geometry and building footprint FROM SOURCE\n`;
    prompt += `- Keep camera angle, perspective, and viewpoint FROM SOURCE\n`;
    prompt += `- Do NOT change the architectural composition or building form\n`;
    prompt += `- ONLY apply reference's materials, colors, window styling, facade treatment to source's unchanged geometry\n`;
    prompt += `- Think: "Reskin the same building with reference's aesthetic"\n`;
  } else if (structurePreservation >= 50) {
    prompt += `MAINTAIN GENERAL ARCHITECTURAL LAYOUT:\n`;
    prompt += `- Keep main building proportions and overall form\n`;
    prompt += `- Preserve key structural elements and major openings\n`;
    prompt += `- Allow moderate adjustments to details for photorealism\n`;
    prompt += `- Maintain general composition and perspective\n`;
  } else {
    prompt += `USE VOLUME MODEL AS CREATIVE GUIDE:\n`;
    prompt += `- Maintain overall building form and general proportions\n`;
    prompt += `- Allow creative interpretation of details and material application\n`;
    prompt += `- Adjust elements as needed for realistic architectural coherence\n`;
  }
  prompt += `\n`;

  // QUALITÄTS-ANFORDERUNGEN
  prompt += `PHOTOREALISM REQUIREMENTS:\n`;
  prompt += `- FULLY PHOTOREALISTIC rendering (NOT a sketch, drawing, or stylized image)\n`;
  prompt += `- High detail in all materials, textures, and architectural elements\n`;
  prompt += `- Realistic lighting with natural shadow casting and light bounce\n`;
  prompt += `- Proper atmospheric perspective (distant elements fade, aerial perspective)\n`;
  prompt += `- Professional architectural photography quality\n`;
  prompt += `- Natural integration of building with realistic surroundings\n`;
  prompt += `- ${renderDescription}\n`;

  // Overall Style (als Summary)
  if (styleDescription.overallStyle) {
    prompt += `\nOVERALL ARCHITECTURAL CHARACTER:\n`;
    prompt += `${styleDescription.overallStyle}\n`;
  }

  // User Prompt anhängen
  if (userPrompt && userPrompt.trim()) {
    prompt += `\n\nADDITIONAL USER REQUIREMENTS:\n${userPrompt.trim()}`;
  }

  return prompt;
}
