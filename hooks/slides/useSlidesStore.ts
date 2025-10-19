/**
 * Slides Workflow Store (Refactored)
 *
 * Main store that combines all slides-related slices:
 * - Presentation Slice: Presentations, status, generation
 * - Workflow Slice: Messages, topics, settings
 * - Agent Slice: Agent system (Manus AI)
 * - Tool Slice: Tool history, computer panel
 *
 * Pattern: Modular Zustand store with slice composition
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @refactored 2025-10-19 (655 lines → 4 slices ~150 lines each)
 */

import { create } from 'zustand';
import { slidesLogger } from '@/lib/logger';

// Import slices
import {
  PresentationSlice,
  createPresentationSlice,
} from './slices/presentationSlice';
import { WorkflowSlice, createWorkflowSlice } from './slices/workflowSlice';
import { AgentSlice, createAgentSlice } from './slices/agentSlice';
import { ToolSlice, createToolSlice } from './slices/toolSlice';

// ============================================
// Combined Store Type
// ============================================

export type SlidesStore = PresentationSlice &
  WorkflowSlice &
  AgentSlice &
  ToolSlice & {
    // Reset workflow (combines all slices)
    resetWorkflow: () => void;
  };

// ============================================
// Store Implementation
// ============================================

export const useSlidesStore = create<SlidesStore>()((set, get, api) => ({
  // Combine all slices
  ...createPresentationSlice(set, get, api),
  ...createWorkflowSlice(set, get, api),
  ...createAgentSlice(set, get, api),
  ...createToolSlice(set, get, api),

  // Global reset
  resetWorkflow: () => {
    slidesLogger.debug('Resetting workflow', {
      action: 'resetWorkflow',
    });

    // Reset presentation state
    set({
      currentPresentationId: null,
      generationStatus: 'idle',
      thinkingSteps: [],
      livePreviewSlide: null,
      finalPresentation: null,
      finalSlides: [],
      slides: [],
    });

    // Reset workflow state
    set({
      messages: [],
      currentTopics: [],
      topicsApproved: false,
      showPreview: false,
      currentPrompt: '',
    });

    // Reset tool state
    set({
      toolHistory: [],
      showComputerPanel: false,
    });

    // Reset agent state
    get().resetAgentState();
  },
}));

// ============================================
// Convenience Selectors
// ============================================

/**
 * Get the current presentation object (if any)
 */
export const useCurrentPresentation = () =>
  useSlidesStore((state) => {
    const currentId = state.currentPresentationId;
    if (!currentId) return null;
    return state.presentations.find((p) => p.id === currentId) || null;
  });

/**
 * Check if workflow is currently generating
 */
export const useIsGenerating = () =>
  useSlidesStore(
    (state) =>
      state.generationStatus === 'thinking' ||
      state.generationStatus === 'generating'
  );

/**
 * Get the number of presentations
 */
export const usePresentationsCount = () =>
  useSlidesStore((state) => state.presentations.length);

/**
 * Get current agent status
 */
export const useCurrentAgentStatus = () =>
  useSlidesStore((state) => {
    const currentAgent = state.currentAgent;
    if (!currentAgent) return null;
    return state.agentStatus[currentAgent];
  });

/**
 * Get pipeline progress percentage
 */
export const usePipelineProgressPercent = () =>
  useSlidesStore((state) => state.pipelineProgress.overallProgress);
