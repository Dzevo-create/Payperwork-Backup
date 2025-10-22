import { logger } from "@/lib/logger";
/**
 * Socket Emit Helper
 *
 * Emits WebSocket events from API routes via HTTP endpoint
 *
 * This helper allows serverless API routes to emit Socket.IO events
 * by making HTTP requests to the /api/socket/emit endpoint, which
 * has access to the Socket.IO server instance.
 *
 * @author Payperwork Team
 * @date 2025-10-20
 */

const SOCKET_EMIT_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/socket/emit`
  : "http://localhost:3000/api/socket/emit";

/**
 * Emit a Socket.IO event via HTTP
 *
 * @param userId - User ID to emit to
 * @param event - Event name
 * @param data - Event data
 */
export async function emitSocketEvent(userId: string, event: string, data: any): Promise<void> {
  try {
    const response = await fetch(SOCKET_EMIT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        event,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`[Socket Emit] Failed to emit ${event}:`, error);
    } else {
      logger.info(`[Socket Emit] ✅ Successfully emitted ${event} to user:${userId}`);
    }
  } catch (error) {
    console.error(`[Socket Emit] Error emitting ${event}:`, error);
  }
}

// ============================================
// Convenience functions for specific events
// ============================================

/**
 * Emit topics generated event
 */
export async function emitTopicsGenerated(
  userId: string,
  data: {
    topics: any[];
    messageId: string;
  }
): Promise<void> {
  await emitSocketEvent(userId, "topics:generated", data);
}

/**
 * Emit thinking message event
 */
export async function emitThinkingMessage(
  userId: string,
  data: {
    content: string;
    messageId: string;
  }
): Promise<void> {
  await emitSocketEvent(userId, "thinking:message", data);
}

/**
 * Emit slide preview update event
 */
export async function emitSlidePreviewUpdate(
  userId: string,
  presentationId: string,
  slide: {
    id: string;
    order_index: number;
    title: string;
    content: string;
    layout: string;
  }
): Promise<void> {
  await emitSocketEvent(userId, "slide:preview:update", {
    presentationId,
    slide,
  });
}

/**
 * Emit generation completed event
 */
export async function emitGenerationCompleted(
  userId: string,
  presentationId: string,
  slideCount: number
): Promise<void> {
  await emitSocketEvent(userId, "generation:completed", {
    presentationId,
    slideCount,
  });
}

/**
 * Emit generation error event
 */
export async function emitGenerationError(
  userId: string,
  presentationId: string,
  error: string
): Promise<void> {
  await emitSocketEvent(userId, "generation:error", {
    presentationId,
    error,
  });
}
