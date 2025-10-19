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

  // ========== NEW: Chat-based Workflow State ==========

  // Messages (Chat history)
  messages: SlidesMessage[];

  // Topics State
  currentTopics: string[];
  topicsApproved: boolean;

  // Preview Panel Visibility
  showPreview: boolean;

  // Settings
  format: PresentationFormat;
  theme: PresentationTheme;
  currentPrompt: string;

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

  // ========== NEW: Chat-based Workflow Actions ==========

  // Messages Management
  addMessage: (message: SlidesMessage) => void;
  updateMessage: (id: string, updates: Partial<SlidesMessage>) => void;
  clearMessages: () => void;

  // Topics Management
  setCurrentTopics: (topics: string[]) => void;
  setTopicsApproved: (approved: boolean) => void;

  // Preview Panel
  setShowPreview: (show: boolean) => void;

  // Settings
  setFormat: (format: PresentationFormat) => void;
  setTheme: (theme: PresentationTheme) => void;
  setCurrentPrompt: (prompt: string) => void;

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

  // ========== NEW: Chat-based Workflow Initial State ==========
  messages: [],
  currentTopics: [],
  topicsApproved: false,
  showPreview: false,
  format: '16:9',
  theme: 'default',
  currentPrompt: '',

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
      messages: [],
      currentTopics: [],
      topicsApproved: false,
      showPreview: false,
      currentPrompt: '',
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
