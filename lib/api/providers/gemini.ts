/**
 * Gemini provider utility with retry logic
 * Centralized configuration and helper functions for Google Gemini API
 */

import { GoogleGenerativeAI, type GenerativeModel, type Part } from "@google/generative-ai";
import { apiLogger } from "@/lib/logger";
import { retryWithBackoff, imageGenerationRetryConfig } from "@/utils/retryWithBackoff";

// Initialize Gemini client
export const geminiClient = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY || ""
);

// Gemini model configurations
export const GEMINI_MODELS = {
  imageGeneration: "gemini-2.5-flash-image-preview",
} as const;

// Image generation settings descriptions
export const IMAGE_STYLE_DESCRIPTIONS: Record<string, string> = {
  photorealistic: "photorealistic, highly detailed, professional photography",
  cinematic: "cinematic lighting and composition, movie-like, dramatic atmosphere",
  artistic: "artistic interpretation, painterly style, creative expression",
  anime: "anime style, japanese animation aesthetic",
  "3d_render": "3D rendered, CGI, high quality 3D graphics",
};

export const IMAGE_LIGHTING_DESCRIPTIONS: Record<string, string> = {
  natural: "natural lighting, soft daylight",
  studio: "professional studio lighting, controlled illumination",
  dramatic: "dramatic lighting with strong contrasts and shadows",
  golden_hour: "golden hour lighting, warm sunset glow",
  neon: "neon lighting, vibrant glowing colors",
  soft: "soft diffused lighting, gentle shadows",
};

export const IMAGE_QUALITY_DESCRIPTIONS: Record<string, string> = {
  ultra: "ultra high quality, 8K resolution, maximum detail",
  high: "high quality, 4K resolution, detailed",
  standard: "good quality",
};

export const IMAGE_ASPECT_RATIO_DESCRIPTIONS: Record<string, string> = {
  "1:1": "square format 1:1 aspect ratio",
  "16:9": "widescreen 16:9 landscape format",
  "9:16": "vertical 9:16 portrait format",
  "4:3": "classic 4:3 format",
  "3:2": "photo 3:2 format",
  "21:9": "ultra-wide cinematic 21:9 format",
};

// Build enhanced prompt with settings
export function buildEnhancedImagePrompt(
  prompt: string,
  settings: Record<string, unknown>
): string {
  let enhancedPrompt = prompt;

  if (!settings) return enhancedPrompt;

  const enhancements: string[] = [];

  // Add style description
  if (settings.style && typeof settings.style === 'string') {
    const styleDesc = IMAGE_STYLE_DESCRIPTIONS[settings.style];
    if (styleDesc) {
      enhancements.push(styleDesc);
    }
  }

  // Add lighting description
  if (settings.lighting && typeof settings.lighting === 'string') {
    const lightingDesc = IMAGE_LIGHTING_DESCRIPTIONS[settings.lighting];
    if (lightingDesc) {
      enhancements.push(lightingDesc);
    }
  }

  // Add quality description
  if (settings.quality && typeof settings.quality === 'string') {
    const qualityDesc = IMAGE_QUALITY_DESCRIPTIONS[settings.quality];
    if (qualityDesc) {
      enhancements.push(qualityDesc);
    }
  }

  // Add aspect ratio description with special handling for 21:9
  if (settings.aspectRatio && typeof settings.aspectRatio === 'string') {
    const aspectRatioDesc = IMAGE_ASPECT_RATIO_DESCRIPTIONS[settings.aspectRatio];
    if (aspectRatioDesc) {
      enhancements.push(aspectRatioDesc);

      // For 21:9, add explicit instructions to fill the entire frame
      if (settings.aspectRatio === "21:9") {
        enhancements.push(
          "IMPORTANT: Fill the entire ultra-wide frame completely from edge to edge"
        );
        enhancements.push(
          "the composition must extend to all edges with no black bars, letterboxing, or empty borders"
        );
        enhancements.push("compose the scene to naturally fit the 21:9 ultra-wide format");
      }
    }
  }

  // Combine prompt with enhancements
  if (enhancements.length > 0) {
    enhancedPrompt = `${prompt}, ${enhancements.join(", ")}`;
  }

  return enhancedPrompt;
}

// Gemini generation configuration interface
interface GeminiGenerationConfig {
  responseModalities: string[];
  imageConfig?: {
    aspectRatio: string;
  };
}

