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
      ? "TRANSFORM this interior space"
      : "TRANSFORM this exterior building";

  // Hauptprompt zusammenbauen - IMPERATIVE STYLE
  let prompt = `${spaceIntro} into ${styleDetails.name} architectural style with ${renderStyle} rendering.

APPLY STYLE: ${styleDetails.beschreibung}

TARGET CHARACTERISTICS:
- ${styleDetails.charakteristik}
- USE materials: ${styleDetails.materialien.join(", ")}
- APPLY colors: ${styleDetails.farben.join(", ")}

SET LIGHTING: ${timeDescription}

CREATE ATMOSPHERE: ${weatherDescription}

RENDER AS: ${renderDescription}

`;

  // Structure Preservation - IMPERATIVE COMMANDS
  if (structurePreservation >= 80) {
    prompt += `STRUCTURAL CONSTRAINTS:
PRESERVE EXACTLY: composition, proportions, perspective, element positions
MAINTAIN: all architectural relationships

`;
  } else if (structurePreservation >= 50) {
    prompt += `STRUCTURAL CONSTRAINTS:
MAINTAIN: general composition and key elements
ALLOW: moderate reinterpretation of details and materials

`;
  } else {
    prompt += `STRUCTURAL CONSTRAINTS:
USE original as inspiration only
ALLOW: significant creative freedom in form and details

`;
  }

  // Technische Qualitätsanforderungen - IMPERATIVE
  prompt += `QUALITY REQUIREMENTS:
ENSURE: Architectural detail accuracy and material realism
MATCH: ${styleDetails.name} architecture scale and proportions
CREATE: Realistic shadows and reflections
INCLUDE: Atmospheric depth and environmental context
`;

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

  let prompt = `MATERIAL TRANSFER TASK: ANALYZE reference image, then APPLY its materials to the target building.

STEP 1 - ANALYZE REFERENCE:
IDENTIFY materials (wood grain, stone texture, metal finishes, surface colors)
EXTRACT color palette and material characteristics
NOTE lighting properties and surface qualities

STEP 2 - TRANSFER TO TARGET:
REPLACE target materials with reference materials
APPLY exact textures to corresponding surfaces
MATCH color palette from reference
PRESERVE reference material lighting properties

RENDER AS: ${renderDescription}

QUALITY REQUIREMENTS:
ENSURE seamless material application respecting geometry
MAINTAIN consistent lighting matching reference properties
INTEGRATE textures naturally following architectural surfaces
`;

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

  // ✅ IMPERATIVE PROMPT: Action-oriented commands (Target: 1000-1500 chars)
  let prompt = `ARCHITECTURAL STYLE TRANSFER - INSTRUCTION SET

SOURCE: ${sourceImageDescription || "Architectural building"}
REFERENCE STYLE: ${styleDescription.detailedDescription || styleDescription.overallStyle}

ANALYZE both images, then TRANSFORM the source building by APPLYING the reference architectural style.

`;

  // Structure preservation with granular control - IMPERATIVE COMMANDS
  if (structurePreservation >= 80) {
    // HIGH: Strict preservation
    prompt += `STRUCTURAL CONSTRAINTS (STRICT):
DO NOT CHANGE: Building height, form, window positions/count, proportions, camera angle
KEEP EXACTLY: All structural dimensions and spatial relationships

`;
  } else if (structurePreservation >= 50) {
    // MEDIUM: Moderate preservation
    prompt += `STRUCTURAL CONSTRAINTS (MODERATE):
MAINTAIN: Approximate building height and general form
PRESERVE: Overall window count and rough positioning
ALLOW: Minor adjustments to proportions for style consistency

`;
  } else {
    // LOW: Loose preservation
    prompt += `STRUCTURAL CONSTRAINTS (LOOSE):
KEEP: General building concept and approximate scale
ALLOW: Significant reinterpretation of proportions and layout

`;
  }

  // Style transfer with IMPERATIVE, ACTION-ORIENTED instructions
  if (styleIntensity >= 80) {
    // HIGH: Full architectural design transfer (80-100%)
    prompt += `TRANSFORMATION COMMANDS (HIGH INTENSITY):
`;

    if (styleDescription.windowStyle) {
      prompt += `WINDOWS - CHANGE COMPLETELY:
IDENTIFY current windows in source building
REPLACE window shapes with: ${styleDescription.windowStyle}
MODIFY frames, mullions, reveals to match reference exactly
ADD all decorative elements (arches, surrounds, trim, details)
APPLY reference window colors and finishes
MAINTAIN window positions from source (unless structure preservation is low)

`;
    }

    if (styleDescription.facadeStructure) {
      prompt += `FACADE - RESTRUCTURE FULLY:
ANALYZE reference facade: ${styleDescription.facadeStructure}
ADD 3D relief elements, projections, recesses
CREATE depth and shadow play as seen in reference
APPLY ornamental details, moldings, sculptural elements
TRANSFORM flat surfaces into articulated facade

`;
    }

    if (styleDescription.architecturalElements?.length) {
      prompt += `ARCHITECTURAL ELEMENTS - ADD ALL:
INCORPORATE these features: ${styleDescription.architecturalElements.join(", ")}
PLACE elements appropriately on facade
MATCH scale and proportion to reference

`;
    }

    prompt += `MATERIALS & COLORS - APPLY FULLY:
REPLACE source materials with: ${styleDescription.materials.join(", ")}
APPLY color palette: ${styleDescription.colors.join(", ")}
MATCH textures, finishes, and surface qualities from reference

GOAL: Transform source structure into reference architectural style while preserving source layout.

`;
  } else if (styleIntensity >= 50) {
    // MEDIUM: Moderate transfer (50-79%)
    prompt += `TRANSFORMATION COMMANDS (MEDIUM INTENSITY):
`;

    if (styleDescription.windowStyle) {
      prompt += `WINDOWS - MODIFY PARTIALLY:
KEEP basic window shape from source
ADD decorative frame details from reference: ${styleDescription.windowStyle}
APPLY reference colors to frames
INCORPORATE subtle design elements

`;
    }

    if (styleDescription.facadeStructure) {
      prompt += `FACADE - ADD MODERATE DETAIL:
INTRODUCE some 3D relief elements
ADD subtle texture and articulation
KEEP overall flatness closer to source

`;
    }

    prompt += `MATERIALS & COLORS - APPLY MODERATELY:
USE materials: ${styleDescription.materials.join(", ")}
APPLY colors: ${styleDescription.colors.join(", ")}
BLEND with source architectural character

`;
  } else if (styleIntensity >= 20) {
    // LOW: Materials & colors only (20-49%)
    prompt += `TRANSFORMATION COMMANDS (LOW INTENSITY):
KEEP all architectural forms from source
CHANGE ONLY surface materials to: ${styleDescription.materials.join(", ")}
APPLY ONLY color palette: ${styleDescription.colors.join(", ")}
DO NOT modify window shapes, facade structure, or architectural elements

`;
  } else {
    // VERY LOW: Almost no style transfer (0-19%)
    prompt += `TRANSFORMATION COMMANDS (MINIMAL):
KEEP almost everything from source unchanged
APPLY ONLY accent colors: ${styleDescription.colors.slice(0, 2).join(", ")}
MAKE minimal material adjustments

`;
  }

  // Output requirements
  prompt += `OUTPUT: ${renderStyle} photorealistic rendering, match Image 1 aspect ratio`;

  if (userPrompt?.trim()) {
    prompt += `\n\n${userPrompt.trim()}`;
  }

  return prompt;
}
