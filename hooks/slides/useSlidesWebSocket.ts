// ============================================
// Slides Workflow WebSocket Hook (Phase 2)
// ============================================

import { useEffect } from 'react';
import {
  initializeSocketClient,
  disconnectSocketClient,
  getSocketClient,
} from '@/lib/socket/client';
import { WEBSOCKET_EVENTS } from '@/constants/slides';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { slidesLogger } from '@/lib/logger';
import type {
  ThinkingStep,
  LivePreviewSlide,
  GenerationStatus,
  Presentation,
  Slide,
} from '@/types/slides';

/**
 * Slides Workflow WebSocket Hook
 *
 * Connects to WebSocket and automatically updates the Slides Store
 * based on incoming events from the server.
 *
 * @param userId - User ID for authentication
 * @param presentationId - Current presentation ID (optional)
 */
export function useSlidesWebSocket(
  userId: string | null,
  presentationId?: string | null
) {
  const {
    setGenerationStatus,
    addOrUpdateThinkingStep,
    setLivePreviewSlide,
    setFinalPresentation,
  } = useSlidesStore();

  useEffect(() => {
    if (!userId) {
      slidesLogger.debug('No userId provided, skipping WebSocket connection');
      return;
    }

    slidesLogger.info('Initializing Slides WebSocket connection', {
      userId,
      presentationId: presentationId || 'none',
    });

    // Initialize socket client
    const socket = initializeSocketClient(userId);

    // ============================================
    // Event Handlers
    // ============================================

    /**
     * Handle thinking step updates
     */
    const handleThinkingStepUpdate = (data: {
      presentationId: string;
      step: ThinkingStep;
      timestamp: string;
    }) => {
      slidesLogger.debug('Received thinking step update', {
        presentationId: data.presentationId,
        stepId: data.step.id,
        status: data.step.status,
      });

      // Only update if it's for the current presentation
      if (!presentationId || data.presentationId === presentationId) {
        addOrUpdateThinkingStep(data.step);
      }
    };

    /**
     * Handle slide preview updates
     */
    const handleSlidePreviewUpdate = (data: {
      presentationId: string;
      slide: LivePreviewSlide;
      timestamp: string;
    }) => {
      slidesLogger.debug('Received slide preview update', {
        presentationId: data.presentationId,
        slideId: data.slide.id,
      });

      // Only update if it's for the current presentation
      if (!presentationId || data.presentationId === presentationId) {
        setLivePreviewSlide(data.slide);
      }
    };

    /**
     * Handle generation status updates
     */
    const handleGenerationStatusUpdate = (data: {
      presentationId: string;
      status: GenerationStatus;
      timestamp: string;
    }) => {
      slidesLogger.debug('Received generation status update', {
        presentationId: data.presentationId,
        status: data.status,
      });

      // Only update if it's for the current presentation
      if (!presentationId || data.presentationId === presentationId) {
        setGenerationStatus(data.status);
      }
    };

    /**
     * Handle generation errors
     */
    const handleGenerationError = (data: {
      presentationId: string;
      error: string;
      timestamp: string;
    }) => {
      slidesLogger.error('Received generation error', undefined, {
        presentationId: data.presentationId,
        error: data.error,
      });

      // Only update if it's for the current presentation
      if (!presentationId || data.presentationId === presentationId) {
        setGenerationStatus('error');
        // TODO: Show error toast notification
      }
    };

    /**
     * Handle generation completed
     */
    const handleGenerationCompleted = (data: {
      presentationId: string;
      presentation: Presentation;
      slides: Slide[];
      timestamp: string;
    }) => {
      slidesLogger.info('Received generation completed', {
        presentationId: data.presentationId,
        slidesCount: data.slides.length,
      });

      // Only update if it's for the current presentation
      if (!presentationId || data.presentationId === presentationId) {
        setFinalPresentation(data.presentation, data.slides);
        setGenerationStatus('completed');
      }
    };

    // ============================================
    // Register Event Listeners
    // ============================================

    socket.on(WEBSOCKET_EVENTS.THINKING_STEP_UPDATE, handleThinkingStepUpdate);
    socket.on(WEBSOCKET_EVENTS.SLIDE_PREVIEW_UPDATE, handleSlidePreviewUpdate);
    socket.on(
      WEBSOCKET_EVENTS.GENERATION_STATUS_UPDATE,
      handleGenerationStatusUpdate
    );
    socket.on(WEBSOCKET_EVENTS.GENERATION_ERROR, handleGenerationError);
    socket.on(WEBSOCKET_EVENTS.GENERATION_COMPLETED, handleGenerationCompleted);

    slidesLogger.info('Slides WebSocket event listeners registered');

    // ============================================
    // Cleanup
    // ============================================

    return () => {
      slidesLogger.debug('Cleaning up Slides WebSocket listeners');

      socket.off(WEBSOCKET_EVENTS.THINKING_STEP_UPDATE, handleThinkingStepUpdate);
      socket.off(WEBSOCKET_EVENTS.SLIDE_PREVIEW_UPDATE, handleSlidePreviewUpdate);
      socket.off(
        WEBSOCKET_EVENTS.GENERATION_STATUS_UPDATE,
        handleGenerationStatusUpdate
      );
      socket.off(WEBSOCKET_EVENTS.GENERATION_ERROR, handleGenerationError);
      socket.off(
        WEBSOCKET_EVENTS.GENERATION_COMPLETED,
        handleGenerationCompleted
      );
    };
  }, [
    userId,
    presentationId,
    setGenerationStatus,
    addOrUpdateThinkingStep,
    setLivePreviewSlide,
    setFinalPresentation,
  ]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      slidesLogger.debug('Component unmounting, disconnecting WebSocket');
      disconnectSocketClient();
    };
  }, []);

  return {
    socket: getSocketClient(),
  };
}
