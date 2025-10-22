/**
 * API Route: Generate AI Acknowledgment Message
 *
 * Generates a friendly, contextual acknowledgment message using Claude
 * based on the user's prompt for a presentation.
 *
 * @route POST /api/slides/workflow/generate-acknowledgment
 */

import { NextRequest, NextResponse } from "next/server";
import { generateAcknowledgment } from "@/lib/api/slides/claude-service";
import { apiLogger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    // Validate
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    apiLogger.info("🤖 Generating acknowledgment for prompt:", { prompt });

    // Generate AI acknowledgment
    const acknowledgment = await generateAcknowledgment(prompt);

    apiLogger.info("✅ Generated acknowledgment:", { acknowledgment });

    return NextResponse.json({
      success: true,
      acknowledgment,
    });
  } catch (error) {
    console.error("Error generating acknowledgment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        acknowledgment: "Okay, ich erstelle dir einen Vorschlag für die Präsentation.",
      },
      { status: 500 }
    );
  }
}
