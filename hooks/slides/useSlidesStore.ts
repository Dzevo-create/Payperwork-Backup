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
