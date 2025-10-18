// lib/api/workflows/furnishEmpty/promptGenerator.ts
import { FurnishEmptySettingsType } from '@/types/workflows/furnishEmptySettings';

export function generateFurnishEmptyPrompt(
  settings: FurnishEmptySettingsType,
  userPrompt?: string
): string {
  const spaceTypeLabels: Record<string, string> = {
    living_room: "living room",
    bedroom: "bedroom",
    kitchen: "kitchen",
    dining_room: "dining room",
    office: "home office",
    bathroom: "bathroom",
    kids_room: "kids room",
    guest_room: "guest room",
    hallway: "hallway",
    balcony: "balcony",
    terrace: "terrace",
  };

  const styleLabels: Record<string, string> = {
    modern: "modern",
    scandinavian: "Scandinavian",
    minimalist: "minimalist",
    industrial: "industrial",
    boho: "bohemian",
    farmhouse: "farmhouse",
    mid_century: "mid-century modern",
    classic: "classic",
    luxury: "luxury",
    japandi: "Japandi",
    coastal: "coastal",
    rustic: "rustic",
  };

  const colorLabels: Record<string, string> = {
    neutral: "neutral (white, beige, gray)",
    warm: "warm (brown, beige, terracotta)",
    cool: "cool (blue, gray, white)",
    monochrome: "monochrome (black and white)",
    natural: "natural (wood, green, beige)",
    colorful: "colorful (multi-color)",
    dark: "dark (black, dark gray)",
    light: "light (white, cream, pastel)",
  };

  const densityLabels: Record<string, string> = {
    minimal: "minimal",
    normal: "moderate",
    full: "fully furnished",
    luxury: "luxuriously furnished",
  };

  const lightingLabels: Record<string, string> = {
    natural_daylight: "natural daylight",
    warm_evening: "warm evening light",
    bright_artificial: "bright artificial light",
    cozy: "cozy ambient light",
    dramatic: "dramatic lighting",
  };

  const audienceLabels: Record<string, string> = {
    family: "families",
    single: "singles",
    couple: "couples",
    seniors: "seniors",
    students: "students",
    luxury_buyers: "luxury buyers",
    first_time_renters: "first-time renters",
  };

  // Get labels with fallbacks for undefined values
  const spaceType = spaceTypeLabels[settings.spaceType] || "room";
  const style = styleLabels[settings.furnishingStyle] || "modern";
  const colorScheme = colorLabels[settings.colorScheme] || "neutral tones";
  const density = densityLabels[settings.furnitureDensity] || "moderately furnished";
  const lighting = lightingLabels[settings.lighting] || "natural light";
  const audience = audienceLabels[settings.targetAudience] || "general buyers";

  // Generate flowing text prompt (no bullet points or lists)
  let prompt = `Transform this empty ${spaceType} into a beautifully furnished space that showcases ${style} design principles. `;

  prompt += `The space should feature a ${colorScheme} color palette with ${density} furniture arrangement, creating an inviting ${lighting} atmosphere. `;

  prompt += `This design is specifically tailored for ${audience}, ensuring the space appeals to their lifestyle and preferences. `;

  prompt += `Maintain the original room architecture including all walls, windows, and doors exactly as they are in the source image. `;

  prompt += `Add appropriate furniture and decor that fits a ${spaceType}, following ${style} aesthetic with attention to realistic proportions and perspective. `;

  prompt += `Ensure realistic shadows and lighting that naturally match the room's existing light sources. `;

  prompt += `The final result should look like a professionally staged interior design photograph, ready for a premium real estate listing, without changing the fundamental room structure.`;

  if (userPrompt && userPrompt.trim()) {
    prompt += ` ${userPrompt.trim()}`;
  }

  return prompt;
}
