import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { apiRateLimiter, getClientId } from "@/lib/rate-limit";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { apiLogger } from '@/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        'analyze-image-api'
      );
    }

    // Rate limiting
    const rateLimitResult = apiRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const { image, prompt } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Invalid image provided" },
        { status: 400 }
      );
    }

    // Detect MIME type from base64 string if it's included
    let imageUrl = image;
    if (!image.startsWith('data:')) {
      // If no data URI, try to detect format from first bytes of base64
      // Default to image/jpeg if we can't detect
      const formatMatch = image.match(/^[A-Za-z0-9+/]*={0,2}/);
      if (formatMatch) {
        const firstBytes = Buffer.from(image.substring(0, 8), 'base64');
        let mimeType = 'image/jpeg'; // default

        // PNG signature: 89 50 4E 47
        if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47) {
          mimeType = 'image/png';
        }
        // JPEG signature: FF D8 FF
        else if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8 && firstBytes[2] === 0xFF) {
          mimeType = 'image/jpeg';
        }
        // GIF signature: 47 49 46
        else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46) {
          mimeType = 'image/gif';
        }
        // WebP signature: RIFF ... WEBP
        else if (firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x46) {
          mimeType = 'image/webp';
        }

        imageUrl = `data:${mimeType};base64,${image}`;
      } else {
        imageUrl = `data:image/jpeg;base64,${image}`;
      }
    }

    apiLogger.debug('Analyzing image with detected format', {
      formatPreview: imageUrl.substring(0, 50) + "..."
    });

    // Use OpenAI Vision API to analyze the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt || "Beschreibe detailliert, was auf diesem Bild zu sehen ist.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const description = response.choices[0]?.message?.content?.trim();

    if (!description) {
      throw new Error("No description generated");
    }

    return NextResponse.json({ description });
  } catch (error) {
    return handleApiError(error, 'analyze-image-api');
  }
}
