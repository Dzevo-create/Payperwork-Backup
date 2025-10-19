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
  emitTopicsGenerated,
  emitToolActionStarted,
  emitToolActionCompleted,
  emitToolActionFailed,
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

    const taskType = manusTask.task_type;
    const userId = manusTask.user_id;

    // ========== Route based on task type ==========
    if (taskType === "generate_topics") {
      // Handle topics generation events
      switch (webhookData.event_type) {
        case "task_started":
          return handleTopicsTaskStarted(supabase, userId, taskId, webhookData);
        case "task_updated":
          return handleTopicsTaskUpdated(supabase, userId, taskId, webhookData);
        case "task_stopped":
          return handleTopicsTaskStopped(supabase, userId, taskId, manusTask, webhookData);
        default:
          return NextResponse.json({ success: true, message: "Event acknowledged" });
      }
    } else if (taskType === "generate_slides") {
      // Handle slides generation events (existing logic)
      // Get presentation
      const { data: presentation } = await supabase
        .from("presentations")
        .select("user_id, id")
        .eq("id", manusTask.presentation_id)
        .single();

      if (!presentation) {
        return NextResponse.json({ success: false, error: "Presentation not found" }, { status: 404 });
      }

      const presentationId = presentation.id;

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
    } else {
      return NextResponse.json({ success: false, error: "Unknown task type" }, { status: 400 });
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

  // NEW: Phase 1 - Tool Use Display - Emit tool action events
  if (webhookData.thinking_action) {
    const action = webhookData.thinking_action;

    // Keep existing thinking action emit for compatibility
    emitThinkingActionAdd(userId, action.step_id, {
      id: action.id,
      type: action.type,
      text: action.text,
      timestamp: action.timestamp,
    });

    // NEW: Emit tool action events for tool use display
    // Detect if this is a tool use action (search, browse, python)
    const toolTypes = ['search', 'browse', 'python', 'bash', 'file'];
    if (toolTypes.includes(action.type?.toLowerCase())) {
      const messageId = `tool-${action.id}`;

      // Determine status based on action data
      if (action.error) {
        emitToolActionFailed(userId, {
          toolAction: {
            id: action.id,
            type: action.type.toLowerCase(),
            status: 'failed',
            input: action.text || action.input || '',
            error: action.error,
            timestamp: action.timestamp || new Date().toISOString(),
          },
          messageId,
        });
      } else if (action.result || action.output) {
        emitToolActionCompleted(userId, {
          toolAction: {
            id: action.id,
            type: action.type.toLowerCase(),
            status: 'completed',
            input: action.text || action.input || '',
            result: action.result || action.output,
            duration: action.duration,
            timestamp: action.timestamp || new Date().toISOString(),
          },
          messageId,
        });
      } else {
        emitToolActionStarted(userId, {
          toolAction: {
            id: action.id,
            type: action.type.toLowerCase(),
            status: 'running',
            input: action.text || action.input || '',
            timestamp: action.timestamp || new Date().toISOString(),
          },
          messageId,
        });
      }
    }
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

// ============================================
// Topics Event Handlers
// ============================================

async function handleTopicsTaskStarted(
  supabase: any,
  userId: string,
  taskId: string,
  webhookData: any
) {
  console.log(`Topics task started: ${taskId}`);

  await supabase
    .from("manus_tasks")
    .update({ status: "running", webhook_data: webhookData })
    .eq("task_id", taskId);

  emitGenerationStatus(userId, {
    status: "thinking",
    message: "AI analysiert dein Thema...",
  });

  emitThinkingStepUpdate(userId, {
    id: "step-init",
    title: "Themen-Analyse gestartet",
    status: "running",
    description: "AI beginnt mit der Analyse deines Themas...",
    actions: [],
    startedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: "Topics task started event processed" });
}

async function handleTopicsTaskUpdated(
  supabase: any,
  userId: string,
  taskId: string,
  webhookData: any
) {
  console.log(`Topics task updated: ${taskId}`);

  // ========== DETAILED LOGGING ==========
  console.log("=== TOPICS WEBHOOK PAYLOAD ===");
  console.log(JSON.stringify(webhookData, null, 2));
  console.log("==============================");

  await supabase
    .from("manus_tasks")
    .update({ webhook_data: webhookData })
    .eq("task_id", taskId);

  // Emit thinking steps
  if (webhookData.thinking_steps) {
    for (const step of webhookData.thinking_steps) {
      emitThinkingStepUpdate(userId, step);
    }
  }

  // Emit tool use (search, browse, python)
  // NEW: Phase 1 - Tool Use Display - Emit tool action events
  if (webhookData.thinking_action) {
    const action = webhookData.thinking_action;

    // Keep existing thinking action emit for compatibility
    emitThinkingActionAdd(userId, action.step_id, {
      id: action.id,
      type: action.type,
      text: action.text,
      timestamp: action.timestamp,
    });

    // NEW: Emit tool action events for tool use display
    // Detect if this is a tool use action (search, browse, python)
    const toolTypes = ['search', 'browse', 'python', 'bash', 'file'];
    if (toolTypes.includes(action.type?.toLowerCase())) {
      const messageId = `tool-${action.id}`;

      // Determine status based on action data
      if (action.error) {
        emitToolActionFailed(userId, {
          toolAction: {
            id: action.id,
            type: action.type.toLowerCase(),
            status: 'failed',
            input: action.text || action.input || '',
            error: action.error,
            timestamp: action.timestamp || new Date().toISOString(),
          },
          messageId,
        });
      } else if (action.result || action.output) {
        emitToolActionCompleted(userId, {
          toolAction: {
            id: action.id,
            type: action.type.toLowerCase(),
            status: 'completed',
            input: action.text || action.input || '',
            result: action.result || action.output,
            duration: action.duration,
            timestamp: action.timestamp || new Date().toISOString(),
          },
          messageId,
        });
      } else {
        emitToolActionStarted(userId, {
          toolAction: {
            id: action.id,
            type: action.type.toLowerCase(),
            status: 'running',
            input: action.text || action.input || '',
            timestamp: action.timestamp || new Date().toISOString(),
          },
          messageId,
        });
      }
    }
  }

  // Emit progress updates
  if (webhookData.progress !== undefined) {
    emitGenerationStatus(userId, {
      status: "thinking",
      message: webhookData.current_step || "Analysiere Thema...",
    });
  }

  return NextResponse.json({ success: true, message: "Topics task updated event processed" });
}

async function handleTopicsTaskStopped(
  supabase: any,
  userId: string,
  taskId: string,
  manusTask: any,
  webhookData: any
) {
  console.log(`Topics task stopped: ${taskId}`);

  // Update task status
  await supabase
    .from("manus_tasks")
    .update({
      status: webhookData.stop_reason === "finish" ? "completed" : "failed",
      webhook_data: webhookData,
      completed_at: new Date().toISOString(),
    })
    .eq("task_id", taskId);

  // Handle failure
  if (webhookData.stop_reason !== "finish") {
    console.error("Topics generation failed:", webhookData.stop_reason);
    emitGenerationStatus(userId, {
      status: "error",
      message: "Themen-Generierung fehlgeschlagen",
    });
    emitGenerationError(userId, null, webhookData.stop_reason || "Unknown error");
    return NextResponse.json({ success: true, message: "Topics task failure recorded" });
  }

  // Parse topics from output
  try {
    let topics: string[] = [];

    // Try to extract topics from webhook data
    if (webhookData.output) {
      const outputStr = typeof webhookData.output === "string"
        ? webhookData.output
        : JSON.stringify(webhookData.output);

      // Try to extract JSON array from output
      const jsonMatch = outputStr.match(/\[\s*"[^"]+"\s*(?:,\s*"[^"]+"\s*)*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines and clean
        topics = outputStr
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && line.length <= 100)
          .slice(0, 10);
      }
    }

    // Validate: exactly 10 topics
    if (topics.length === 0 || topics.length !== 10) {
      console.warn(`Invalid topics count: ${topics.length}, using fallback`);
      topics = [
        "Einführung",
        "Hintergrund",
        "Hauptkonzepte",
        "Wichtige Merkmale",
        "Anwendungsfälle",
        "Vorteile",
        "Herausforderungen",
        "Best Practices",
        "Zukunftstrends",
        "Zusammenfassung",
      ];
    }

    // Store topics in database
    await supabase
      .from("manus_tasks")
      .update({ output: { topics } })
      .eq("task_id", taskId);

    // Emit topics via WebSocket
    const messageId = `msg-${Date.now()}-topics`;
    emitTopicsGenerated(userId, {
      topics,
      messageId,
    });

    console.log("✅ Topics generated and emitted:", topics.length);

    return NextResponse.json({
      success: true,
      message: "Topics generated successfully",
      data: { topics_count: topics.length },
    });
  } catch (parseError: any) {
    console.error("Error parsing topics:", parseError);

    // Update task with error
    await supabase
      .from("manus_tasks")
      .update({
        status: "failed",
        error: parseError.message,
      })
      .eq("task_id", taskId);

    emitGenerationError(userId, null, parseError.message, "parsing");
    return NextResponse.json(
      { success: false, error: `Failed to parse topics: ${parseError.message}` },
      { status: 500 }
    );
  }
}
