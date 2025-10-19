/**
 * Slides WebSocket Hook
 *
 * Connects to WebSocket and updates store.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

import { useEffect } from 'react';
import { useSlidesStore } from './useSlidesStore';
import { initializeSocketClient, getSocketClient } from '@/lib/socket/client';
import { WEBSOCKET_EVENTS } from '@/constants/slides';

export function useSlidesSocket(userId: string | null) {
  const addOrUpdateThinkingStep = useSlidesStore((state) => state.addOrUpdateThinkingStep);
  const setLivePreviewSlide = useSlidesStore((state) => state.setLivePreviewSlide);
  const setGenerationStatus = useSlidesStore((state) => state.setGenerationStatus);
  const setFinalPresentation = useSlidesStore((state) => state.setFinalPresentation);

  // NEW: Chat-based workflow actions
  const addMessage = useSlidesStore((state) => state.addMessage);
  const setCurrentTopics = useSlidesStore((state) => state.setCurrentTopics);

  useEffect(() => {
    if (!userId) return;

    const socket = initializeSocketClient(userId);

    // NEW: Listen to topics generated
    socket.on('topics:generated', (data: { topics: string[]; messageId: string }) => {
      console.log('📨 Received topics:generated:', data);

      // Remove thinking message and add topics message
      addMessage({
        id: data.messageId,
        type: 'topics',
        content: data.topics,
        timestamp: new Date().toISOString(),
        approved: false,
      });

      setCurrentTopics(data.topics);
      setGenerationStatus('idle'); // Ready for approval
    });

    // Listen to thinking step updates
    socket.on(WEBSOCKET_EVENTS.THINKING_STEP_UPDATE, (data: any) => {
      addOrUpdateThinkingStep(data.step);
    });

    // Listen to slide preview updates
    socket.on(WEBSOCKET_EVENTS.SLIDE_PREVIEW_UPDATE, (data: any) => {
      setLivePreviewSlide(data.slide);
    });

    // Listen to generation status updates
    socket.on(WEBSOCKET_EVENTS.GENERATION_STATUS, (data: any) => {
      setGenerationStatus(data.status);
    });

    // Listen to generation completed
    socket.on(WEBSOCKET_EVENTS.GENERATION_COMPLETED, async (data: any) => {
      // Fetch final presentation data
      const response = await fetch(`/api/slides/${data.presentationId}`);
      const result = await response.json();

      if (result.success) {
        setFinalPresentation(result.data.presentation, result.data.slides);

        // Add result message
        addMessage({
          id: `msg-${Date.now()}-result`,
          type: 'result',
          content: {
            presentationId: data.presentationId,
            slideCount: result.data.slides.length,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Cleanup
    return () => {
      socket.off('topics:generated');
      socket.off(WEBSOCKET_EVENTS.THINKING_STEP_UPDATE);
      socket.off(WEBSOCKET_EVENTS.SLIDE_PREVIEW_UPDATE);
      socket.off(WEBSOCKET_EVENTS.GENERATION_STATUS);
      socket.off(WEBSOCKET_EVENTS.GENERATION_COMPLETED);
    };
  }, [userId, addOrUpdateThinkingStep, setLivePreviewSlide, setGenerationStatus, setFinalPresentation, addMessage, setCurrentTopics]);

  return { socket: getSocketClient() };
}
