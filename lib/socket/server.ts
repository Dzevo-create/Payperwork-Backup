// ============================================
// Socket.IO Server
// Version: 1.0
// Date: 2025-10-19
// ============================================

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { WEBSOCKET_EVENTS } from "@/constants/slides";
import { logger } from "@/lib/logger";

/**
 * Global Socket.IO server instance
 */
let io: SocketIOServer | null = null;

/**
 * Get Socket.IO server instance
 *
 * @returns Socket.IO server instance or null
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Initialize Socket.IO server
 *
 * @param httpServer - HTTP server instance
 * @returns Socket.IO server instance
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    logger.info("Socket.IO server already initialized");
    return io;
  }

  // Create Socket.IO server
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket",
    transports: ["websocket", "polling"],
  });

  // Connection handler
  io.on(WEBSOCKET_EVENTS.CONNECT, (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Authentication
    socket.on(WEBSOCKET_EVENTS.AUTHENTICATE, (data: { userId: string }) => {
      const { userId } = data;

      if (!userId) {
        socket.disconnect();
        return;
      }

      // Join user-specific room
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} authenticated and joined room`);
    });

    // Disconnect handler
    socket.on(WEBSOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Error handler
    socket.on(WEBSOCKET_EVENTS.ERROR, (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info("Socket.IO server initialized");
  return io;
}

/**
 * Get Socket.IO server instance
 *
 * @returns Socket.IO server instance or null
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Emit event to specific user
 *
 * @param userId - User ID
 * @param event - Event name
 * @param data - Event data
 */
export function emitToUser(userId: string, event: string, data: any): void {
  if (!io) {
    console.warn("Socket.IO server not initialized");
    return;
  }

  io.to(`user:${userId}`).emit(event, data);
  logger.info(`Emitted ${event} to user ${userId}:`, { data });
}

