// ============================================
// Socket.IO Client
// Version: 1.0
// Date: 2025-10-19
// ============================================

import { io, Socket } from "socket.io-client";
import { WEBSOCKET_EVENTS } from "@/constants/slides";
import { logger } from "@/lib/logger";

/**
 * Global Socket.IO client instance
 */
let socket: Socket | null = null;

/**
 * Initialize Socket.IO client
 *
 * @param userId - User ID for authentication
 * @returns Socket.IO client instance
 */
export function initializeSocketClient(userId: string): Socket {
  if (socket && socket.connected) {
    logger.info("Socket.IO client already connected");
    return socket;
  }

  // Create Socket.IO client
  const socketUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  socket = io(socketUrl, {
    path: "/api/socket",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Connection handler
  socket.on(WEBSOCKET_EVENTS.CONNECT, () => {
    logger.info("Socket.IO client connected");

    // Authenticate
    socket?.emit(WEBSOCKET_EVENTS.AUTHENTICATE, { userId });
  });

  // Disconnect handler
  socket.on(WEBSOCKET_EVENTS.DISCONNECT, () => {
    logger.info("Socket.IO client disconnected");
  });

  // Error handler
  socket.on(WEBSOCKET_EVENTS.ERROR, (error) => {
    console.error("Socket.IO client error:", error);
  });

  return socket;
}

/**
 * Get Socket.IO client instance
 *
 * @returns Socket.IO client instance or null
 */
export function getSocketClient(): Socket | null {
  return socket;
}

/**
 * Disconnect Socket.IO client
 */
export function disconnectSocketClient(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    logger.info("Socket.IO client disconnected");
  }
}
