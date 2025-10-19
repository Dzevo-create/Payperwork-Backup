// ============================================
// API Route: Get Workflow Status
// GET /api/slides/workflow/[presentationId]
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { handleApiError } from "@/lib/api-error-handler";

/**
 * GET /api/slides/workflow/[presentationId]
 *
 * Get current workflow status for a presentation
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "presentationId": "uuid",
 *     "status": "generating" | "ready" | "error",
 *     "progress": 45,
 *     "currentStep": "Generating slides...",
 *     "taskId": "manus-task-id",
 *     "createdAt": "2025-10-19T...",
 *     "updatedAt": "2025-10-19T..."
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { presentationId: string } }
) {
  try {
    const { presentationId } = params;

    // Get authenticated user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: request.headers.get("Authorization") || "",
          },
        },
      }
    );

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

    // Get presentation
    const { data: presentation, error: presentationError } = await supabase
      .from("presentations")
      .select("*")
      .eq("id", presentationId)
      .eq("user_id", user.id)
      .single();

    if (presentationError || !presentation) {
      return NextResponse.json(
        {
          success: false,
          error: "Presentation not found",
        },
        { status: 404 }
      );
    }

    // Get manus task (if exists)
    const { data: manusTask } = await supabase
      .from("manus_tasks")
      .select("*")
      .eq("presentation_id", presentationId)
      .single();

    // Build response
    const response = {
      success: true,
      data: {
        presentationId: presentation.id,
        status: presentation.status,
        progress: calculateProgress(presentation.status, manusTask),
        currentStep: getCurrentStep(presentation.status, manusTask),
        taskId: presentation.task_id || manusTask?.task_id,
        createdAt: presentation.created_at,
        updatedAt: presentation.updated_at,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return handleApiError(error, "slides/workflow/status");
  }
}

/**
 * Calculate progress based on status
 *
 * @param status - Presentation status
 * @param manusTask - Manus task data (if exists)
 * @returns Progress percentage (0-100)
 */
function calculateProgress(status: string, manusTask: any): number {
  switch (status) {
    case "generating":
      // If we have webhook data with progress, use it
      if (manusTask?.webhook_data?.progress) {
        return manusTask.webhook_data.progress;
      }
      // Otherwise estimate based on time elapsed
      return 30; // Default for generating
    case "ready":
      return 100;
    case "error":
      return 0;
    default:
      return 0;
  }
}

/**
 * Get current step description
 *
 * @param status - Presentation status
 * @param manusTask - Manus task data (if exists)
 * @returns Current step description
 */
function getCurrentStep(status: string, manusTask: any): string {
  switch (status) {
    case "generating":
      if (manusTask?.webhook_data?.current_step) {
        return manusTask.webhook_data.current_step;
      }
      return "Generating slides...";
    case "ready":
      return "Completed";
    case "error":
      return "Error occurred";
    default:
      return "Initializing...";
  }
}
