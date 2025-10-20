/**
 * Workflow Slice
 *
 * Manages chat messages, topics, and workflow settings.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { StateCreator } from 'zustand';
import {
  SlidesMessage,
  Topic,
  PresentationFormat,
  PresentationTheme,
} from '@/types/slides';
import { slidesLogger } from '@/lib/logger';

// ============================================
// Workflow Slice State
// ============================================

export interface WorkflowSlice {
  // State
  messages: SlidesMessage[];
  currentTopics: Topic[];
  topicsApproved: boolean;
  format: PresentationFormat;
  theme: PresentationTheme;
  currentPrompt: string;

  // Actions
  addMessage: (message: SlidesMessage) => void;
  updateMessage: (id: string, updates: Partial<SlidesMessage>) => void;
  clearMessages: () => void;
  setCurrentTopics: (topics: Topic[]) => void;
  setTopicsApproved: (approved: boolean) => void;
  setFormat: (format: PresentationFormat) => void;
  setTheme: (theme: PresentationTheme) => void;
  setCurrentPrompt: (prompt: string) => void;
}

// ============================================
// Workflow Slice Creator
// ============================================

export const createWorkflowSlice: StateCreator<
  WorkflowSlice,
  [],
  [],
  WorkflowSlice
> = (set) => ({
  // Initial State
  messages: [],
  currentTopics: [],
  topicsApproved: false,
  format: '16:9',
  theme: 'default',
  currentPrompt: '',

  // Actions
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
});
