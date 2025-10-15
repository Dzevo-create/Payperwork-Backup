/**
 * System prompts for different enhancement contexts
 * Refactored with modular template system
 */

import { BASE_FRAGMENTS } from './fragments';
import {
  buildImageSettingsContext,
  buildVideoSettingsContext,
  type ImageSettings,
} from './builder';

// Re-export guides for backward compatibility
export {
  STYLE_GUIDES,
  LIGHTING_GUIDES,
  QUALITY_GUIDES,
  ASPECT_RATIO_GUIDES,
  PRESET_GUIDES,
} from './fragments';

// Re-export builder function
export { buildImageSettingsContext } from './builder';

// Nano Banana (image editing) prompt
export function buildNanoBananaPrompt(
  imageContext: string,
  imageSettings: ImageSettings,
  replyContext?: string,
  pdfContext?: string
): string {
  const fragments: string[] = [];

  // Expert role
  fragments.push(BASE_FRAGMENTS.expertRole('Bildbearbeitung'));

  // Task description
  fragments.push(`
# DEINE AUFGABE
Der User hat ein Bild hochgeladen (beschrieben als: "${imageContext}") und möchte es verändern.
Du erstellst einen optimierten Prompt für Nano Banana, der:
1. Das Hauptobjekt/die Hauptszene aus dem Original-Bild BEIBEHÄLT
2. Die gewünschte Änderung präzise umsetzt
3. Nano Bananas Stärken nutzt: Objektkonsistenz, Stilübertragung, natürliche Übergänge

# NANO BANANA EXPERT TECHNIKEN
- Verwende klare Objektbeschreibungen: "Das [Objekt] soll..."
- Nutze räumliche Begriffe: "im Vordergrund", "im Hintergrund", "links/rechts"
- Beschreibe Beleuchtungsveränderungen präzise: "warmes goldenes Licht von rechts"
- Bei Stiländerungen: Nenne spezifische künstlerische Referenzen
- Verwende Komposition-Begriffe: "Fokus auf...", "Schärfentiefe"
- Betone Kontinuität: "Behalte die Struktur des Originals bei"`);

  // Image settings
  fragments.push(buildImageSettingsContext(imageSettings));

  // Reply context
  if (replyContext) {
    fragments.push(BASE_FRAGMENTS.replyContext(replyContext));
  }

  // PDF context
  if (pdfContext) {
    fragments.push(BASE_FRAGMENTS.pdfContext(pdfContext));
  }

  // Output format
  fragments.push(BASE_FRAGMENTS.outputFormat());

  return fragments.join('\n\n');
}

// Image generation prompt
export function buildImageGenerationPrompt(
  imageSettings: ImageSettings,
  replyContext?: string,
  pdfContext?: string
): string {
  const fragments: string[] = [];

  // Expert role
  fragments.push(BASE_FRAGMENTS.expertRole('Bild'));

  // Task description
  fragments.push(`
# DEINE AUFGABE
Der User möchte ein NEUES Bild erstellen (kein bestehendes Bild bearbeiten).
Erstelle einen detaillierten, präzisen Prompt der alle wichtigen visuellen Aspekte beschreibt:
- Hauptmotiv und Objekte
- Komposition und Perspektive
- Beleuchtung und Atmosphäre
- Farben und Stimmung
- Stil und künstlerische Richtung
- Details und Texturen`);

  // Image settings
  fragments.push(buildImageSettingsContext(imageSettings));

  // Reply context
  if (replyContext) {
    fragments.push(BASE_FRAGMENTS.replyContext(replyContext));
  }

  // Best practices
  fragments.push(BASE_FRAGMENTS.bestPractices([
    'Beschreibe die Szene visuell und detailliert',
    'Nutze präzise, beschreibende Adjektive',
    'Erwähne Komposition und Perspektive',
    'Definiere Atmosphäre und Mood',
    'Sei spezifisch bei Farben und Materialien',
  ]));

  // PDF context
  if (pdfContext) {
    fragments.push(BASE_FRAGMENTS.pdfContext(pdfContext));
  }

  // Output format
  fragments.push(BASE_FRAGMENTS.outputFormat());

  return fragments.join('\n\n');
}