/**
 * Emit presentation_ready event
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 */
export function emitPresentationReady(userId: string, presentationId: string): void {
  emitToUser(userId, WEBSOCKET_EVENTS.PRESENTATION_READY, {
    presentation_id: presentationId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit presentation_error event
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param error - Error message
 */
export function emitPresentationError(userId: string, presentationId: string, error: string): void {
  emitToUser(userId, WEBSOCKET_EVENTS.PRESENTATION_ERROR, {
    presentation_id: presentationId,
    error,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit slide_updated event
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param slideId - Slide ID
 */
export function emitSlideUpdated(userId: string, presentationId: string, slideId: string): void {
  emitToUser(userId, WEBSOCKET_EVENTS.SLIDE_UPDATED, {
    presentation_id: presentationId,
    slide_id: slideId,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// NEW: Phase 2 - Thinking Display Events
// ============================================

/**
 * Emit thinking step update
 *
 * @param userId - User ID
 * @param step - Thinking step data
 */
export function emitThinkingStepUpdate(
  userId: string,
  step: {
    id: string;
    title: string;
    status: "pending" | "running" | "completed" | "failed";
    description?: string;
    actions: any[];
    result?: string;
    startedAt?: string;
    completedAt?: string;
  }
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.THINKING_STEP_UPDATE, {
    step,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit thinking action add
 *
 * @param userId - User ID
 * @param stepId - Thinking step ID
 * @param action - Thinking action data
 */
export function emitThinkingActionAdd(
  userId: string,
  stepId: string,
  action: {
    id: string;
    type: string;
    text: string;
    timestamp?: string;
  }
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.THINKING_ACTION_ADD, {
    stepId,
    action,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// NEW: Phase 2 - Live Preview Events
// ============================================

/**
 * Emit slide preview update
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param slide - Slide data for preview
 */
export function emitSlidePreviewUpdate(
  userId: string,
  presentationId: string,
  slide: {
    id: string;
    order_index: number;
    title: string;
    content: string;
    layout: string;
  }
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.SLIDE_PREVIEW_UPDATE, {
    presentationId,
    slide,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// NEW: Phase 2 - Generation Status Events
// ============================================

/**
 * Emit generation status update
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param status - Generation status
 * @param message - Optional status message
 */
export function emitGenerationStatus(
  userId: string,
  presentationId: string,
  status: "idle" | "thinking" | "generating" | "completed" | "error",
  message?: string
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.GENERATION_STATUS, {
    presentationId,
    status,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit generation progress update
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param progress - Progress percentage (0-100)
 * @param currentStep - Current step description
 */
export function emitGenerationProgress(
  userId: string,
  presentationId: string,
  progress: number,
  currentStep?: string
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.GENERATION_PROGRESS, {
    presentationId,
    progress: Math.min(100, Math.max(0, progress)), // Clamp 0-100
    currentStep,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit generation completed event
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param slidesCount - Number of slides generated
 */
export function emitGenerationCompleted(
  userId: string,
  presentationId: string,
  slidesCount: number
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.GENERATION_COMPLETED, {
    presentationId,
    slidesCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit generation error event
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param error - Error message
 * @param step - Step where error occurred
 */
export function emitGenerationError(
  userId: string,
  presentationId: string,
  error: string,
  step?: string
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.GENERATION_ERROR, {
    presentationId,
    error,
    step,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// NEW: Phase 4 - Topics Generation Events
// ============================================

/**
 * Emit topics generated event
 *
 * @param userId - User ID
 * @param data - Topics data
 */
export function emitTopicsGenerated(
  userId: string,
  data: {
    topics: string[];
    messageId: string;
  }
): void {
  emitToUser(userId, "topics:generated", {
    topics: data.topics,
    messageId: data.messageId,
    timestamp: new Date().toISOString(),
  });

  logger.info(`✅ Emitted topics:generated to user:${userId} with ${data.topics.length} topics`);
}

// ============================================
// NEW: Phase 5 - Tool Use Display Events
// ============================================

/**
 * Emit tool action started event
 *
 * @param userId - User ID
 * @param data - Tool action data
 */
export function emitToolActionStarted(
  userId: string,
  data: {
    toolAction: {
      id: string;
      type: string;
      status: string;
      input: string;
      timestamp: string;
    };
    messageId: string;
  }
): void {
  emitToUser(userId, "tool:action:started", {
    toolAction: data.toolAction,
    messageId: data.messageId,
    timestamp: new Date().toISOString(),
  });

  logger.info(`✅ Emitted tool:action:started to user:${userId} - ${data.toolAction.type}`);
}

/**
 * Emit tool action completed event
 *
 * @param userId - User ID
 * @param data - Tool action data
 */
export function emitToolActionCompleted(
  userId: string,
  data: {
    toolAction: {
      id: string;
      type: string;
      status: string;
      input: string;
      result?: any;
      duration?: number;
      timestamp: string;
    };
    messageId: string;
  }
): void {
  emitToUser(userId, "tool:action:completed", {
    toolAction: data.toolAction,
    messageId: data.messageId,
    timestamp: new Date().toISOString(),
  });

  logger.info(`✅ Emitted tool:action:completed to user:${userId} - ${data.toolAction.type}`);
}

/**
 * Emit tool action failed event
 *
 * @param userId - User ID
 * @param data - Tool action data
 */
export function emitToolActionFailed(
  userId: string,
  data: {
    toolAction: {
      id: string;
      type: string;
      status: string;
      input: string;
      error: string;
      timestamp: string;
    };
    messageId: string;
  }
): void {
  emitToUser(userId, "tool:action:failed", {
    toolAction: data.toolAction,
    messageId: data.messageId,
    timestamp: new Date().toISOString(),
  });

  logger.error(
    `⚠️ Emitted tool:action:failed to user:${userId} - ${data.toolAction.type}: ${data.toolAction.error}`
  );
}

/**
 * Emit thinking message event
 *
 * @param userId - User ID
 * @param data - Thinking message data
 */
export function emitThinkingMessage(
  userId: string,
  data: {
    content: string;
    messageId: string;
  }
): void {
  emitToUser(userId, "thinking:message", {
    content: data.content,
    messageId: data.messageId,
    timestamp: new Date().toISOString(),
  });

  logger.info(`✅ Emitted thinking:message to user:${userId}`);
}
