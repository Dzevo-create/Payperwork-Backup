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

  // ⚠️ DEPRECATED - This slider is no longer used in reference mode
  // Use styleIntensity instead (see generateReferencePromptWithStyleAnalysis)

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
  const { structurePreservation, styleIntensity, renderStyle } = settings;
  const renderDescription = RENDER_STYLE_DESCRIPTIONS[renderStyle];

  // ✅ EXPLICIT ARCHITECTURAL TRANSFER PROMPT
  let prompt = `ARCHITECTURAL STYLE TRANSFER TASK:\n`;
  prompt += `Transform Image 1 (source) by applying Image 2's (reference) architectural design.\n\n`;

  // CRITICAL: Structure preservation
  prompt += `PRESERVE FROM SOURCE (Image 1):\n`;
  if (structurePreservation >= 80) {
    prompt += `✅ Building height (exact number of floors)\n`;
    prompt += `✅ Building width and depth (footprint)\n`;
    prompt += `✅ Overall building form (rectangular, L-shape, etc.)\n`;
    prompt += `✅ Window COUNT and GRID POSITIONS\n`;
    prompt += `✅ Camera angle and viewpoint\n\n`;
  }

  // CRITICAL: Style transfer based on intensity
  prompt += `TRANSFORM FROM REFERENCE (Image 2):\n`;

  if (styleIntensity >= 80) {
    // HIGH intensity: Full architectural design transfer
    prompt += `🔥 FULL ARCHITECTURAL DESIGN TRANSFER:\n\n`;

    // Windows - MOST CRITICAL
    if (styleDescription.windowStyle) {
      prompt += `WINDOW TRANSFORMATION (CRITICAL!):\n`;
      prompt += `Reference windows: ${styleDescription.windowStyle}\n`;
      prompt += `ACTION: Replace source's window DESIGN with reference's window DESIGN:\n`;
      prompt += `- If reference has arched windows → Make source windows arched\n`;
      prompt += `- If reference has red frames → Make source window frames red\n`;
      prompt += `- If reference has rounded panel elements → Add them to source\n`;
      prompt += `- Keep source's window POSITIONS and COUNT unchanged\n`;
      prompt += `- Only change the STYLE/APPEARANCE of each window\n\n`;
    }

    // Facade - SECOND MOST CRITICAL
    if (styleDescription.facadeStructure) {
      prompt += `FACADE TRANSFORMATION (CRITICAL!):\n`;
      prompt += `Reference facade: ${styleDescription.facadeStructure}\n`;
      prompt += `ACTION: Add 3D relief and articulation to source facade:\n`;
      prompt += `- If reference has vertical relief elements → Add them to source\n`;
      prompt += `- If reference has panel depth → Create same depth on source\n`;
      prompt += `- If reference has decorative elements → Apply to source\n`;
      prompt += `- Create shadow play similar to reference\n\n`;
    }

    // Architectural elements
    if (
      styleDescription.architecturalElements &&
      styleDescription.architecturalElements.length > 0
    ) {
      prompt += `ARCHITECTURAL ELEMENTS:\n`;
      styleDescription.architecturalElements.forEach((element) => {
        prompt += `- Add: ${element}\n`;
      });
      prompt += `\n`;
    }

    // Materials & Colors
    prompt += `MATERIALS & COLORS:\n`;
    prompt += `Apply: ${styleDescription.materials.join(", ")}\n`;
    prompt += `Colors: ${styleDescription.colors.join(", ")}\n\n`;
  } else if (styleIntensity >= 50) {
    // MEDIUM intensity: Moderate transfer
    prompt += `⚖️ MODERATE DESIGN TRANSFER:\n`;
    prompt += `- Apply window frame STYLING from reference (not full shape change)\n`;
    prompt += `- Add SOME facade relief elements\n`;
    prompt += `- Apply materials and colors from reference\n\n`;
  } else {
    // LOW intensity: Material only
    prompt += `🪶 MATERIAL TRANSFER ONLY:\n`;
    prompt += `- Keep source's window shapes unchanged\n`;
    prompt += `- Keep source's facade flat\n`;
    prompt += `- ONLY apply materials/colors: ${styleDescription.materials.join(", ")}\n\n`;
  }

  // Output requirements
  prompt += `OUTPUT REQUIREMENTS:\n`;
  prompt += `- ${renderStyle} rendering, fully photorealistic\n`;
  prompt += `- Match source image's aspect ratio\n`;
  prompt += `- Professional architectural visualization\n`;

  if (userPrompt && userPrompt.trim()) {
    prompt += `\n${userPrompt.trim()}\n`;
  }

  return prompt;
}
