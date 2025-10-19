/**
 * Slides Workflow Store
 *
 * Manages the state for the Slides workflow, including:
 * - Thinking Display state (step-by-step AI reasoning)
 * - Live Preview state (real-time slide previews)
 * - Generation status (workflow progress)
 * - Presentations list (for sidebar)
 *
 * Pattern: Follows the same Zustand pattern as other stores in the app
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 1: Foundation & Type System
 */

import { create } from 'zustand';
import {
  Presentation,
  Slide,
  ThinkingStep,
  GenerationStatus,
  LivePreviewSlide,
  SlidesMessage,
  PresentationFormat,
  PresentationTheme,
  ToolAction,
  Topic,
  AgentType,
  AgentState,
  AgentInsight,
  ResearchSource,
  PipelineProgress,
} from '@/types/slides';
import { slidesLogger } from '@/lib/logger';

// ============================================
// Store Interface
// ============================================

interface SlidesStore {
  // ========== State ==========

  // Presentations List (for sidebar)
  presentations: Presentation[];

  // Current Workflow State
  currentPresentationId: string | null;
  generationStatus: GenerationStatus;

  // Thinking Display State
  thinkingSteps: ThinkingStep[];

  // Live Preview State
  livePreviewSlide: LivePreviewSlide | null;

  // Final Result
  finalPresentation: Presentation | null;
  finalSlides: Slide[];

  // Live Slides (for Computer Panel - during generation)
  slides: Slide[];

  // ========== NEW: Chat-based Workflow State ==========

  // Messages (Chat history)
  messages: SlidesMessage[];

  // Topics State
  currentTopics: Topic[];
  topicsApproved: boolean;

  // Preview Panel Visibility
  showPreview: boolean;

  // Settings
  format: PresentationFormat;
  theme: PresentationTheme;
  currentPrompt: string;

  // ========== NEW: Phase 2 - Computer Panel State ==========

  // Tool History (for Computer Panel)
  toolHistory: ToolAction[];

  // Computer Panel Visibility
  showComputerPanel: boolean;

  // ========== NEW: Agent System State (Manus AI) ==========

  // Agent Status (all 6 agents)
  agentStatus: Record<AgentType, AgentState>;

  // Current Active Agent
  currentAgent: AgentType | null;

  // Agent Insights
  agentInsights: AgentInsight[];

  // Research Sources
  researchSources: ResearchSource[];

  // Pipeline Progress
  pipelineProgress: PipelineProgress;

  // ========== Actions ==========

  // Presentations Management
  setPresentations: (presentations: Presentation[]) => void;
  addPresentation: (presentation: Presentation) => void;
  updatePresentation: (id: string, updates: Partial<Presentation>) => void;
  deletePresentation: (id: string) => void;

  // Current Workflow
  setCurrentPresentationId: (id: string | null) => void;
  setGenerationStatus: (status: GenerationStatus) => void;

  // Thinking Display
  setThinkingSteps: (steps: ThinkingStep[]) => void;
  addOrUpdateThinkingStep: (step: ThinkingStep) => void;
  clearThinkingSteps: () => void;

  // Live Preview
  setLivePreviewSlide: (slide: LivePreviewSlide | null) => void;

  // Final Result
  setFinalPresentation: (presentation: Presentation, slides: Slide[]) => void;

  // Live Slides Management
  addSlidePreview: (slide: Slide) => void;
  clearSlides: () => void;

  // ========== NEW: Chat-based Workflow Actions ==========

  // Messages Management
  addMessage: (message: SlidesMessage) => void;
  updateMessage: (id: string, updates: Partial<SlidesMessage>) => void;
  clearMessages: () => void;

  // Topics Management
  setCurrentTopics: (topics: Topic[]) => void;
  setTopicsApproved: (approved: boolean) => void;

  // Preview Panel
  setShowPreview: (show: boolean) => void;

  // Settings
  setFormat: (format: PresentationFormat) => void;
  setTheme: (theme: PresentationTheme) => void;
  setCurrentPrompt: (prompt: string) => void;

  // ========== NEW: Phase 2 - Computer Panel Actions ==========