// Video generation prompt
export function buildVideoGenerationPrompt(
  videoContext: string,
  replyContext?: string,
  pdfContext?: string
): string {
  const fragments: string[] = [];

  // Expert role
  fragments.push(BASE_FRAGMENTS.expertRole('Video'));

  // Task description
  fragments.push(`
# DEINE AUFGABE
Der User möchte ein Video mit Veo 2 erstellen.
Erstelle einen optimierten Video-Prompt der folgende Aspekte beschreibt:
- Die Hauptszene und Aktion
- Bewegung und Dynamik
- Kamerabewegung (falls vorhanden)
- Visuelle Atmosphäre
- Beleuchtung und Stimmung
- Zeitlicher Ablauf (Anfang → Ende)`);

  // Video settings
  if (videoContext) {
    fragments.push(buildVideoSettingsContext(videoContext));
  }

  // Reply context
  if (replyContext) {
    fragments.push(BASE_FRAGMENTS.replyContext(replyContext));
  }

  // Best practices
  fragments.push(BASE_FRAGMENTS.bestPractices([
    'Beschreibe die Aktion klar und dynamisch',
    'Nutze temporale Begriffe: "beginnt mit...", "während...", "endet mit..."',
    'Integriere Kamerabewegung natürlich in die Szene',
    'Beschreibe visuelle Details: Beleuchtung, Farben, Atmosphäre',
    'Halte die Beschreibung kohärent und fokussiert',
  ]));

  // PDF context
  if (pdfContext) {
    fragments.push(BASE_FRAGMENTS.pdfContext(pdfContext));
  }

  // Output format
  fragments.push(BASE_FRAGMENTS.outputFormat());

  return fragments.join('\n\n');
}

// Chat prompt enhancement
export function buildChatPrompt(replyContext?: string, pdfContext?: string): string {
  const fragments: string[] = [];

  // Expert role
  fragments.push(BASE_FRAGMENTS.expertRole('Chat'));

  // Task description
  fragments.push(`
# DEINE AUFGABE
Der User möchte mit einem Chat-Modell kommunizieren.
Verbessere den Prompt, um ihn:
- Klarer und präziser zu machen
- Mit relevantem Kontext anzureichern
- Strukturierter zu formulieren
- Effektiver für die gewünschte Antwort`);

  // Reply context
  if (replyContext) {
    fragments.push(BASE_FRAGMENTS.replyContext(replyContext));
  }

  // PDF context
  if (pdfContext) {
    fragments.push(BASE_FRAGMENTS.pdfContext(pdfContext));
  }

  // Best practices
  fragments.push(BASE_FRAGMENTS.bestPractices([
    'Formuliere die Frage/Aufgabe klar und direkt',
    'Füge wichtige Details hinzu, die fehlen könnten',
    'Strukturiere komplexe Anfragen',
    'Behalte die ursprüngliche Intention bei',
  ]));

  // Output format
  fragments.push(BASE_FRAGMENTS.outputFormat());

  return fragments.join('\n\n');
}

// Image analysis prompt
export function buildAnalysisPrompt(
  imageContext: string,
  replyContext?: string,
  pdfContext?: string
): string {
  const fragments: string[] = [];

  // Expert role
  fragments.push(BASE_FRAGMENTS.expertRole('Analyse'));

  // Task description
  fragments.push(`
# DEINE AUFGABE
Der User hat ein Bild hochgeladen (beschrieben als: "${imageContext}") und möchte etwas darüber erfahren.
Erstelle einen klaren Analyse-Prompt, der:
- Die gewünschte Information spezifiziert
- Den Kontext des Bildes berücksichtigt
- Präzise Fragen stellt`);

  // Reply context
  if (replyContext) {
    fragments.push(BASE_FRAGMENTS.replyContext(replyContext));
  }

  // PDF context
  if (pdfContext) {
    fragments.push(BASE_FRAGMENTS.pdfContext(pdfContext));
  }

  // Output format
  fragments.push(BASE_FRAGMENTS.outputFormat());

  return fragments.join('\n\n');
}
