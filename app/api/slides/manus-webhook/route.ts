// ============================================
// API Route: Manus Webhook
// POST /api/slides/manus-webhook
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@supabase/supabase-js";
import { parseManusSlidesResponse } from "@/lib/api/slides/slides-parser";
import {
  emitPresentationReady,
  emitPresentationError,
} from "@/lib/socket/server";
import crypto from "crypto";

/**
 * POST /api/slides/manus-webhook
 *
 * Receive webhook from Manus API when task completes
 *
 * Body:
 * {
 *   "event_type": "task_stopped",
 *   "stop_reason": "finish" | "error" | "user_stopped",
 *   "task_id": "manus_task_id",
 *   "created_at": "2024-01-01T00:00:00Z",
 *   "attachments": [...]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Webhook processed successfully"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse webhook body
    const webhookData = await request.json();

    // Verify webhook signature (if secret is configured)
    const webhookSecret = process.env.MANUS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-manus-signature");
      if (!signature) {
        console.error("Missing webhook signature");
        return NextResponse.json(
          {
            success: false,
            error: "Missing signature",
          },
          { status: 401 }
        );
      }

      // Verify signature
      const body = JSON.stringify(webhookData);
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          {
            success: false,
            error: "Invalid signature",
          },
          { status: 401 }
        );
      }
    }

    // Validate webhook event type
    if (webhookData.event_type !== "task_stopped") {
      console.log(`Ignoring webhook event: ${webhookData.event_type}`);
      return NextResponse.json({
        success: true,
        message: "Event acknowledged",
      });
    }

    // Extract task_id
    const taskId = webhookData.task_id;
    if (!taskId) {
      console.error("Missing task_id in webhook");
      return NextResponse.json(
        {
          success: false,
          error: "Missing task_id",
        },
        { status: 400 }
      );
    }

    // Create Supabase admin client (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get manus_task
    const { data: manusTask, error: taskError } = await supabase
      .from("manus_tasks")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (taskError || !manusTask) {
      console.error("Manus task not found:", taskId);
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 }
      );
    }

    // Update manus_task with webhook data
    await supabase
      .from("manus_tasks")
      .update({
        status: webhookData.stop_reason === "finish" ? "completed" : "failed",
        webhook_data: webhookData,
      })
      .eq("task_id", taskId);

    // Handle based on stop reason
    if (webhookData.stop_reason !== "finish") {
      // Task failed or was stopped
      console.error(`Task ${taskId} stopped with reason: ${webhookData.stop_reason}`);

      // Update presentation status to error
      await supabase
        .from("presentations")
        .update({ status: "error" })
        .eq("id", manusTask.presentation_id);

      // Get presentation to find user_id
      const { data: presentation } = await supabase
        .from("presentations")
        .select("user_id")
        .eq("id", manusTask.presentation_id)
        .single();

      // Emit error event via WebSocket
      if (presentation) {
        emitPresentationError(
          presentation.user_id,
          manusTask.presentation_id,
          webhookData.stop_reason || "Unknown error"
        );
      }

      return NextResponse.json({
        success: true,
        message: "Task failure recorded",
      });
    }

    // Task completed successfully - parse slides
    try {
      const parsedSlides = await parseManusSlidesResponse(webhookData);

      // Insert slides into database
      const slidesToInsert = parsedSlides.map((slide) => ({
        presentation_id: manusTask.presentation_id,
        ...slide,
      }));

      const { error: slidesError } = await supabase
        .from("slides")
        .insert(slidesToInsert);

      if (slidesError) {
        console.error("Error inserting slides:", slidesError);
        throw new Error("Failed to save slides to database");
      }

      // Update presentation status to ready
      await supabase
        .from("presentations")
        .update({ status: "ready" })
        .eq("id", manusTask.presentation_id);

      // Get presentation to find user_id
      const { data: presentation } = await supabase
        .from("presentations")
        .select("user_id")
        .eq("id", manusTask.presentation_id)
        .single();

      // Emit success event via WebSocket
      if (presentation) {
        emitPresentationReady(presentation.user_id, manusTask.presentation_id);
      }

      console.log(
        `Successfully processed ${parsedSlides.length} slides for presentation ${manusTask.presentation_id}`
      );

      return NextResponse.json({
        success: true,
        message: "Webhook processed successfully",
        data: {
          slides_count: parsedSlides.length,
        },
      });
    } catch (parseError: any) {
      console.error("Error parsing slides:", parseError);

      // Update presentation status to error
      await supabase
        .from("presentations")
        .update({ status: "error" })
        .eq("id", manusTask.presentation_id);

      return NextResponse.json(
        {
          success: false,
          error: `Failed to parse slides: ${parseError.message}`,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in webhook endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
