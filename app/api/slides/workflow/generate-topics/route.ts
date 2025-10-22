/**
 * API Route: Generate Slide Topics
 *
 * Generates 10 slide topics based on user prompt using Claude API.
 * Topics will be delivered via WebSocket with real-time updates.
 *
 * @route POST /api/slides/workflow/generate-topics
 */

import { NextRequest, NextResponse } from "next/server";
import { generateTopics } from "@/lib/api/slides/claude-service";
import { createClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

// Initialize Supabase client (admin)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { prompt, format, theme, userId } = await request.json();

    // Validate
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ success: false, error: "Prompt is required" }, { status: 400 });
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    apiLogger.info("📝 Generating topics for user:", { userId });
    apiLogger.info("Prompt:", { prompt });
    apiLogger.info("Format:", { format, theme });

    // Step 1: Create presentation in DB
    const { data: presentation, error: createError } = await supabase
      .from("presentations")
      .insert({
        user_id: userId,
        title: prompt.substring(0, 100), // First 100 chars as title
        prompt,
        format: format || "16:9",
        theme: theme || "default",
        status: "planning",
      })
      .select()
      .single();

    if (createError || !presentation) {
      console.error("Error creating presentation:", createError);
      throw new Error("Failed to create presentation in database");
    }

    apiLogger.info("✅ Created presentation:", { value: presentation.id });

    // Step 2: Generate topics with Claude API
    const topics = await generateTopics({
      prompt,
      userId,
      format: format || "16:9",
      theme: theme || "default",
    });

    // Step 3: Save topics to presentation
    const { error: updateError } = await supabase
      .from("presentations")
      .update({
        topics: topics,
        status: "topics_generated",
      })
      .eq("id", presentation.id);

    if (updateError) {
      console.error("Error updating presentation with topics:", updateError);
    }

    apiLogger.info("✅ Saved topics to presentation:", { value: presentation.id });

    // Step 4: Emit topics via WebSocket
    try {
      const { emitTopicsGenerated } = require("@/lib/socket/server");
      apiLogger.info("📡 Emitting topics via WebSocket to user:", { userId });
      emitTopicsGenerated(userId, {
        topics,
        messageId: `topics-${Date.now()}`,
      });
    } catch (socketError) {
      console.error("❌ Socket emit error (non-fatal):", socketError);
    }

    // Step 5: Return presentation ID and topics
    return NextResponse.json({
      success: true,
      presentationId: presentation.id,
      topics,
    });
  } catch (error) {
    console.error("Error generating topics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
