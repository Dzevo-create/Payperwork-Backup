/**
 * Style-Transfer Workflow Settings Types (NEU - Preset-System)
 *
 * Umfassendes Preset-System für Material- und Stil-Transfer mit:
 * - Mode (Preset / Referenzbild)
 * - Bereich (Interieur / Exterieur)
 * - Architektonische Stile (6 Hauptstile)
 * - Tageszeit (6 Optionen)
 * - Wetter (6 Optionen)
 * - Render-Art (5 Optionen)
 * - Structure Preservation (0-100%)
 */

// ============================================================================
// MODE - Preset oder Referenzbild
// ============================================================================
export type StyleTransferMode = "preset" | "reference";

// ============================================================================
// BEREICH - Interieur oder Exterieur
// ============================================================================
export type SpaceType = "interieur" | "exterieur";

// ============================================================================
// ARCHITEKTONISCHE STILE
// ============================================================================
export type ArchitecturalStyle =
  | "mediterran"
  | "ikea"
  | "minimalistisch"
  | "modern"
  | "mittelalterlich"
  | "industrial";

// Stil-Details für Prompt-Generierung
export interface StyleDetails {
  name: string;
  charakteristik: string;
  materialien: string[];
  farben: string[];
  beschreibung: string;
}

export const STYLE_DETAILS: Record<ArchitecturalStyle, StyleDetails> = {
  mediterran: {
    name: "Mediterran",
    charakteristik: "Warme Farben, Bögen, Terrakotta",
    materialien: ["Stein", "Ziegel", "Holz", "Terrakotta"],
    farben: ["Ocker", "Terrakotta", "Weiß", "Blau"],
    beschreibung:
      "Mediterranean style with warm earth tones, arched openings, terracotta tiles, stucco walls, and natural stone. Emphasize rustic charm with textured surfaces and traditional craftsmanship.",
  },
  ikea: {
    name: "IKEA/Skandinavisch",
    charakteristik: "Funktional, hell, gemütlich",
    materialien: ["Helles Holz", "Textilien", "Glas"],
    farben: ["Weiß", "Beige", "Hellgrau", "Pastellblau"],
    beschreibung:
      "Scandinavian/IKEA style with light wood tones, functional minimalism, cozy textiles, and bright open spaces. Focus on simplicity, natural light, and hygge atmosphere.",
  },
  minimalistisch: {
    name: "Minimalistisch",
    charakteristik: "Reduziert, clean, geometrisch",
    materialien: ["Beton", "Glas", "Stahl"],
    farben: ["Weiß", "Grau", "Schwarz"],
    beschreibung:
      "Minimalist style with clean lines, geometric forms, monochromatic palette, and 'less is more' philosophy. Emphasize simplicity, negative space, and functional elegance.",
  },
  modern: {
    name: "Modern",
    charakteristik: "Klare Linien, große Fenster",
    materialien: ["Glas", "Stahl", "Beton"],
    farben: ["Neutral", "Akzentfarben"],
    beschreibung:
      "Modern style with clean lines, large windows, open floor plans, and contemporary materials. Focus on functionality, innovation, and sleek aesthetics.",
  },
  mittelalterlich: {
    name: "Mittelalterlich",
    charakteristik: "Massiv, rustikale Elemente",
    materialien: ["Naturstein", "Dunkles Holz", "Schmiedeeisen"],
    farben: ["Braun", "Grau", "Dunkelrot"],
    beschreibung:
      "Medieval style with massive stone walls, dark wood beams, arched doorways, and rustic craftsmanship. Emphasize historical authenticity and fortress-like solidity.",
  },
  industrial: {
    name: "Industrial",
    charakteristik: "Roh, exposed Elements",
    materialien: ["Metall", "Beton", "Ziegel", "Rohre"],
    farben: ["Grau", "Schwarz", "Rost", "Dunkelbraun"],
    beschreibung:
      "Industrial style with exposed brick, metal beams, concrete surfaces, and utilitarian design. Focus on raw materials, honest construction, and warehouse aesthetics.",
  },
};

// ============================================================================
// TAGESZEIT
// ============================================================================
export type TimeOfDay = "morgen" | "mittag" | "abend" | "nacht" | "daemmerung" | "golden_hour";

