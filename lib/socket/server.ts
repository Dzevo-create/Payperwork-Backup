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
