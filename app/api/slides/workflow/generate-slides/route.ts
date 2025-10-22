/**
 * API Route: Generate Slides
 *
 * Generates full slide content using Claude API with streaming.
 * Slides will be delivered via WebSocket with real-time updates.
 *
 * @route POST /api/slides/workflow/generate-slides
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateSlides } from "@/lib/api/slides/claude-service";
import { apiLogger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { prompt, topics, presentationId, userId, format, theme } = await request.json();

    // Validate
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    if (!topics || !Array.isArray(topics)) {
      return NextResponse.json(
        { success: false, error: "Topics array is required" },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    if (!presentationId || typeof presentationId !== "string") {
      return NextResponse.json(
        { success: false, error: "Presentation ID is required" },
        { status: 400 }
      );
    }

    apiLogger.info("📝 Generating slides for user:", { userId });
    apiLogger.info("Presentation ID:", { presentationId });
    apiLogger.info("Topics:", { value: topics.length });

    // Update presentation status
    await supabaseAdmin
      .from("presentations")
      .update({ status: "generating" })
      .eq("id", presentationId);

    // Generate slides (async, emits via WebSocket)
    generateSlides({
      prompt,
      topics,
      userId,
      presentationId,
      format: format || "16:9",
      theme: theme || "default",
    }).catch((error) => {
      console.error("Error in slides generation:", error);
    });

    return NextResponse.json({
      success: true,
      message: "Slides generation started",
      presentationId,
    });
  } catch (error) {
    console.error("Error starting slides generation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