// Build generation configuration
export function buildGenerationConfig(settings: Record<string, unknown>): GeminiGenerationConfig {
  const generationConfig: GeminiGenerationConfig = {
    responseModalities: ["IMAGE"],
  };

  // Add imageConfig with aspect ratio if specified
  if (settings?.aspectRatio && typeof settings.aspectRatio === 'string') {
    generationConfig.imageConfig = {
      aspectRatio: settings.aspectRatio,
    };
  }

  return generationConfig;
}

// Build content parts for image generation
export function buildContentParts(
  enhancedPrompt: string,
  referenceImages?: Array<{ data: string; mimeType: string }>
): Part[] {
  const parts: Part[] = [{ text: enhancedPrompt }];

  // Add reference images if provided (for editing/character consistency)
  if (referenceImages && Array.isArray(referenceImages)) {
    for (const img of referenceImages) {
      if (img.data && img.mimeType) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
      }
    }
  }

  return parts;
}

// Gemini response interfaces
interface GeminiCandidate {
  content?: {
    parts?: Array<{ inlineData?: { data: string; mimeType: string } }>;
  };
  inlineData?: { data: string; mimeType: string };
  parts?: Array<{ inlineData?: { data: string; mimeType: string } }>;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

interface GeminiResult {
  response: GeminiResponse;
}

// Parse image from Gemini response
export function parseImageFromResponse(
  result: GeminiResult,
  index: number,
  numImages: number,
  clientId: string
): { mimeType: string; data: string } | null {
  const response = result.response;
  const candidates = response.candidates;

  if (!candidates || candidates.length === 0) {
    apiLogger.warn(`No image generated for image ${index + 1}/${numImages}`, { clientId });
    return null;
  }

  let imageData: string | undefined;
  let mimeType: string | undefined;

  const firstCandidate = candidates[0];
  if (!firstCandidate) {
    apiLogger.warn(`First candidate is undefined for image ${index + 1}/${numImages}`, { clientId });
    return null;
  }

  // Try different possible response structures
  // Option 1: Check if parts array exists in content
  if (firstCandidate.content?.parts && Array.isArray(firstCandidate.content.parts)) {
    const imagePart = firstCandidate.content.parts.find((part) => part.inlineData);
    if (imagePart?.inlineData) {
      imageData = imagePart.inlineData.data;
      mimeType = imagePart.inlineData.mimeType;
    }
  }

  // Option 2: Check if image data is directly in candidate
  if (!imageData && firstCandidate.inlineData) {
    imageData = firstCandidate.inlineData.data;
    mimeType = firstCandidate.inlineData.mimeType;
  }

  // Option 3: Check if parts is directly on candidate
  if (!imageData && firstCandidate.parts && Array.isArray(firstCandidate.parts)) {
    const imagePart = firstCandidate.parts.find((part) => part.inlineData);
    if (imagePart?.inlineData) {
      imageData = imagePart.inlineData.data;
      mimeType = imagePart.inlineData.mimeType;
    }
  }

  if (!imageData) {
    apiLogger.error(
      `Failed to find image ${index + 1}/${numImages} in Gemini response`,
      undefined,
      {
        candidateStructure: JSON.stringify(firstCandidate).substring(0, 500),
        clientId,
      }
    );
    return null;
  }

  return {
    mimeType: mimeType || "image/png",
    data: imageData,
  };
}

// Gemini model interface (compatible with Google Generative AI SDK GenerativeModel)
export type GeminiModel = GenerativeModel;

// Generate a single image with retry logic
export async function generateSingleImage(
  model: GeminiModel,
  parts: Part[],
  generationConfig: GeminiGenerationConfig,
  index: number,
  numImages: number,
  clientId: string
): Promise<GeminiResult> {
  return await retryWithBackoff(
    async () => {
      apiLogger.debug(`Calling Gemini API for image generation ${index + 1}/${numImages}`, {
        clientId,
      });

      return await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: generationConfig as any,
      }) as GeminiResult;
    },
    {
      ...imageGenerationRetryConfig,
      onRetry: (error: Error, attempt: number, delay: number) => {
        apiLogger.warn(
          `Retrying image generation ${index + 1}/${numImages} (attempt ${attempt}/4)`,
          {
            error: error.message,
            delay,
            clientId,
          }
        );
      },
    }
  );
}
