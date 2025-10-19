// ============================================
// Socket.IO Server
// Version: 1.0
// Date: 2025-10-19
// ============================================

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { WEBSOCKET_EVENTS } from "@/constants/slides";

/**
 * Global Socket.IO server instance
 */
let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 *
 * @param httpServer - HTTP server instance
 * @returns Socket.IO server instance
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    console.log("Socket.IO server already initialized");
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
    console.log(`Client connected: ${socket.id}`);

    // Authentication
    socket.on(WEBSOCKET_EVENTS.AUTHENTICATE, (data: { userId: string }) => {
      const { userId } = data;

      if (!userId) {
        socket.disconnect();
        return;
      }

      // Join user-specific room
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated and joined room`);
    });

    // Disconnect handler
    socket.on(WEBSOCKET_EVENTS.DISCONNECT, () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    // Error handler
    socket.on(WEBSOCKET_EVENTS.ERROR, (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log("Socket.IO server initialized");
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
  console.log(`Emitted ${event} to user ${userId}:`, data);
}

/**
 * Emit presentation_ready event
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 */
export function emitPresentationReady(
  userId: string,
  presentationId: string
): void {
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
export function emitPresentationError(
  userId: string,
  presentationId: string,
  error: string
): void {
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
export function emitSlideUpdated(
  userId: string,
  presentationId: string,
  slideId: string
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.SLIDE_UPDATED, {
    presentation_id: presentationId,
    slide_id: slideId,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// New Workflow Events (Phase 2)
// ============================================

/**
 * Emit thinking step update
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param step - Thinking step data
 */
export function emitThinkingStepUpdate(
  userId: string,
  presentationId: string,
  step: any
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.THINKING_STEP_UPDATE, {
    presentationId,
    step,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit slide preview update
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param slide - Preview slide data
 */
export function emitSlidePreviewUpdate(
  userId: string,
  presentationId: string,
  slide: any
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.SLIDE_PREVIEW_UPDATE, {
    presentationId,
    slide,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit generation status update
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param status - Generation status
 */
export function emitGenerationStatusUpdate(
  userId: string,
  presentationId: string,
  status: string
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.GENERATION_STATUS_UPDATE, {
    presentationId,
    status,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit generation error
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param error - Error message
 */
export function emitGenerationError(
  userId: string,
  presentationId: string,
  error: string
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.GENERATION_ERROR, {
    presentationId,
    error,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit generation completed
 *
 * @param userId - User ID
 * @param presentationId - Presentation ID
 * @param presentation - Final presentation data
 * @param slides - Final slides data
 */
export function emitGenerationCompleted(
  userId: string,
  presentationId: string,
  presentation: any,
  slides: any[]
): void {
  emitToUser(userId, WEBSOCKET_EVENTS.GENERATION_COMPLETED, {
    presentationId,
    presentation,
    slides,
    timestamp: new Date().toISOString(),
  });
}
