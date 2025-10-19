/**
 * Presentation Slice
 *
 * Manages presentations list, current presentation, and generation status.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { StateCreator } from 'zustand';
import {
  Presentation,
  GenerationStatus,
  Slide,
  LivePreviewSlide,
  ThinkingStep,
} from '@/types/slides';
import { slidesLogger } from '@/lib/logger';

// ============================================
// Presentation Slice State
// ============================================

export interface PresentationSlice {
  // State
  presentations: Presentation[];
  currentPresentationId: string | null;
  generationStatus: GenerationStatus;
  thinkingSteps: ThinkingStep[];
  livePreviewSlide: LivePreviewSlide | null;
  finalPresentation: Presentation | null;
  finalSlides: Slide[];
  slides: Slide[];

  // Actions
  setPresentations: (presentations: Presentation[]) => void;
  addPresentation: (presentation: Presentation) => void;
  updatePresentation: (id: string, updates: Partial<Presentation>) => void;
  deletePresentation: (id: string) => void;
  setCurrentPresentationId: (id: string | null) => void;
  setGenerationStatus: (status: GenerationStatus) => void;
  setThinkingSteps: (steps: ThinkingStep[]) => void;
  addOrUpdateThinkingStep: (step: ThinkingStep) => void;
  clearThinkingSteps: () => void;
  setLivePreviewSlide: (slide: LivePreviewSlide | null) => void;
  setFinalPresentation: (presentation: Presentation, slides: Slide[]) => void;
  addSlidePreview: (slide: Slide) => void;
  clearSlides: () => void;
}

// ============================================
// Presentation Slice Creator
// ============================================

export const createPresentationSlice: StateCreator<
  PresentationSlice,
  [],
  [],
  PresentationSlice
> = (set) => ({
  // Initial State
  presentations: [],
  currentPresentationId: null,
  generationStatus: 'idle',
  thinkingSteps: [],
  livePreviewSlide: null,
  finalPresentation: null,
  finalSlides: [],
  slides: [],

  // Actions
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
        steps[existingIndex] = newStep;
      } else {
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
});
