/**
 * Sketch-to-Render: Upscale Endpoint
 *
 * Upscales rendered images using Freepik Magnific AI
 * Creates an async task and returns task_id for polling
 */

import { NextRequest, NextResponse } from "next/server";
import { apiLogger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-error-handler";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
const FREEPIK_UPSCALE_URL = "https://api.freepik.com/v1/ai/image-upscaler-precision";

/**
 * POST /api/sketch-to-render/upscale
 *
 * Start upscaling task for an image
 *
 * Request body:
 * - image: { data: string, mimeType: string } - Image to upscale (base64)
 * - sharpen?: number - Sharpen amount (0-100, default: 50)
 * - smart_grain?: number - Smart grain (0-100, default: 7)
 * - ultra_detail?: number - Ultra detail (0-100, default: 30)
 *
 * Response:
 * - task_id: string - Task ID for polling status
 * - status: string - Initial task status (CREATED)
 */
export async function POST(req: NextRequest) {
  try {
    apiLogger.debug('🎨 [UPSCALE POST] Request received!');
    apiLogger.info("Upscale request received");

    // Validate API key
    if (!FREEPIK_API_KEY) {
      return NextResponse.json(
        { error: "Freepik API key nicht konfiguriert" },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      image,
      sharpen = 50,
      smart_grain = 7,
      ultra_detail = 30,
    } = body;

    // Validate required fields
    if (!image || !image.data) {
      return NextResponse.json(
        { error: "Bild ist erforderlich" },
        { status: 400 }
      );
    }

    // Validate parameter ranges
    if (sharpen < 0 || sharpen > 100) {
      return NextResponse.json(
        { error: "Sharpen muss zwischen 0 und 100 liegen" },
        { status: 400 }
      );
    }

    if (smart_grain < 0 || smart_grain > 100) {
      return NextResponse.json(
        { error: "Smart grain muss zwischen 0 und 100 liegen" },
        { status: 400 }
      );
    }

    if (ultra_detail < 0 || ultra_detail > 100) {
      return NextResponse.json(
        { error: "Ultra detail muss zwischen 0 und 100 liegen" },
        { status: 400 }
      );
    }

    apiLogger.info("Starting Freepik upscale task", {
      sharpen,
      smart_grain,
      ultra_detail,
      imageDataLength: image.data?.length || 0,
    });

    // Prepare image data - Freepik expects ONLY base64 string (NOT data URL format!)
    // Per documentation: "image": "aSDinaTvuI8gbWludGxpZnk=" (just base64, no prefix)
    const base64String = image.data;

    // Call Freepik API to create upscaling task
    const freepikResponse = await fetch(FREEPIK_UPSCALE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
      body: JSON.stringify({
        image: base64String, // ONLY base64 string, no data URL prefix!
        sharpen,
        smart_grain,
        ultra_detail,
      }),
    });

    if (!freepikResponse.ok) {
      const errorText = await freepikResponse.text();
      const error = new Error(`Freepik API Error: ${freepikResponse.status} - ${errorText}`);
      apiLogger.error("Freepik API error", error, {
        status: freepikResponse.status,
      });
      throw error;
    }

    const data = await freepikResponse.json();

    // Log full response for debugging
    apiLogger.info("Upscale task created", {
      task_id: data.data?.task_id,
      status: data.data?.status,
      fullResponse: JSON.stringify(data, null, 2),
    });

    // Validate response structure
    if (!data.data?.task_id) {
      const error = new Error("Freepik API returned invalid response - no task_id");
      apiLogger.error("Freepik API returned invalid response", error, {
        responseData: JSON.stringify(data),
      });
      throw error;
    }

    // Return task info for client-side polling
    return NextResponse.json({
      task_id: data.data.task_id,
      status: data.data.status || "CREATED",
    });
  } catch (error: any) {
    return handleApiError(error, "sketch-to-render-upscale");
  }
}

/**
 * GET /api/sketch-to-render/upscale?task_id=xxx
 *
 * Poll status of an upscaling task
 *
 * Query params:
 * - task_id: string - Task ID to check
 *
 * Response:
 * - task_id: string
 * - status: string - CREATED | IN_PROGRESS | COMPLETED | FAILED
 * - generated?: string[] - Array of upscaled image URLs (when COMPLETED)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const task_id = searchParams.get("task_id");

    if (!task_id) {
      return NextResponse.json(
        { error: "task_id ist erforderlich" },
        { status: 400 }
      );
    }

    apiLogger.info("Polling upscale task status", { task_id });

    // Check task status with Freepik API
    const freepikResponse = await fetch(
      `${FREEPIK_UPSCALE_URL}/${task_id}`,
      {
        method: "GET",
        headers: {
          "x-freepik-api-key": FREEPIK_API_KEY || "",
        },
      }
    );

    if (!freepikResponse.ok) {
      const errorText = await freepikResponse.text();
      const error = new Error(`Freepik API Error: ${freepikResponse.status} - ${errorText}`);
      apiLogger.error("Freepik API error during polling", error, {
        status: freepikResponse.status,
        task_id,
      });
      throw error;
    }

    const data = await freepikResponse.json();

    // Log full response for debugging with ALL possible paths
    apiLogger.info("Upscale task status - FULL DEBUG", {
      task_id,
      // Check all possible response structures
      "data.data": data.data,
      "data.data?.status": data.data?.status,
      "data.data?.generated": data.data?.generated,
      "data.data?.image": data.data?.image,
      "data.data?.images": data.data?.images,
      "data.data?.result": data.data?.result,
      "data.data?.output": data.data?.output,
      "data.generated": data.generated,
      "data.image": data.image,
      "data.images": data.images,
      "data.result": data.result,
      "data.output": data.output,
      fullResponse: JSON.stringify(data, null, 2),
    });

    // Try multiple possible paths for the image URL
    let generatedImage =
      data.data?.generated ||
      data.data?.image ||
      data.data?.images ||
      data.data?.result ||
      data.data?.output ||
      data.generated ||
      data.image ||
      data.images ||
      data.result ||
      data.output ||
      null;

    return NextResponse.json({
      task_id: data.data?.task_id || task_id,
      status: data.data?.status || "UNKNOWN",
      generated: generatedImage,
      error: data.data?.error || data.error || null,
    });
  } catch (error: any) {
    return handleApiError(error, "sketch-to-render-upscale-poll");
  }
}
