/**
 * GPT-4o Vision Prompt Enhancer for Furnish-Empty Workflow
 *
 * Analyzes empty room images and generates intelligent furnishing prompts
 */

import OpenAI from "openai";
import { apiLogger } from "@/lib/logger";
import { FurnishEmptySettingsType } from "@/types/workflows/furnishEmptySettings";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EnhancePromptParams {
  userPrompt: string;
  sourceImage: { data: string; mimeType: string };
  settings: FurnishEmptySettingsType;
  referenceImages?: Array<{ data: string; mimeType: string }>;
}

/**
 * Enhances a furnish-empty prompt using GPT-4o Vision
 *
 * Analyzes the empty room image and generates a detailed, contextual prompt
 * based on room characteristics, user settings, and optional reference images
 */
export async function enhanceFurnishEmptyPromptWithGPT(
  params: EnhancePromptParams
): Promise<string> {
  const { userPrompt, sourceImage, settings, referenceImages } = params;

  // Build settings context
  const settingsContext = buildSettingsContext(settings);

  // Build system message with furnishing expertise
  const systemMessage = `You are an expert interior designer and real estate staging consultant specializing in virtual furniture placement for empty rooms. Your task is to analyze an empty room image and create a detailed, flowing text prompt for an AI image generator that will furnish the space.

CRITICAL REQUIREMENTS:
- The room architecture (walls, windows, doors, flooring) MUST remain EXACTLY as shown
- Only add furniture, decor, and styling - never modify the room structure
- Ensure furniture placement is realistic and proportional to the room size
- Match lighting and shadows to the existing room conditions
- Create a professional, real estate listing-quality result

Your prompt should be written as natural flowing text (not bullet points or lists), describing how to transform the empty space into a beautifully furnished room that appeals to potential buyers or renters.`;

  // Build user message with image analysis request
  const userMessage = `Please analyze this empty room image and create a detailed furnishing prompt based on the following:

ROOM SETTINGS:
${settingsContext}

${userPrompt ? `USER REQUEST: ${userPrompt}\n\n` : ''}

Generate a flowing text prompt (no lists or bullet points) that:
1. Describes what furniture and decor to add to this specific room
2. Incorporates the style, color scheme, and density preferences
3. Maintains the exact room architecture visible in the image
4. Creates appropriate lighting atmosphere
5. Appeals to the target audience
6. Ensures realistic proportions and professional staging quality

The prompt should be detailed but concise (200-400 words), written as continuous flowing text that an AI image generator can use to furnish this empty room while preserving its original structure.`;

  // Prepare messages for GPT-4o Vision
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: systemMessage,
    },
    {
      role: "user",
      content: [
        { type: "text", text: userMessage },
        {
          type: "image_url",
          image_url: {
            url: `data:${sourceImage.mimeType};base64,${sourceImage.data}`,
            detail: "high",
          },
        },
      ],
    },
  ];

  // Add reference images if provided
  if (referenceImages && referenceImages.length > 0) {
    referenceImages.forEach((refImg, index) => {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Reference image ${index + 1} for style inspiration:`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${refImg.mimeType};base64,${refImg.data}`,
              detail: "low",
            },
          },
        ],
      });
    });
  }

  try {
    apiLogger.info("Enhancing furnish-empty prompt with GPT-4o Vision");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const enhancedPrompt = response.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      throw new Error("GPT-4o returned empty response");
    }

    apiLogger.info("Successfully enhanced furnish-empty prompt with GPT-4o", {
      originalLength: userPrompt?.length || 0,
      enhancedLength: enhancedPrompt.length,
    });

    return enhancedPrompt;
  } catch (error) {
    apiLogger.error("Failed to enhance prompt with GPT-4o", error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Builds a human-readable settings context for GPT-4o
 */
function buildSettingsContext(settings: FurnishEmptySettingsType): string {
  const settingsMap = {
    spaceType: {
      living_room: "Living Room",
      bedroom: "Bedroom",
      kitchen: "Kitchen",
      dining_room: "Dining Room",
      office: "Home Office",
      bathroom: "Bathroom",
      kids_room: "Kids Room",
      guest_room: "Guest Room",
      hallway: "Hallway",
      balcony: "Balcony",
      terrace: "Terrace",
    },
    furnishingStyle: {
      modern: "Modern",
      scandinavian: "Scandinavian",
      minimalist: "Minimalist",
      industrial: "Industrial",
      boho: "Bohemian",
      farmhouse: "Farmhouse",
      mid_century: "Mid-Century Modern",
      classic: "Classic",
      luxury: "Luxury",
      japandi: "Japandi",
      coastal: "Coastal",
      rustic: "Rustic",
    },
    colorScheme: {
      neutral: "Neutral tones (white, beige, gray)",
      warm: "Warm colors (brown, beige, terracotta)",
      cool: "Cool colors (blue, gray, white)",
      monochrome: "Monochrome (black and white)",
      natural: "Natural colors (wood, green, beige)",
      colorful: "Colorful palette",
      dark: "Dark tones (black, dark gray)",
      light: "Light tones (white, cream, pastel)",
    },
    furnitureDensity: {
      minimal: "Minimal furniture (key pieces only)",
      normal: "Normal furniture density",
      full: "Fully furnished",
      luxury: "Luxury furnished (premium pieces)",
    },
    lighting: {
      natural_daylight: "Natural daylight",
      warm_evening: "Warm evening light",
      bright_artificial: "Bright artificial light",
      cozy: "Cozy ambient lighting",
      dramatic: "Dramatic lighting",
    },
    targetAudience: {
      family: "Families with children",
      single: "Single professionals",
      couple: "Couples",
      seniors: "Senior citizens",
      students: "Students",
      luxury_buyers: "Luxury buyers",
      first_time_renters: "First-time renters",
    },
  };

  const parts: string[] = [];

  parts.push(`- Space Type: ${settingsMap.spaceType[settings.spaceType] || settings.spaceType}`);
  parts.push(`- Style: ${settingsMap.furnishingStyle[settings.furnishingStyle] || settings.furnishingStyle}`);
  parts.push(`- Color Scheme: ${settingsMap.colorScheme[settings.colorScheme] || settings.colorScheme}`);
  parts.push(`- Furniture Density: ${settingsMap.furnitureDensity[settings.furnitureDensity] || settings.furnitureDensity}`);
  parts.push(`- Lighting: ${settingsMap.lighting[settings.lighting] || settings.lighting}`);
  parts.push(`- Target Audience: ${settingsMap.targetAudience[settings.targetAudience] || settings.targetAudience}`);

  return parts.join("\n");
}
