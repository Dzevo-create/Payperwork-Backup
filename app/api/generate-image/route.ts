import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { imageGenerationRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { textValidation, fileValidation, ValidationError } from "@/lib/validation";
import { retryWithBackoff, imageGenerationRetryConfig } from "@/utils/retryWithBackoff";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { cropBlackBorders } from "@/lib/utils/imageCrop";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation
    const keyValidation = validateApiKeys(['openai']);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new Error('Content-Type must be application/json'),
        'generate-image-api'
      );
    }

    // Rate limiting
    const rateLimitResult = imageGenerationRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const { prompt, referenceImages, settings } = await req.json();

    // Validate prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid prompt provided" },
        { status: 400 }
      );
    }

    try {
      textValidation.validatePrompt(prompt);
    } catch (error) {
      if (error instanceof ValidationError) {
        apiLogger.warn('Invalid image prompt', { error: error.message, clientId });
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }

    // Validate reference images if provided
    if (referenceImages && Array.isArray(referenceImages)) {
      for (const img of referenceImages) {
        if (img.data) {
          try {
            const base64Data = `data:${img.mimeType || 'image/png'};base64,${img.data}`;
            fileValidation.validateBase64Image(base64Data);
          } catch (error) {
            if (error instanceof ValidationError) {
              apiLogger.warn('Invalid reference image', { error: error.message, clientId });
              return NextResponse.json(
                { error: error.message },
                { status: 400 }
              );
            }
            throw error;
          }
        }
      }
    }

    // Initialize Nano Banana model (Gemini 2.5 Flash Image)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image-preview"
    });

    // Build enhanced prompt with settings
    let enhancedPrompt = prompt;

    // Add style, lighting, and quality to prompt in natural language
    if (settings) {
      const styleDescriptions: { [key: string]: string } = {
        'photorealistic': 'photorealistic, highly detailed, professional photography',
        'cinematic': 'cinematic lighting and composition, movie-like, dramatic atmosphere',
        'artistic': 'artistic interpretation, painterly style, creative expression',
        'anime': 'anime style, japanese animation aesthetic',
        '3d_render': '3D rendered, CGI, high quality 3D graphics'
      };

      const lightingDescriptions: { [key: string]: string } = {
        'natural': 'natural lighting, soft daylight',
        'studio': 'professional studio lighting, controlled illumination',
        'dramatic': 'dramatic lighting with strong contrasts and shadows',
        'golden_hour': 'golden hour lighting, warm sunset glow',
        'neon': 'neon lighting, vibrant glowing colors',
        'soft': 'soft diffused lighting, gentle shadows'
      };

      const qualityDescriptions: { [key: string]: string } = {
        'ultra': 'ultra high quality, 8K resolution, maximum detail',
        'high': 'high quality, 4K resolution, detailed',
        'standard': 'good quality'
      };

      const aspectRatioDescriptions: { [key: string]: string } = {
        '1:1': 'square format 1:1 aspect ratio',
        '16:9': 'widescreen 16:9 landscape format',
        '9:16': 'vertical 9:16 portrait format',
        '4:3': 'classic 4:3 format',
        '3:2': 'photo 3:2 format',
        '21:9': 'ultra-wide cinematic 21:9 format'
      };

      let enhancements: string[] = [];

      // Add style description
      if (settings.style && styleDescriptions[settings.style]) {
        enhancements.push(styleDescriptions[settings.style]);
      }

      // Add lighting description
      if (settings.lighting && lightingDescriptions[settings.lighting]) {
        enhancements.push(lightingDescriptions[settings.lighting]);
      }

      // Add quality description
      if (settings.quality && qualityDescriptions[settings.quality]) {
        enhancements.push(qualityDescriptions[settings.quality]);
      }

      // Add aspect ratio description with special handling for 21:9
      if (settings.aspectRatio && aspectRatioDescriptions[settings.aspectRatio]) {
        enhancements.push(aspectRatioDescriptions[settings.aspectRatio]);

        // For 21:9, add explicit instructions to fill the entire frame
        if (settings.aspectRatio === '21:9') {
          enhancements.push('IMPORTANT: Fill the entire ultra-wide frame completely from edge to edge');
          enhancements.push('the composition must extend to all edges with no black bars, letterboxing, or empty borders');
          enhancements.push('compose the scene to naturally fit the 21:9 ultra-wide format');
        }
      }

      // Combine prompt with enhancements
      if (enhancements.length > 0) {
        enhancedPrompt = `${prompt}, ${enhancements.join(', ')}`;
      }

      apiLogger.debug("Enhanced prompt with settings", {
        originalPrompt: prompt,
        enhancedPrompt,
        settings,
        clientId
      });
    }

    // Build content parts
    const parts: any[] = [{ text: enhancedPrompt }];

    // Add reference images if provided (for editing/character consistency)
    if (referenceImages && Array.isArray(referenceImages)) {
      for (const img of referenceImages) {
        if (img.data && img.mimeType) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.data, // Base64 data
            },
          });
        }
      }
    }

    // Determine number of images to generate (default: 1)
    const numImages = settings?.numImages || 1;

    apiLogger.debug("Generating images", {
      numImages,
      clientId
    });

    // Helper function to generate a single image
    const generateSingleImage = async (index: number) => {
      return await retryWithBackoff(
        async () => {
          apiLogger.debug(`Calling Gemini API for image generation ${index + 1}/${numImages}`, { clientId });

          // Build generation config with image settings
          const generationConfig: any = {
            responseModalities: ["IMAGE"],
          };

          // Add imageConfig with aspect ratio if specified
          if (settings?.aspectRatio) {
            generationConfig.imageConfig = {
              aspectRatio: settings.aspectRatio
            };
          }

          return await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
          });
        },
        {
          ...imageGenerationRetryConfig,
          onRetry: (error: any, attempt: number, delay: number) => {
            apiLogger.warn(`Retrying image generation ${index + 1}/${numImages} (attempt ${attempt}/4)`, {
              error: error.message,
              delay,
              clientId,
            });
          },
        }
      );
    };

    // Helper function to parse image from Gemini response
    const parseImageFromResponse = (result: any, index: number): { mimeType: string; data: string } | null => {
      const response = result.response;
      const candidates = response.candidates;

      if (!candidates || candidates.length === 0) {
        apiLogger.warn(`No image generated for image ${index + 1}/${numImages}`, { clientId });
        return null;
      }

      let imageData: string | undefined;
      let mimeType: string | undefined;

      // Try different possible response structures
      // Option 1: Check if parts array exists in content
      if (candidates[0].content?.parts && Array.isArray(candidates[0].content.parts)) {
        const imagePart = candidates[0].content.parts.find((part: any) => part.inlineData);
        if (imagePart?.inlineData) {
          imageData = imagePart.inlineData.data;
          mimeType = imagePart.inlineData.mimeType;
        }
      }

      // Option 2: Check if image data is directly in candidate
      if (!imageData && candidates[0].inlineData) {
        imageData = candidates[0].inlineData.data;
        mimeType = candidates[0].inlineData.mimeType;
      }

      // Option 3: Check if parts is directly on candidate
      if (!imageData && candidates[0].parts && Array.isArray(candidates[0].parts)) {
        const imagePart = candidates[0].parts.find((part: any) => part.inlineData);
        if (imagePart?.inlineData) {
          imageData = imagePart.inlineData.data;
          mimeType = imagePart.inlineData.mimeType;
        }
      }

      if (!imageData) {
        apiLogger.error(`Failed to find image ${index + 1}/${numImages} in Gemini response`, undefined, {
          candidateStructure: JSON.stringify(candidates[0]).substring(0, 500),
          clientId
        });
        return null;
      }

      return {
        mimeType: mimeType || "image/png",
        data: imageData,
      };
    };

    // Generate multiple images in parallel
    const imagePromises = Array.from({ length: numImages }, (_, index) => generateSingleImage(index));
    const results = await Promise.all(imagePromises);

    // Parse all images
    let images = results
      .map((result, index) => parseImageFromResponse(result, index))
      .filter((img): img is { mimeType: string; data: string } => img !== null);

    if (images.length === 0) {
      const error: any = new Error("No images generated");
      error.status = 500;
      throw error;
    }

    // Auto-crop black borders for 21:9 images
    if (settings?.aspectRatio === '21:9') {
      apiLogger.debug("Auto-cropping black borders for 21:9 images", { clientId });

      const croppedImages = await Promise.all(
        images.map(async (img) => {
          try {
            return await cropBlackBorders(img.data, img.mimeType);
          } catch (error) {
            apiLogger.warn("Failed to crop black borders, using original", { error, clientId });
            return img;
          }
        })
      );

      images = croppedImages;
    }

    // Return single image or array of images
    if (numImages === 1) {
      return NextResponse.json({
        image: images[0],
      });
    } else {
      return NextResponse.json({
        images,
      });
    }
  } catch (error) {
    return handleApiError(error, 'generate-image-api');
  }
}