  // Tool History Management
  addToolAction: (action: ToolAction) => void;
  updateToolAction: (id: string, updates: Partial<ToolAction>) => void;
  clearToolHistory: () => void;

  // Computer Panel
  setShowComputerPanel: (show: boolean) => void;
  toggleComputerPanel: () => void;

  // ========== NEW: Agent System Actions ==========

  // Update agent status
  updateAgentStatus: (agent: AgentType, updates: Partial<AgentState>) => void;

  // Set current agent
  setCurrentAgent: (agent: AgentType | null) => void;

  // Add agent insight
  addAgentInsight: (insight: AgentInsight) => void;

  // Add research source
  addResearchSource: (source: ResearchSource) => void;

  // Clear research sources
  clearResearchSources: () => void;

  // Update pipeline progress
  updatePipelineProgress: (updates: Partial<PipelineProgress>) => void;

  // Reset agent state
  resetAgentState: () => void;

  // Reset
  resetWorkflow: () => void;
}

// ============================================
// Store Implementation
// ============================================

export const useSlidesStore = create<SlidesStore>()((set, get) => ({
  // ========== Initial State ==========
  presentations: [],
  currentPresentationId: null,
  generationStatus: 'idle',
  thinkingSteps: [],
  livePreviewSlide: null,
  finalPresentation: null,
  finalSlides: [],
  slides: [],

  // ========== NEW: Chat-based Workflow Initial State ==========
  messages: [],
  currentTopics: [],
  topicsApproved: false,
  showPreview: false,
  format: '16:9',
  theme: 'default',
  currentPrompt: '',

  // ========== NEW: Phase 2 - Computer Panel Initial State ==========
  toolHistory: [],
  showComputerPanel: false,

  // ========== NEW: Agent System Initial State ==========
  agentStatus: {
    ResearchAgent: { agent: 'ResearchAgent', status: 'idle' },
    TopicAgent: { agent: 'TopicAgent', status: 'idle' },
    ContentAgent: { agent: 'ContentAgent', status: 'idle' },
    DesignerAgent: { agent: 'DesignerAgent', status: 'idle' },
    QualityAgent: { agent: 'QualityAgent', status: 'idle' },
    OrchestratorAgent: { agent: 'OrchestratorAgent', status: 'idle' },
  },
  currentAgent: null,
  agentInsights: [],
  researchSources: [],
  pipelineProgress: {
    currentPhase: null,
    completedPhases: [],
    overallProgress: 0,
  },

  // ========== Presentations Management ==========

  setPresentations: (presentations) => {
    slidesLogger.debug('Setting presentations', {
      action: 'setPresentations',
      count: presentations.length,
    });
    set({ presentations });
  },

  addPresentation: (presentation) => {
    slidesLogger.debug('Adding presentation', {
      action: 'addPresentation',
      presentationId: presentation.id,
    });
    set((state) => ({
      presentations: [presentation, ...state.presentations],
    }));
  },

  updatePresentation: (id, updates) => {
    slidesLogger.debug('Updating presentation', {
      action: 'updatePresentation',
      presentationId: id,
      updates: Object.keys(updates),
    });
    set((state) => ({
      presentations: state.presentations.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  deletePresentation: (id) => {
    slidesLogger.debug('Deleting presentation', {
      action: 'deletePresentation',
      presentationId: id,
    });
    set((state) => ({
      presentations: state.presentations.filter((p) => p.id !== id),
    }));
  },

  // ========== Current Workflow ==========

  setCurrentPresentationId: (id) => {
    slidesLogger.debug('Setting current presentation ID', {
      action: 'setCurrentPresentationId',
      presentationId: id,
    });
    set({ currentPresentationId: id });
  },

  setGenerationStatus: (status) => {
    slidesLogger.debug('Setting generation status', {
      action: 'setGenerationStatus',
      status,
    });
    set({ generationStatus: status });
  },

  // ========== Thinking Display ==========

  setThinkingSteps: (steps) => {
    slidesLogger.debug('Setting thinking steps', {
      action: 'setThinkingSteps',
      count: steps.length,
    });
    set({ thinkingSteps: steps });
  },

  addOrUpdateThinkingStep: (newStep) => {
    slidesLogger.debug('Adding/updating thinking step', {
      action: 'addOrUpdateThinkingStep',
      stepId: newStep.id,
      status: newStep.status,
    });
    set((state) => {
      const steps = [...state.thinkingSteps];
      const existingIndex = steps.findIndex((s) => s.id === newStep.id);

      if (existingIndex !== -1) {
        // Update existing step
        steps[existingIndex] = newStep;
      } else {
        // Add new step
        steps.push(newStep);
      }

      return { thinkingSteps: steps };
    });
  },

  clearThinkingSteps: () => {
    slidesLogger.debug('Clearing thinking steps', {
      action: 'clearThinkingSteps',
    });
    set({ thinkingSteps: [] });
  },

  // ========== Live Preview ==========

  setLivePreviewSlide: (slide) => {
    if (slide) {
      slidesLogger.debug('Setting live preview slide', {
        action: 'setLivePreviewSlide',
        slideId: slide.id,
        order: slide.order_index,
      });
    } else {
      slidesLogger.debug('Clearing live preview slide', {
        action: 'setLivePreviewSlide',
      });
    }
    set({ livePreviewSlide: slide });
  },

  // ========== Final Result ==========

  setFinalPresentation: (presentation, slides) => {
    slidesLogger.debug('Setting final presentation', {
      action: 'setFinalPresentation',
      presentationId: presentation.id,
      slidesCount: slides.length,
    });
    set({
      finalPresentation: presentation,
      finalSlides: slides,
      generationStatus: 'completed',
    });
  },

  // ========== Live Slides Management ==========

  addSlidePreview: (slide) => {
    slidesLogger.debug('Adding slide preview', {
      action: 'addSlidePreview',
      slideId: slide.id,
      order: slide.order_index,
    });
    set((state) => ({
      slides: [...state.slides, slide],
    }));
  },

  clearSlides: () => {
    slidesLogger.debug('Clearing slides', {
      action: 'clearSlides',
    });
    set({ slides: [] });
  },

  // ========== NEW: Chat-based Workflow Actions ==========

  // Messages Management
  addMessage: (message) => {
    slidesLogger.debug('Adding message', {
      action: 'addMessage',
      messageId: message.id,
      type: message.type,
    });
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  updateMessage: (id, updates) => {
    slidesLogger.debug('Updating message', {
      action: 'updateMessage',
      messageId: id,
      updates: Object.keys(updates),
    });
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  },

  clearMessages: () => {
    slidesLogger.debug('Clearing messages', {
      action: 'clearMessages',
    });
    set({ messages: [] });
  },

  // Topics Management
  setCurrentTopics: (topics) => {
    slidesLogger.debug('Setting current topics', {
      action: 'setCurrentTopics',
      count: topics.length,
    });
    set({ currentTopics: topics });
  },

  setTopicsApproved: (approved) => {
    slidesLogger.debug('Setting topics approved', {
      action: 'setTopicsApproved',
      approved,
    });
    set({ topicsApproved: approved });
  },

  // Preview Panel
  setShowPreview: (show) => {
    slidesLogger.debug('Setting show preview', {
      action: 'setShowPreview',
      show,
    });
    set({ showPreview: show });
  },

  // Settings
  setFormat: (format) => {
    slidesLogger.debug('Setting format', {
      action: 'setFormat',
      format,
    });
    set({ format });
  },

  setTheme: (theme) => {
    slidesLogger.debug('Setting theme', {
      action: 'setTheme',
      theme,
    });
    set({ theme });
  },

  setCurrentPrompt: (prompt) => {
    set({ currentPrompt: prompt });
  },

  // ========== NEW: Phase 2 - Computer Panel Actions ==========

  // Tool History Management
  addToolAction: (action) => {
    slidesLogger.debug('Adding tool action', {
      action: 'addToolAction',
      toolId: action.id,
      toolType: action.type,
      status: action.status,
    });
    set((state) => {
      // Check if tool already exists (for updates)
      const existingIndex = state.toolHistory.findIndex((t) => t.id === action.id);
      if (existingIndex !== -1) {
        // Update existing
        const newHistory = [...state.toolHistory];
        newHistory[existingIndex] = action;
        return { toolHistory: newHistory };
      } else {
        // Add new
        return { toolHistory: [...state.toolHistory, action] };
      }
    });
  },

  updateToolAction: (id, updates) => {
    slidesLogger.debug('Updating tool action', {
      action: 'updateToolAction',
      toolId: id,
      updates: Object.keys(updates),
    });
    set((state) => ({
      toolHistory: state.toolHistory.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  },

  clearToolHistory: () => {
    slidesLogger.debug('Clearing tool history', {
      action: 'clearToolHistory',
    });
    set({ toolHistory: [] });
  },

  // Computer Panel
  setShowComputerPanel: (show) => {
    slidesLogger.debug('Setting show computer panel', {
      action: 'setShowComputerPanel',
      show,
    });
    set({ showComputerPanel: show });
  },

  toggleComputerPanel: () => {
    set((state) => {
      const newValue = !state.showComputerPanel;
      slidesLogger.debug('Toggling computer panel', {
        action: 'toggleComputerPanel',
        newValue,
      });
      return { showComputerPanel: newValue };
    });
  },

  // ========== NEW: Agent System Actions ==========

  updateAgentStatus: (agent, updates) => {
    slidesLogger.debug('Updating agent status', {
      action: 'updateAgentStatus',
      agent,
      updates,
    });
    set((state) => ({
      agentStatus: {
        ...state.agentStatus,
        [agent]: {
          ...state.agentStatus[agent],
          ...updates,
        },
      },
    }));
  },

  setCurrentAgent: (agent) => {
    slidesLogger.debug('Setting current agent', {
      action: 'setCurrentAgent',
      agent,
    });
    set({ currentAgent: agent });
  },

  addAgentInsight: (insight) => {
    slidesLogger.debug('Adding agent insight', {
      action: 'addAgentInsight',
      agent: insight.agent,
      confidence: insight.confidence,
    });
    set((state) => ({
      agentInsights: [...state.agentInsights, insight],
    }));
  },

  addResearchSource: (source) => {
    slidesLogger.debug('Adding research source', {
      action: 'addResearchSource',
      title: source.title,
      relevance: source.relevance,
    });
    set((state) => ({
      researchSources: [...state.researchSources, source],
    }));
  },

  clearResearchSources: () => {
    slidesLogger.debug('Clearing research sources', {
      action: 'clearResearchSources',
    });
    set({ researchSources: [] });
  },

  updatePipelineProgress: (updates) => {
    slidesLogger.debug('Updating pipeline progress', {
      action: 'updatePipelineProgress',
      updates,
    });
    set((state) => ({
      pipelineProgress: {
        ...state.pipelineProgress,
        ...updates,
      },
    }));
  },

  resetAgentState: () => {
    slidesLogger.debug('Resetting agent state', {
      action: 'resetAgentState',
    });
    set({
      agentStatus: {
        ResearchAgent: { agent: 'ResearchAgent', status: 'idle' },
        TopicAgent: { agent: 'TopicAgent', status: 'idle' },
        ContentAgent: { agent: 'ContentAgent', status: 'idle' },
        DesignerAgent: { agent: 'DesignerAgent', status: 'idle' },
        QualityAgent: { agent: 'QualityAgent', status: 'idle' },
        OrchestratorAgent: { agent: 'OrchestratorAgent', status: 'idle' },
      },
      currentAgent: null,
      agentInsights: [],
      researchSources: [],
      pipelineProgress: {
        currentPhase: null,
        completedPhases: [],
        overallProgress: 0,
      },
    });
  },

  // ========== Reset ==========

  resetWorkflow: () => {
    slidesLogger.debug('Resetting workflow', {
      action: 'resetWorkflow',
    });
    set({
      currentPresentationId: null,
      generationStatus: 'idle',
      thinkingSteps: [],
      livePreviewSlide: null,
      finalPresentation: null,
      finalSlides: [],
      slides: [],
      messages: [],
      currentTopics: [],
      topicsApproved: false,
      showPreview: false,
      currentPrompt: '',
      toolHistory: [],
      showComputerPanel: false,
    });
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
