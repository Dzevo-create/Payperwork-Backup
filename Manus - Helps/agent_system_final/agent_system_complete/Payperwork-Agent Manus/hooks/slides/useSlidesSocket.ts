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
import { Topic, Slide } from '@/types/slides';

export function useSlidesSocket(userId: string | null) {
  const addOrUpdateThinkingStep = useSlidesStore((state) => state.addOrUpdateThinkingStep);
  const setLivePreviewSlide = useSlidesStore((state) => state.setLivePreviewSlide);
  const setGenerationStatus = useSlidesStore((state) => state.setGenerationStatus);
  const setFinalPresentation = useSlidesStore((state) => state.setFinalPresentation);

  // NEW: Chat-based workflow actions
  const addMessage = useSlidesStore((state) => state.addMessage);
  const setCurrentTopics = useSlidesStore((state) => state.setCurrentTopics);

  // NEW: Phase 2 - Computer Panel actions
  const addToolAction = useSlidesStore((state) => state.addToolAction);

  // NEW: Live slides for Computer Panel
  const addSlidePreview = useSlidesStore((state) => state.addSlidePreview);

  // NEW: Agent Events
  const updateAgentStatus = useSlidesStore((state) => state.updateAgentStatus);
  const addAgentThinking = useSlidesStore((state) => state.addAgentThinking);
  const addResearchSource = useSlidesStore((state) => state.addResearchSource);

  useEffect(() => {
    if (!userId) return;

    const socket = initializeSocketClient(userId);

    // NEW: Listen to topics generated
    socket.on('topics:generated', (data: { topics: Topic[]; messageId: string }) => {
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

    // Listen to thinking messages
    socket.on('thinking:message', (data: { content: string; messageId: string }) => {
      console.log('💭 Received thinking:message:', data.content);

      addMessage({
        id: data.messageId,
        type: 'thinking',
        content: data.content,
        timestamp: new Date().toISOString(),
      });
    });

    // NEW: Listen to slide preview updates (individual slides during generation)
    socket.on('slide:preview:update', (data: { slide: Slide; presentationId: string }) => {
      console.log('📨 Received slide:preview:update:', data.slide.title);

      // Add slide to slides array (for Computer Panel)
      addSlidePreview(data.slide);

      // Also update live preview slide (for main preview)
      setLivePreviewSlide({
        id: data.slide.id,
        order_index: data.slide.order_index,
        title: data.slide.title,
        content: data.slide.content,
        layout: data.slide.layout || 'title_content',
      });
    });

    // NEW: Phase 1 - Tool Use Display - Listen to tool action events
    socket.on('tool:action:started', (data: { toolAction: any; messageId: string }) => {
      console.log('🔧 Tool action started:', data.toolAction.type);

      // Add to message list (inline display)
      addMessage({
        id: data.messageId,
        type: 'tool_action',
        content: data.toolAction,
        timestamp: new Date().toISOString(),
      });

      // NEW: Phase 2 - Also add to tool history (Computer Panel)
      addToolAction(data.toolAction);
    });

    // NEW: Agent Thinking Steps
    socket.on('agent:thinking:step', (data: {
      agent: string;
      content: string;
      messageId: string;
      timestamp: string;
    }) => {
      console.log(`🤖 ${data.agent} thinking:`, data.content);

      // Add as message
      addMessage({
        id: data.messageId,
        type: 'agent_thinking',
        content: {
          agent: data.agent,
          message: data.content,
        },
        timestamp: data.timestamp,
      });

      // Update agent status
      if (updateAgentStatus) {
        updateAgentStatus(data.agent, 'thinking');
      }
    });

    // NEW: Agent Action Updates
    socket.on('agent:action:update', (data: {
      agent: string;
      action: string;
      status: 'started' | 'progress' | 'completed' | 'failed';
      data?: any;
      timestamp: string;
    }) => {
      console.log(`🚀 ${data.agent} ${data.status} ${data.action}`);

      // Update agent status
      if (updateAgentStatus) {
        const statusMap = {
          started: 'working',
          progress: 'working',
          completed: 'completed',
          failed: 'error',
        };
        updateAgentStatus(data.agent, statusMap[data.status] as any);
      }
    });

    // NEW: Agent Status Change
    socket.on('agent:status:change', (data: {
      agent: string;
      status: string;
      currentAction?: string;
      progress?: number;
      timestamp: string;
    }) => {
      console.log(`📊 ${data.agent} status: ${data.status}`);

      // Update agent status
      if (updateAgentStatus) {
        updateAgentStatus(data.agent, data.status as any, data.currentAction as any, data.progress);
      }
    });

    // NEW: Research Source Found
    socket.on('agent:source:found', (data: {
      agent: string;
      source: {
        title: string;
        url: string;
        snippet: string;
        relevance: number;
      };
      messageId: string;
      timestamp: string;
    }) => {
      console.log(`🔍 ${data.agent} found source:`, data.source.title);

      // Add as message
      addMessage({
        id: data.messageId,
        type: 'research_source',
        content: data.source,
        timestamp: data.timestamp,
      });

      // Add to research sources list
      if (addResearchSource) {
        addResearchSource(data.source);
      }
    });

    // NEW: Agent Insight
    socket.on('agent:insight:generated', (data: {
      agent: string;
      insight: string;
      confidence: number;
      messageId: string;
      timestamp: string;
    }) => {
      console.log(`💡 ${data.agent} insight (${data.confidence}%):`, data.insight);

      // Add as message
      addMessage({
        id: data.messageId,
        type: 'agent_insight',
        content: {
          agent: data.agent,
          insight: data.insight,
          confidence: data.confidence,
        },
        timestamp: data.timestamp,
      });
    });

    socket.on('tool:action:completed', (data: { toolAction: any; messageId: string }) => {
      console.log('✅ Tool action completed:', data.toolAction.type);

      // Update existing message
      addMessage({
        id: data.messageId,
        type: 'tool_action',
        content: data.toolAction,
        timestamp: new Date().toISOString(),
      });

      // NEW: Phase 2 - Update tool history
      addToolAction(data.toolAction);
    });

    socket.on('tool:action:failed', (data: { toolAction: any; messageId: string }) => {
      console.log('❌ Tool action failed:', data.toolAction.type, data.toolAction.error);

      // Update existing message with error
      addMessage({
        id: data.messageId,
        type: 'tool_action',
        content: data.toolAction,
        timestamp: new Date().toISOString(),
      });

      // NEW: Phase 2 - Update tool history
      addToolAction(data.toolAction);
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
      socket.off('thinking:message');
      socket.off('slide:preview:update');
      socket.off('tool:action:started');
      socket.off('tool:action:completed');
      socket.off('tool:action:failed');
      socket.off(WEBSOCKET_EVENTS.THINKING_STEP_UPDATE);
      socket.off(WEBSOCKET_EVENTS.SLIDE_PREVIEW_UPDATE);
      socket.off(WEBSOCKET_EVENTS.GENERATION_STATUS);
      socket.off(WEBSOCKET_EVENTS.GENERATION_COMPLETED);
    };
  }, [userId, addOrUpdateThinkingStep, setLivePreviewSlide, setGenerationStatus, setFinalPresentation, addMessage, setCurrentTopics, addToolAction, addSlidePreview]);

  return { socket: getSocketClient() };
}
