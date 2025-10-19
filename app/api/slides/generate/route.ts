// ============================================
// API Route: Generate Presentation
// POST /api/slides/generate
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateSlidesPrompt, validatePrompt } from "@/lib/api/slides/prompt-generator";
import type {
  CreatePresentationRequest,
  CreatePresentationResponse,
} from "@/types/slides";

/**
 * POST /api/slides/generate
 *
 * Create a new presentation and start Manus task
 *
 * Body:
 * {
 *   "prompt": "User prompt for presentation",
 *   "format": "16:9" | "4:3" | "A4",
 *   "theme": "default" | "red" | "rose" | "orange" | "green" | "blue" | "yellow" | "violet"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "presentation_id": "uuid",
 *     "task_id": "manus_task_id",
 *     "status": "generating"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreatePresentationRequest = await request.json();
    const { prompt, format = "16:9", theme = "default" } = body;

    // Validate prompt
    const validation = validatePrompt(prompt);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Create presentation in database
    const { data: presentation, error: dbError } = await supabase
      .from("presentations")
      .insert({
        user_id: user.id,
        prompt,
        format,
        theme,
        status: "generating",
      })
      .select()
      .single();

    if (dbError || !presentation) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create presentation",
        },
        { status: 500 }
      );
    }

    // Generate enhanced prompt
    const enhancedPrompt = generateSlidesPrompt(prompt, format, theme);

    // Create Manus task
    try {
      const manusClient = getManusClient();
      const taskId = await manusClient.createSlidesTask(
        enhancedPrompt,
        presentation.id
      );

      // Update presentation with task_id
      const { error: updateError } = await supabase
        .from("presentations")
        .update({ task_id: taskId })
        .eq("id", presentation.id);

      if (updateError) {
        console.error("Failed to update task_id:", updateError);
      }

      // Create manus_task record
      await supabase.from("manus_tasks").insert({
        task_id: taskId,
        presentation_id: presentation.id,
        status: "running",
      });

      // Return success response
      const response: CreatePresentationResponse = {
        success: true,
        data: {
          presentation_id: presentation.id,
          task_id: taskId,
          status: "generating",
        },
      };

      return NextResponse.json(response, { status: 201 });
    } catch (manusError: any) {
      console.error("Manus API error:", manusError);

      // Update presentation status to error
      await supabase
        .from("presentations")
        .update({ status: "error" })
        .eq("id", presentation.id);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create slides generation task",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in generate endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
