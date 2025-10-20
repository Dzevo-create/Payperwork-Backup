/**
 * Branding Generation API Route
 *
 * Main "Generate" button endpoint for transforming sketches into photorealistic renderings.
 * Uses Nano Banana (Gemini 2.5 Flash Image / Payperwork Flash v.1) for image generation.
 *
 * Workflow:
 * 1. Validates API keys and rate limits
 * 2. Enhances prompt with GPT-4o Vision (analyzes sketch structure)
 * 3. Prepares images in correct order (reference first, source LAST)
 * 4. Generates rendering with Nano Banana
 * 5. Returns generated image with metadata
 *
 * @endpoint POST /api/branding
 */

import { NextRequest, NextResponse } from "next/server";
import { imageGenerationRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import {
  enhanceBrandingPrompt,
  prepareImagesForGeneration,
  validateImages,
} from "@/lib/api/workflows/sketchToRender";
import {
  geminiClient,
  GEMINI_MODELS,
  buildGenerationConfig,
  generateSingleImage,
  parseImageFromResponse,
} from "@/lib/api/providers/gemini";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { getBrandInfo } from "@/lib/api/agents/brandColorDatabase";

/**
 * POST /api/branding
 *
 * Main generation endpoint - Transforms sketch to photorealistic rendering
 * Uses Nano Banana (Gemini 2.5 Flash Image / Payperwork Flash v.1)
 */
export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation
    const keyValidation = validateApiKeys(["google-gemini"]);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new Error("Content-Type must be application/json"),
        "branding-api"
      );
    }

    // Rate limiting
    const rateLimitResult = imageGenerationRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const body = await req.json();
    const { prompt, sourceImage, referenceImage, settings } = body;

    // Validate images
    const validation = validateImages(sourceImage, referenceImage ? [referenceImage] : undefined);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    apiLogger.info("Branding: Starting generation", {
      clientId,
      hasPrompt: !!prompt,
      hasReference: !!referenceImage,
      hasSettings: !!settings,
      brand: settings?.brandingText || null,
      venueType: settings?.venueType || null,
    });

    // Step 1: Enhance prompt with Brand Intelligence + GPT-4o Vision
    let enhancedPrompt: string;

    apiLogger.info("Branding: Step 1 - Starting prompt enhancement", {
      clientId,
      hasPrompt: !!prompt,
      hasSourceImage: !!sourceImage,
      hasReferenceImage: !!referenceImage,
    });

    try {
      enhancedPrompt = await enhanceBrandingPrompt({
        userPrompt: prompt || "Transform this space into a branded environment",
        sourceImage,
        settings: settings as BrandingSettingsType | undefined,
        referenceImages: referenceImage ? [referenceImage] : undefined
      });

      apiLogger.debug("Branding: Prompt enhanced with Brand Intelligence", {
        clientId,
        originalLength: prompt?.length || 0,
        enhancedLength: enhancedPrompt.length,
        brand: settings?.brandingText,
      });
    } catch (error) {
      apiLogger.error("Branding: Prompt enhancement failed completely", error instanceof Error ? error : undefined, {
        clientId,
      });
      // Fallback: use comprehensive branded prompt with furniture
      const parts: string[] = [
        "Exact same camera angle and perspective as source.",
        "Fully photorealistic rendering with no sketch lines.",
      ];

      if (settings?.brandingText) {
        const venuePart = settings.venueType ? ` ${settings.venueType}` : " space";
        parts.push(`Transform this into a ${settings.brandingText}${venuePart}.`);

        // Try to get brand info from database
        const brandInfo = getBrandInfo(settings.brandingText);

        if (brandInfo) {
          // Use database colors and materials (ACCURATE)
          parts.push(`Incorporate ${brandInfo.brandName} brand identity throughout:`);
          parts.push(`- Use ${brandInfo.brandName} brand colors: ${brandInfo.primaryColors.join(", ")} for walls, furniture, and decorative elements`);
          if (brandInfo.secondaryColors.length > 0) {
            parts.push(`- Add secondary brand colors: ${brandInfo.secondaryColors.join(", ")} as accent colors`);
          }
          parts.push(`- Apply ${brandInfo.brandName} characteristic materials: ${brandInfo.materials.join(", ")}`);
          parts.push(`- Display ${brandInfo.brandName} logos and branding on signage, walls, and product displays`);
          parts.push(`- Create ${brandInfo.atmosphere} with ${brandInfo.style} styling`);
        } else {
          // Fallback to generic (if brand not in database)
          parts.push(`Incorporate ${settings.brandingText} brand identity throughout:`);
          parts.push(`- Use ${settings.brandingText} signature brand colors on walls, furniture, and decorative elements`);
          parts.push(`- Display ${settings.brandingText} logos and branding on signage, walls, and displays`);
          parts.push(`- Apply ${settings.brandingText} characteristic materials and finishes`);
          parts.push(`- Create ${settings.brandingText} branded atmosphere with lighting and styling`);
        }
      }

      // Venue-specific furniture with brand integration
      if (!settings?.preserveEmptySpace) {
        const venueType = settings?.venueType || "space";
        const brandName = settings?.brandingText || "branded";
        let furnitureExamples = "";

        if (venueType.includes("retail") || venueType.includes("store")) {
          furnitureExamples = `${brandName}-branded product display shelves, glass showcases with ${brandName} products, checkout counter with ${brandName} signage, seating areas with ${brandName} brand-colored chairs, wall-mounted screens showing ${brandName} branding, pendant lighting in ${brandName} colors, potted plants, ${brandName} logo displays, shopping baskets, display tables with ${brandName} merchandise`;
        } else if (venueType.includes("restaurant") || venueType.includes("café") || venueType.includes("cafe")) {
          furnitureExamples = `dining tables in ${brandName} style, bar counter with ${brandName} signage, ${brandName}-branded menu boards, booth seating with ${brandName} colors, counter stools, display shelves with ${brandName} products, pendant lights in ${brandName} colors, wall art with ${brandName} branding, plants, condiment stations, ${brandName} logo on walls`;
        } else if (venueType.includes("hotel") || venueType.includes("lobby")) {
          furnitureExamples = `${brandName}-branded reception desk, lounge sofas in ${brandName} colors, armchairs, coffee tables, side tables, floor lamps, potted plants, ${brandName} logo displays, luggage racks, decorative art with ${brandName} branding, concierge desk with ${brandName} signage`;
        } else if (venueType.includes("office")) {
          furnitureExamples = `${brandName}-branded workstations, office desks with ${brandName} colors, ergonomic chairs, filing cabinets, conference tables, desk lamps, potted plants, ${brandName} logo on walls, shelving units, storage units, meeting chairs, whiteboards with ${brandName} branding`;
        } else {
          furnitureExamples = `sofas in ${brandName} colors, armchairs with ${brandName} branding, coffee tables, side tables, shelving units with ${brandName} products, pendant lights in ${brandName} colors, floor lamps, wall art with ${brandName} logo, potted plants, decorative objects with ${brandName} theme, rugs, display cases with ${brandName} merchandise`;
        }

        parts.push(`Fill the space with ${brandName}-branded furniture and decor including: ${furnitureExamples}.`);
        parts.push(`Ensure all furniture, lighting, and decorations incorporate ${brandName} brand colors and identity.`);
      } else {
        parts.push("Preserve empty/minimal spaces with subtle branding elements.");
      }

      enhancedPrompt = parts.join(" ");

      apiLogger.warn("Branding: Using comprehensive fallback prompt", {
        clientId,
        fallbackLength: enhancedPrompt.length,
        brand: settings?.brandingText,
        venue: settings?.venueType,
        fillSpaces: !settings?.preserveEmptySpace,
      });
    }

    // CRITICAL: Prepend structure preservation instruction DIRECTLY for Gemini
    // This ensures Gemini ALWAYS sees this instruction, regardless of GPT-4o output
    const brandContext = settings?.brandingText ? `\n\nBRAND: ${settings.brandingText}${settings?.venueType ? ` ${settings.venueType}` : ""}` : "";

    // Build empty space instruction and layout preservation level
    let emptySpaceInstruction = "";
    let layoutPreservation = "";

    if (settings?.preserveEmptySpace) {
      emptySpaceInstruction = "\n- PRESERVE empty/minimal spaces - do NOT add furniture or decorations to empty areas";
      layoutPreservation = "- EXACT same layout, proportions, composition, and framing";
    } else {
      emptySpaceInstruction = "\n- TRANSFORM EMPTY SPACES INTO FURNISHED AREAS - add furniture (sofas, chairs, tables, shelving, display cases), decorations (artwork, plants, sculptures, textiles), product displays, lighting fixtures (chandeliers, lamps, spotlights, track lighting), rugs, seating areas, and brand merchandising to ALL empty walls and floor areas. Fill the space with objects and furnishings that create a complete branded environment.";
      layoutPreservation = "- Maintain SIMILAR layout and spatial proportions, but ADD furniture, displays, and decorations to fill empty areas";
    }

    const geminiPrompt = `IMAGE-TO-IMAGE BRANDED RENDERING: Transform this space into a FULLY PHOTOREALISTIC branded environment.${brandContext}

CRITICAL RULES:
- Use the EXACT camera angle, perspective, viewpoint from the source image (last image)
${layoutPreservation}
- COMPLETELY PHOTOREALISTIC - NO sketch lines, NO drawing lines, NO line art visible
- Replace ALL elements with photorealistic materials, lighting, and textures
- The output must look like a REAL PHOTOGRAPH, not a drawing or sketch
- HIDE all construction lines, guide lines, and sketch marks
- Apply realistic surface details, reflections, and shadows
- INTEGRATE brand identity: colors, logos, materials, signature design elements${emptySpaceInstruction}

${enhancedPrompt}

REMINDER: Fully photorealistic branded space with ZERO visible sketch lines.`;

    apiLogger.debug("Branding: Final Gemini prompt prepared", {
      clientId,
      finalPromptLength: geminiPrompt.length,
    });

    // Step 2: Prepare images for Nano Banana
    // IMPORTANT: Source image MUST be LAST (determines aspect ratio)
    const images = prepareImagesForGeneration(
      sourceImage,
      referenceImage ? [referenceImage] : undefined
    );

    apiLogger.debug("Branding: Images prepared", {
      clientId,
      imageCount: images.length,
      lastImageIsSource: true, // Always true per our logic
    });

    // Step 3: Initialize Nano Banana (Gemini 2.5 Flash Image)
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODELS.imageGeneration, // gemini-2.5-flash-image-preview
    });

    // Step 4: Build generation config
    const generationConfig = buildGenerationConfig(settings);

    // Step 5: Build content parts (text + images)
    // Use geminiPrompt (with prepended structure preservation instructions)
    const parts = [
      { text: geminiPrompt },
      ...images.map(img => img)
    ];

    apiLogger.info("Branding: Step 6 - Generating with Nano Banana (Gemini)", {
      clientId,
      promptLength: geminiPrompt.length,
      imageCount: images.length,
    });

    // Step 6: Generate rendering with Nano Banana
    let result;
    try {
      result = await generateSingleImage(
        model,
        parts,
        generationConfig,
        0,
        1,
        clientId
      );
      apiLogger.info("Branding: Gemini API call successful", { clientId });
    } catch (geminiError) {
      apiLogger.error("Branding: Gemini API call failed", geminiError instanceof Error ? geminiError : undefined, {
        clientId,
        errorMessage: geminiError instanceof Error ? geminiError.message : String(geminiError),
      });
      throw geminiError;
    }

    // Step 7: Parse generated image
    const generatedImage = parseImageFromResponse(result, 0, 1, clientId);

    if (!generatedImage) {
      throw new Error("Failed to generate rendering");
    }

    apiLogger.info("Branding: Generation successful", {
      clientId,
      imageMimeType: generatedImage.mimeType,
    });

    // Step 8: Return result with metadata
    return NextResponse.json({
      image: generatedImage,
      metadata: {
        prompt: prompt || null,
        enhancedPrompt, // GPT-4o enhanced prompt
        finalPrompt: geminiPrompt, // Final prompt sent to Gemini (with structure preservation)
        settings: settings || null,
        timestamp: new Date().toISOString(),
        model: GEMINI_MODELS.imageGeneration,
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    apiLogger.error("Branding: Generation failed", error instanceof Error ? error : undefined, {
      clientId,
      errorMessage,
      errorStack,
    });

    // Return detailed error for debugging
    return NextResponse.json(
      {
        error: errorMessage,
        details: {
          message: errorMessage,
          stack: errorStack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
          timestamp: new Date().toISOString(),
          clientId,
        }
      },
      { status: 500 }
    );
  }
}
