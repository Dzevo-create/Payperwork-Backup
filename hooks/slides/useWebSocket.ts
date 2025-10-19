// ============================================
// WebSocket Hook
// Version: 1.0
// Date: 2025-10-19
// ============================================

import { useEffect } from "react";
import {
  initializeSocketClient,
  disconnectSocketClient,
  getSocketClient,
} from "@/lib/socket/client";
import { WEBSOCKET_EVENTS } from "@/constants/slides";

/**
 * WebSocket event handlers
 */
interface WebSocketHandlers {
  onPresentationReady?: (data: { presentation_id: string }) => void;
  onPresentationError?: (data: {
    presentation_id: string;
    error: string;
  }) => void;
  onSlideUpdated?: (data: {
    presentation_id: string;
    slide_id: string;
  }) => void;
}

/**
 * WebSocket hook
 *
 * @param userId - User ID for authentication
 * @param handlers - Event handlers
 */
export function useWebSocket(
  userId: string | null,
  handlers: WebSocketHandlers = {}
) {
  const { onPresentationReady, onPresentationError, onSlideUpdated } = handlers;

  // Initialize socket
  useEffect(() => {
    if (!userId) {
      return;
    }

    // Initialize client
    const socket = initializeSocketClient(userId);

    // Register event handlers
    if (onPresentationReady) {
      socket.on(WEBSOCKET_EVENTS.PRESENTATION_READY, onPresentationReady);
    }

    if (onPresentationError) {
      socket.on(WEBSOCKET_EVENTS.PRESENTATION_ERROR, onPresentationError);
    }

    if (onSlideUpdated) {
      socket.on(WEBSOCKET_EVENTS.SLIDE_UPDATED, onSlideUpdated);
    }

    // Cleanup
    return () => {
      if (onPresentationReady) {
        socket.off(WEBSOCKET_EVENTS.PRESENTATION_READY, onPresentationReady);
      }

      if (onPresentationError) {
        socket.off(WEBSOCKET_EVENTS.PRESENTATION_ERROR, onPresentationError);
      }

      if (onSlideUpdated) {
        socket.off(WEBSOCKET_EVENTS.SLIDE_UPDATED, onSlideUpdated);
      }

      // Don't disconnect here, keep connection alive
    };
  }, [userId, onPresentationReady, onPresentationError, onSlideUpdated]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      disconnectSocketClient();
    };
  }, []);

  return {
    socket: getSocketClient(),
  };
}