export const TIME_OF_DAY_DESCRIPTIONS: Record<TimeOfDay, string> = {
  morgen:
    "Early morning light with soft golden rays, long shadows, and fresh atmosphere. Sunrise glow with cool to warm transition.",
  mittag:
    "Midday lighting with bright overhead sun, short shadows, and high contrast. Clear visibility with strong illumination.",
  abend:
    "Evening light with warm amber tones, lengthening shadows, and golden hour glow. Sunset atmosphere with rich colors.",
  nacht:
    "Night scene with artificial lighting, deep shadows, and dramatic contrasts. Moonlight or street lamps creating atmospheric mood.",
  daemmerung:
    "Twilight/dusk with blue hour atmosphere, soft diffused light, and magical transition between day and night.",
  golden_hour:
    "Golden hour with warm, soft, directional light. Long shadows, rich colors, and photographer's favorite lighting.",
};

// ============================================================================
// WETTER
// ============================================================================
export type Weather = "sonnig" | "bewoelkt" | "regen" | "schnee" | "nebel" | "sturm";

export const WEATHER_DESCRIPTIONS: Record<Weather, string> = {
  sonnig:
    "Sunny weather with clear blue sky, bright sunlight, and crisp shadows. Vibrant colors and high visibility.",
  bewoelkt:
    "Overcast with soft diffused lighting, no harsh shadows, and muted colors. Cloudy sky with even illumination.",
  regen:
    "Rainy atmosphere with wet surfaces, reflections, and dramatic sky. Water droplets, puddles, and moody ambiance.",
  schnee:
    "Snowy scene with white coverage, soft lighting, and winter atmosphere. Snow on surfaces, cold color palette.",
  nebel:
    "Foggy conditions with reduced visibility, soft atmospheric perspective, and mysterious mood. Diffused light through mist.",
  sturm:
    "Stormy weather with dramatic dark clouds, wind effects, and intense atmosphere. Dynamic sky and turbulent conditions.",
};

// ============================================================================
// RENDER-ART
// ============================================================================
export type RenderStyle =
  | "fotorealistisch"
  | "skizze"
  | "wasserfarben"
  | "blaupause"
  | "kuenstlerisch";

export const RENDER_STYLE_DESCRIPTIONS: Record<RenderStyle, string> = {
  fotorealistisch:
    "Fully photorealistic rendering with realistic materials, lighting, and textures. High detail, accurate physics, and lifelike appearance.",
  skizze:
    "Architectural sketch style with hand-drawn lines, hatching, and artistic interpretation. Pencil or pen drawing aesthetic.",
  wasserfarben:
    "Watercolor painting style with soft edges, color bleeding, and artistic fluidity. Painterly interpretation with transparent washes.",
  blaupause:
    "Blueprint/technical drawing style with white lines on blue background, precise measurements, and architectural notation.",
  kuenstlerisch:
    "Artistic interpretation with creative freedom, expressive style, and unique visual language. Painterly or illustrative approach.",
};

// ============================================================================
// COMPLETE SETTINGS INTERFACE
// ============================================================================
export interface StyleTransferSettingsType extends Record<string, unknown> {
  // Mode
  mode: StyleTransferMode;

  // Bereich
  spaceType: SpaceType;

  // Stil
  architecturalStyle: ArchitecturalStyle;

  // Tageszeit
  timeOfDay: TimeOfDay;

  // Wetter
  weather: Weather;

  // Render-Art
  renderStyle: RenderStyle;

  // Structure Preservation (0-100%)
  // Wie stark soll die FORM/STRUKTUR vom Ausgangsbild beibehalten werden?
  // 100% = Exakte Geometrie beibehalten
  // 0% = Nur als grobe Inspiration nutzen
  structurePreservation: number;

  // Style Intensity (0-100%) - NEU!
  // Wie stark soll der STIL vom Referenzbild übernommen werden?
  // 100% = Komplette Style-Übernahme (Materialien, Farben, Fenster-Design, Fassaden-Details)
  // 0% = Nur minimale Style-Elemente übernehmen
  styleIntensity: number;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================
export const DEFAULT_STYLE_TRANSFER_SETTINGS: StyleTransferSettingsType = {
  mode: "preset",
  spaceType: "exterieur",
  architecturalStyle: "modern",
  timeOfDay: "mittag",
  weather: "sonnig",
  renderStyle: "fotorealistisch",
  structurePreservation: 80, // Geometrie vom Ausgangsbild beibehalten
  styleIntensity: 70, // Mittlere Style-Intensität vom Referenzbild
};
