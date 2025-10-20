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

  // NEW: Agent System actions
  const updateAgentStatus = useSlidesStore((state) => state.updateAgentStatus);
  const setCurrentAgent = useSlidesStore((state) => state.setCurrentAgent);
  const addAgentInsight = useSlidesStore((state) => state.addAgentInsight);
  const addResearchSource = useSlidesStore((state) => state.addResearchSource);
  const updatePipelineProgress = useSlidesStore((state) => state.updatePipelineProgress);

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

    // Pipeline Research Events
    socket.on('agent:thinking:step', (data: {
      agent: string;
      step: string;
      content: string;
      messageId: string
    }) => {
      console.log(`🤖 ${data.agent} - ${data.step}:`, data.content);

      addMessage({
        id: data.messageId,
        type: 'thinking',
        content: `[${data.agent}] ${data.content}`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('research:started', (data: { topic: string; depth: string }) => {
      console.log('🔍 Research started:', data.topic);

      addMessage({
        id: `research-start-${Date.now()}`,
        type: 'thinking',
        content: `Researching "${data.topic}" (${data.depth} depth)...`,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('research:completed', (data: { sourceCount: number; findingCount: number }) => {
      console.log('✅ Research completed:', data);

      addMessage({
        id: `research-done-${Date.now()}`,
        type: 'thinking',
        content: `Research completed: ${data.sourceCount} sources analyzed, ${data.findingCount} key findings`,
        timestamp: new Date().toISOString(),
      });
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

    // ============================================
    // NEW: Agent System Event Listeners
    // ============================================

    // Agent: Status Change
    socket.on('agent:status:change', (data: any) => {
      console.log(`🤖 Agent status: ${data.agent} → ${data.status}`);
      updateAgentStatus(data.agent, {
        status: data.status,
        currentAction: data.currentAction,
        progress: data.progress,
      });
      if (data.status === 'working') {
        setCurrentAgent(data.agent);
      } else if (data.status === 'completed' || data.status === 'error') {
        setCurrentAgent(null);
      }
    });

    // Agent: Thinking Step
    socket.on('agent:thinking:step', (data: any) => {
      console.log(`💭 ${data.agent}: ${data.content}`);
      addMessage({
        id: data.messageId,
        type: 'agent_thinking',
        content: data.content,
        timestamp: data.timestamp,
      });
    });

    // Agent: Action Update
    socket.on('agent:action:update', (data: any) => {
      console.log(`⚡ ${data.agent} action: ${data.action} (${data.status})`);
      updateAgentStatus(data.agent, {
        currentAction: data.action,
        progress: data.data?.progress,
      });
    });

    // Agent: Insight Generated
    socket.on('agent:insight:generated', (data: any) => {
      console.log(`💡 ${data.agent} insight: ${data.insight} (${data.confidence}%)`);
      addAgentInsight({
        agent: data.agent,
        insight: data.insight,
        confidence: data.confidence,
        timestamp: data.timestamp,
      });
      addMessage({
        id: data.messageId,
        type: 'agent_insight',
        content: data.insight,
        timestamp: data.timestamp,
      });
    });

    // Agent: Research Source Found
    socket.on('agent:source:found', (data: any) => {
      console.log(`🔍 Research source: ${data.source.title} (${data.source.relevance * 100}%)`);
      addResearchSource({
        title: data.source.title,
        url: data.source.url,
        snippet: data.source.snippet,
        relevance: data.source.relevance,
        timestamp: data.timestamp,
      });
      addMessage({
        id: data.messageId,
        type: 'research_source',
        content: data.source,
        timestamp: data.timestamp,
      });
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
      socket.off(WEBSOCKET_EVENTS.GENERATION_STATUS);
      socket.off(WEBSOCKET_EVENTS.GENERATION_COMPLETED);
      // Agent events cleanup
      socket.off('agent:status:change');
      socket.off('agent:thinking:step');
      socket.off('agent:action:update');
      socket.off('agent:insight:generated');
      socket.off('agent:source:found');
      // Pipeline research events cleanup
      socket.off('research:started');
      socket.off('research:completed');
    };
  }, [userId, addOrUpdateThinkingStep, setLivePreviewSlide, setGenerationStatus, setFinalPresentation, addMessage, setCurrentTopics, addToolAction, addSlidePreview, updateAgentStatus, setCurrentAgent, addAgentInsight, addResearchSource, updatePipelineProgress]);

  return { socket: getSocketClient() };
}
