/**
 * Lightbox Helper Functions
 *
 * Utility functions for formatting and labeling in workflow lightboxes.
 */

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getModelName = (type?: "image" | "video" | "render" | "upscale") => {
  switch (type) {
    case "video":
      return "Payperwork v.Turbo";
    case "upscale":
      return "Payperwork Upscaler";
    default:
      return "Payperwork Flash v.1";
  }
};

export const getSettingLabel = (key: string, value: string | null) => {
  if (!value) return null;

  const labels: { [key: string]: { [value: string]: string } } = {
    spaceType: {
      interior: "Innenraum",
      exterior: "Außenbereich",
    },
    designStyle: {
      modern: "Modern",
      minimalist: "Minimalistisch",
      mediterranean: "Mediterran",
      scandinavian: "Skandinavisch",
      industrial: "Industrial",
      classical: "Klassisch",
      contemporary: "Zeitgenössisch",
      rustic: "Rustikal",
      bauhaus: "Bauhaus",
      "art-deco": "Art Deco",
      japanese: "Japanisch",
      tropical: "Tropisch",
      brutalist: "Brutalistisch",
    },
    renderStyle: {
      hyperrealistic: "Hyperrealistisch",
      photorealistic: "Fotorealistisch",
      "3d-render": "3D Render",
      "architectural-visualization": "Architekturvisualisierung",
      "concept-art": "Concept Art",
    },
    timeOfDay: {
      morning: "Morgen",
      midday: "Mittag",
      afternoon: "Nachmittag",
      evening: "Abend",
      night: "Nacht",
    },
    season: {
      spring: "Frühling",
      summer: "Sommer",
      autumn: "Herbst",
      winter: "Winter",
    },
    weather: {
      sunny: "Sonnig",
      cloudy: "Bewölkt",
      rainy: "Regnerisch",
      foggy: "Neblig",
    },
    quality: {
      ultra: "Ultra",
      high: "Hoch",
      standard: "Standard",
    },
  };

  return labels[key]?.[value] || value;
};
