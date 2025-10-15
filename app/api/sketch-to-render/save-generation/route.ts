import { NextRequest, NextResponse } from "next/server";
import { saveSketchToRenderGeneration } from "@/lib/supabase-sketch-to-render";

/**
 * API Route to save a sketch-to-render generation to the database
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
    console.log("[SaveGeneration API] Attempting to save generation:", {
      userId,
      type,
      model,
      name,
      hasUrl: !!url,
    });

    const generation = await saveSketchToRenderGeneration(userId, {
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
      console.error("[SaveGeneration API] saveSketchToRenderGeneration returned null");
      return NextResponse.json(
        {
          error: "Failed to save generation to database",
          details: "Database operation returned null",
        },
        { status: 500 }
      );
    }

    console.log("[SaveGeneration API] Generation saved successfully:", generation.id);

    return NextResponse.json({
      success: true,
      generation,
    });
  } catch (error: any) {
    console.error("[SaveGeneration API] Unexpected error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to save generation",
        details: "Check server logs for full error details",
      },
      { status: 500 }
    );
  }
}
