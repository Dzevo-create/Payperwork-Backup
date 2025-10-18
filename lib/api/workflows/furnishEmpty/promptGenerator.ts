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

  let prompt = `Transform this empty ${spaceTypeLabels[settings.spaceType]} into a beautifully furnished space with the following specifications:\n\n`;

  prompt += `Style: ${styleLabels[settings.furnishingStyle]}\n`;
  prompt += `Color Scheme: ${colorLabels[settings.colorScheme]}\n`;
  prompt += `Furniture Density: ${densityLabels[settings.furnitureDensity]}\n`;
  prompt += `Lighting: ${lightingLabels[settings.lighting]}\n`;
  prompt += `Target Audience: ${audienceLabels[settings.targetAudience]}\n`;

  prompt += `\nRequirements:\n`;
  prompt += `- Maintain the original room architecture, walls, windows, and doors exactly as they are\n`;
  prompt += `- Add appropriate furniture for a ${spaceTypeLabels[settings.spaceType]}\n`;
  prompt += `- Follow ${styleLabels[settings.furnishingStyle]} design principles\n`;
  prompt += `- Use ${colorLabels[settings.colorScheme]} color palette\n`;
  prompt += `- Include ${densityLabels[settings.furnitureDensity]} amount of furniture\n`;
  prompt += `- Create ${lightingLabels[settings.lighting]} atmosphere\n`;
  prompt += `- Design for ${audienceLabels[settings.targetAudience]}\n`;
  prompt += `- Ensure realistic shadows and lighting that match the room\n`;
  prompt += `- Keep perspective and proportions accurate\n`;
  prompt += `- Make it look professionally staged for real estate photography\n`;
  prompt += `- Do not change the room structure, only add furniture and decor\n`;

  if (userPrompt && userPrompt.trim()) {
    prompt += `\nAdditional Requirements: ${userPrompt.trim()}\n`;
  }

  prompt += `\nThe result should look like a professional interior design photograph, ready for a real estate listing.`;

  return prompt;
}
