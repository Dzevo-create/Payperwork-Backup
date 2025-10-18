import { NextRequest, NextResponse } from "next/server";
import { saveBrandingGeneration } from "@/lib/supabase-branding";
import { apiLogger } from '@/lib/logger';

/**
 * API Route to save a branding generation to the database
 * Uses client-side userId from request body (like Library does)
 */
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      url,
      thumbnailUrl,
      type,
      sourceType,
      parentId,
      prompt,
      model,
      settings,
      metadata,
      name,
      sourceImage,
    } = await req.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId - client must provide getUserId()" },
        { status: 400 }
      );
    }

    if (!url || !type || !model || !name) {
      return NextResponse.json(
        { error: "Missing required fields: url, type, model, name" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["render", "video", "upscale"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'render', 'video', or 'upscale'" },
        { status: 400 }
      );
    }

    // Save to database
    apiLogger.debug('[SaveGeneration API] Attempting to save generation:', {
      userId,
      type,
      model,
      name,
      hasUrl: !!url,
    });

    const generation = await saveBrandingGeneration(userId, {
      url,
      thumbnailUrl,
      type,
      sourceType,
      parentId,
      prompt,
      model,
      settings,
      metadata,
      name,
      sourceImage,
    });

    if (!generation) {
      apiLogger.error('[SaveGeneration API] saveBrandingGeneration returned null');
      return NextResponse.json(
        {
          error: "Failed to save generation to database",
          details: "Database operation returned null",
        },
        { status: 500 }
      );
    }

    apiLogger.info('[SaveGeneration API] Generation saved successfully:');

    return NextResponse.json({
      success: true,
      generation,
    });
  } catch (error) {
    apiLogger.error('[SaveGeneration API] Unexpected error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error) || "Failed to save generation",
        details: "Check server logs for full error details",
      },
      { status: 500 }
    );
  }
}
