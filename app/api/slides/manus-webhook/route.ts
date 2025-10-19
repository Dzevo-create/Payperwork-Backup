// ============================================
// API Route: Manus Webhook (Phase 2 Enhanced)
// POST /api/slides/manus-webhook
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseManusSlidesResponse } from "@/lib/api/slides/slides-parser";
import {
  emitGenerationStatus,
  emitGenerationProgress,
  emitGenerationCompleted,
  emitGenerationError,
  emitThinkingStepUpdate,
  emitThinkingActionAdd,
  emitSlidePreviewUpdate,
  emitPresentationReady,
  emitPresentationError,
} from "@/lib/socket/server";
import crypto from "crypto";

/**
 * POST /api/slides/manus-webhook
 *
 * Handles all Manus API webhook events:
 * - task_started: Emit initial status
 * - task_updated: Emit real-time progress
 * - task_stopped: Process final results
 */
export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();

    // Verify webhook signature
    const webhookSecret = process.env.MANUS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-manus-signature");
      if (!signature) {
        return NextResponse.json({ success: false, error: "Missing signature" }, { status: 401 });
      }

      const body = JSON.stringify(webhookData);
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

      if (signature !== expectedSignature) {
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
      }
    }

    const taskId = webhookData.task_id;
    if (!taskId) {
      return NextResponse.json({ success: false, error: "Missing task_id" }, { status: 400 });
    }

    // Create Supabase admin client
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
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    // Get presentation
    const { data: presentation } = await supabase
      .from("presentations")
      .select("user_id, id")
      .eq("id", manusTask.presentation_id)
      .single();

    if (!presentation) {
      return NextResponse.json({ success: false, error: "Presentation not found" }, { status: 404 });
    }

    const userId = presentation.user_id;
    const presentationId = presentation.id;

    // ========== Handle different event types ==========
    switch (webhookData.event_type) {
      case "task_started":
        return handleTaskStarted(supabase, userId, presentationId, taskId, webhookData);
      case "task_updated":
        return handleTaskUpdated(supabase, userId, presentationId, taskId, webhookData);
      case "task_stopped":
        return handleTaskStopped(supabase, userId, presentationId, taskId, manusTask, webhookData);
      default:
        return NextResponse.json({ success: true, message: "Event acknowledged" });
    }
  } catch (error: any) {
    console.error("Error in webhook endpoint:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// Event Handlers
// ============================================

async function handleTaskStarted(
  supabase: any,
  userId: string,
  presentationId: string,
  taskId: string,
  webhookData: any
) {
  console.log(`Task started: ${taskId}`);

  await supabase.from("manus_tasks").update({ status: "running", webhook_data: webhookData }).eq("task_id", taskId);

  emitGenerationStatus(userId, presentationId, "thinking", "AI is analyzing your request...");
  emitThinkingStepUpdate(userId, {
    id: "step-init",
    title: "Initializing presentation generation",
    status: "running",
    description: "AI is starting to process your request...",
    actions: [],
    startedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: "Task started event processed" });
}

async function handleTaskUpdated(
  supabase: any,
  userId: string,
  presentationId: string,
  taskId: string,
  webhookData: any
) {
  console.log(`Task updated: ${taskId}`);

  // ========== DETAILED LOGGING ==========
  console.log("=== WEBHOOK PAYLOAD ===");
  console.log(JSON.stringify(webhookData, null, 2));
  console.log("======================");

  await supabase.from("manus_tasks").update({ webhook_data: webhookData }).eq("task_id", taskId);

  if (webhookData.thinking_steps) {
    for (const step of webhookData.thinking_steps) {
      emitThinkingStepUpdate(userId, step);
    }
  }

  if (webhookData.thinking_action) {
    const action = webhookData.thinking_action;
    emitThinkingActionAdd(userId, action.step_id, {
      id: action.id,
      type: action.type,
      text: action.text,
      timestamp: action.timestamp,
    });
  }

  if (webhookData.slide_preview) {
    const preview = webhookData.slide_preview;
    emitSlidePreviewUpdate(userId, presentationId, {
      order_index: preview.order_index,
      title: preview.title,
      content: preview.content,
      layout: preview.layout,
    });
  }

  if (webhookData.progress !== undefined) {
    emitGenerationProgress(userId, presentationId, webhookData.progress, webhookData.current_step);
  }

  return NextResponse.json({ success: true, message: "Task updated event processed" });
}

async function handleTaskStopped(
  supabase: any,
  userId: string,
  presentationId: string,
  taskId: string,
  _manusTask: any,
  webhookData: any
) {
  await supabase
    .from("manus_tasks")
    .update({ status: webhookData.stop_reason === "finish" ? "completed" : "failed", webhook_data: webhookData })
    .eq("task_id", taskId);

  if (webhookData.stop_reason !== "finish") {
    await supabase.from("presentations").update({ status: "error" }).eq("id", presentationId);
    emitGenerationStatus(userId, presentationId, "error", "Generation failed");
    emitGenerationError(userId, presentationId, webhookData.stop_reason || "Unknown error");
    emitPresentationError(userId, presentationId, webhookData.stop_reason || "Unknown error");
    return NextResponse.json({ success: true, message: "Task failure recorded" });
  }

  try {
    const parsedSlides = await parseManusSlidesResponse(webhookData);
    const slidesToInsert = parsedSlides.map((slide) => ({ presentation_id: presentationId, ...slide }));

    const { error: slidesError } = await supabase.from("slides").insert(slidesToInsert);
    if (slidesError) throw new Error("Failed to save slides to database");

    await supabase.from("presentations").update({ status: "ready" }).eq("id", presentationId);

    emitGenerationStatus(userId, presentationId, "completed", "Presentation ready!");
    emitGenerationProgress(userId, presentationId, 100, "Completed");
    emitGenerationCompleted(userId, presentationId, parsedSlides.length);
    emitPresentationReady(userId, presentationId);

    return NextResponse.json({ success: true, message: "Webhook processed successfully", data: { slides_count: parsedSlides.length } });
  } catch (parseError: any) {
    await supabase.from("presentations").update({ status: "error" }).eq("id", presentationId);
    emitGenerationError(userId, presentationId, parseError.message, "parsing");
    return NextResponse.json({ success: false, error: `Failed to parse slides: ${parseError.message}` }, { status: 500 });
  }
}
