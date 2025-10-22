/**
 * Style-Transfer: Edit/Refine Endpoint
 *
 * Allows users to make changes to existing rendered images
 * Uses Nano Banana (Gemini 2.5 Flash Image) for image-to-image generation
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKeys } from "@/lib/api-security";
import { getClientId, imageEditRateLimiter } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { geminiClient, GEMINI_MODELS } from "@/lib/api/providers/gemini";
import { enhanceEditPrompt } from "@/lib/api/workflows/sketchToRender/editEnhancer";
import { handleApiError } from "@/lib/api-error-handler";
import type { Part } from "@google/generative-ai";

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = "force-dynamic";

/**
 * POST /api/style-transfer/edit
 *
 * Edit/refine an existing render with new instructions
 *
 * Request body:
 * - editPrompt: string - User's edit instruction
 * - currentImage: { data: string, mimeType: string } - Current rendered image
 * - originalPrompt?: string - Original prompt (optional, for context)
 *
 * Response:
 * - image: { data: string, mimeType: string } - Edited image
 * - metadata: { editPrompt, enhancedPrompt, timestamp, model }
 */
export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  apiLogger.info("Edit render request received", { clientId });

  try {
    // Validate API keys
    const keyValidation = validateApiKeys(["openai", "google-gemini"]);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Rate limiting (separate limiter for edits - 10 edits/min)
    const rateLimitResult = imageEditRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      apiLogger.warn("Rate limit exceeded for edit", {
        clientId,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      });
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: "Rate limit erreicht",
          retryAfter: retryAfter * 1000,
          message: `Bitte warte ${retryAfter} Sekunden`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { editPrompt, currentImage, originalPrompt, referenceImage } = body;

    // Validate required fields
    if (!editPrompt || !editPrompt.trim()) {
      return NextResponse.json({ error: "Edit-Prompt ist erforderlich" }, { status: 400 });
    }

    if (!currentImage || !currentImage.data || !currentImage.mimeType) {
      return NextResponse.json({ error: "Aktuelles Bild ist erforderlich" }, { status: 400 });
    }

    apiLogger.info("Edit request validated", {
      clientId,
      editPromptLength: editPrompt.length,
      hasOriginalPrompt: !!originalPrompt,
      hasReferenceImage: !!referenceImage?.data, // ✅ NEW: Log reference image
    });

    // Step 1: Enhance edit prompt with GPT-4o Vision (+ optional reference image analysis)
    apiLogger.info("Enhancing edit prompt with GPT-4o", {
      clientId,
      hasReferenceImage: !!referenceImage?.data,
    });

    const enhancedPrompt = await enhanceEditPrompt({
      editPrompt: editPrompt.trim(),
      currentImage,
      originalPrompt,
      referenceImage, // ✅ NEW: Pass reference image for feature extraction
    });

    apiLogger.info("Edit prompt enhanced", {
      clientId,
      enhancedLength: enhancedPrompt.length,
      hasReferenceFeatures: !!referenceImage?.data,
    });

    // Step 2: Initialize Nano Banana (Gemini 2.5 Flash Image)
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODELS.imageGeneration,
    });

    // Step 3: Prepare generation config (use default settings for edits)
    const generationConfig = {
      temperature: 0.8, // Slightly higher for creative edits
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };

    // Step 4: Build content parts (prompt + current image + optional reference image)
    const parts: Part[] = [
      { text: enhancedPrompt },
      {
        inlineData: {
          data: currentImage.data,
          mimeType: currentImage.mimeType,
        },
      },
    ];

    // ✅ NEW: Add reference image if provided (for feature extraction)
    if (referenceImage?.data) {
      parts.push({
        inlineData: {
          data: referenceImage.data,
          mimeType: referenceImage.mimeType || "image/jpeg",
        },
      });
      apiLogger.info("Reference image added to edit request", {
        clientId,
        referenceImageSize: referenceImage.data.length,
      });
    }

    apiLogger.info("Starting image edit with Nano Banana", { clientId });

    // Step 5: Generate edited image with retry logic
    const MAX_RETRIES = 3;
    let editedImageData: string | null = null;
    let editedImageMimeType: string = "image/jpeg";
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        apiLogger.info(`Edit generation attempt ${attempt}/${MAX_RETRIES}`, { clientId });

        const result = await model.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig,
        });

        const response = result.response;

        // Step 6: Extract image from response
        if (!response.candidates || response.candidates.length === 0) {
          throw new Error("Keine Bearbeitung generiert");
        }

        const candidate = response.candidates[0];
        if (!candidate || !candidate.content || !candidate.content.parts) {
          throw new Error("Ungültiges Bearbeitungs-Format");
        }

        // Find image part
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            editedImageData = part.inlineData.data;
            editedImageMimeType = part.inlineData.mimeType || "image/jpeg";
            break;
          }
        }

        if (editedImageData) {
          // Success! Break out of retry loop
          apiLogger.info(`Edit successful on attempt ${attempt}`, { clientId });
          break;
        } else {
          throw new Error("Kein Bild in der Antwort gefunden");
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = error instanceof Error ? error.message : String(error);
        apiLogger.warn(`Edit attempt ${attempt} failed`, {
          clientId,
          error: errorMessage,
          willRetry: attempt < MAX_RETRIES,
        });

        // If not last attempt, wait with exponential backoff
        if (attempt < MAX_RETRIES) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5s
          apiLogger.info(`Waiting ${backoffMs}ms before retry`, { clientId });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    // If still no image after all retries, throw error
    if (!editedImageData) {
      apiLogger.error("Edit failed after all retries", lastError || undefined, {
        clientId,
        attempts: MAX_RETRIES,
      });
      throw new Error(
        `Bearbeitung nach ${MAX_RETRIES} Versuchen fehlgeschlagen. Bitte versuche es erneut.`
      );
    }

    apiLogger.info("Image successfully edited", {
      clientId,
      imageSize: editedImageData.length,
      mimeType: editedImageMimeType,
    });

    // Step 7: Return edited image with metadata
    return NextResponse.json({
      image: {
        data: editedImageData,
        mimeType: editedImageMimeType,
      },
      metadata: {
        editPrompt: editPrompt.trim(),
        enhancedPrompt,
        originalPrompt: originalPrompt || null,
        timestamp: new Date().toISOString(),
        model: GEMINI_MODELS.imageGeneration,
      },
    });
  } catch (error) {
    return handleApiError(error, "style-transfer-edit");
  }
}
