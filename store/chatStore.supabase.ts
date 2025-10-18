/**
 * Supabase-backed Chat Store
 *
 * This is the new store that uses Supabase as the source of truth.
 * localStorage is only used as a cache for performance.
 *
 * Migration Strategy:
 * 1. Run migration script to move localStorage data to Supabase
 * 2. Replace import in components from './chatStore' to './chatStore.supabase'
 * 3. Test thoroughly before removing old chatStore.ts
 */

import { create } from 'zustand';
import { Message, Conversation, ChatError, Attachment } from '@/types/chat';
import { chatLogger } from '@/lib/logger';
import {
  fetchConversations,
  createConversation as createConvSupabase,
  updateConversation as updateConvSupabase,
  deleteConversation as deleteConvSupabase,
  createMessage as createMessageSupabase,
  updateMessage as updateMessageSupabase,
  deleteMessage as deleteMessageSupabase,
} from '@/lib/supabase-chat';

interface ChatStore {
  // State
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  isGenerating: boolean;
  error: ChatError | null;
  isHydrated: boolean; // Track if data loaded from Supabase

  // Actions
  hydrate: () => Promise<void>; // Load from Supabase
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => Promise<void>; // Now async!
  addMessageToConversation: (conversationId: string, message: Message) => Promise<void>; // NEW: Add to any conversation
  updateMessage: (id: string, content: string, skipSync?: boolean) => Promise<void>;
  updateMessageInConversation: (conversationId: string, id: string, content: string, skipSync?: boolean) => Promise<void>; // NEW: Update in specific conversation
  updateMessageWithAttachments: (
    id: string,
    content: string,
    attachments: Attachment[],
    videoTask?: Message['videoTask'],
    generationAttempt?: number
  ) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;

  setCurrentConversationId: (id: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: ChatError | null) => void;

  clearMessages: () => void;
  clearError: () => void;
}

// Global flag to prevent multiple hydrations (persists across component remounts)
let isHydrating = false;
let hasHydrated = false;

export const useChatStore = create<ChatStore>()((set, get) => ({
  // Initial state
  messages: [],
  conversations: [],
  currentConversationId: null,
  isGenerating: false,
  error: null,
  isHydrated: false,

  // Load data from Supabase (protected against multiple calls)
  hydrate: async () => {
    // Skip if already hydrated or currently hydrating
    if (hasHydrated || isHydrating) {
      chatLogger.warn('Skipping hydration (already done or in progress)');
      return;
    }

    isHydrating = true;

    try {
      chatLogger.info('Loading conversations from Supabase...');
      const conversations = await fetchConversations();

      // Restore currentConversationId from localStorage (for page reload)
      let restoredConvId: string | null = null;
      if (typeof window !== 'undefined') {
        restoredConvId = localStorage.getItem('currentConversationId');
      }

      // Verify the restored conversation exists
      if (restoredConvId && !conversations.find(c => c.id === restoredConvId)) {
        chatLogger.warn('Restored conversation ID not found, clearing:');
        restoredConvId = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentConversationId');
        }
      }

      const restoredConv = restoredConvId ? conversations.find(c => c.id === restoredConvId) : null;

      set({
        conversations,
        currentConversationId: restoredConvId,
        messages: restoredConv?.messages || [],
        isHydrated: true
      });

      hasHydrated = true;
      isHydrating = false;

      chatLogger.info('Loaded ${conversations.length} conversations from Supabase');
      if (restoredConvId) {
        chatLogger.info('Restored conversation: ${restoredConvId}');
      }
    } catch (error) {
      chatLogger.error('Failed to hydrate from Supabase:', error instanceof Error ? error : undefined);
      set({
        error: {
          message: 'Failed to load conversations',
          retryable: true
        },
        isHydrated: true // Mark as hydrated even on error to prevent retry loops
      });

      hasHydrated = true;
      isHydrating = false;
    }
  },

  // Messages
  setMessages: (messages) => set({ messages }),

  addMessage: async (message) => {
    const conversationId = get().currentConversationId;
    if (!conversationId) {
      chatLogger.error('Cannot add message: No current conversation');
      return;
    }
    await get().addMessageToConversation(conversationId, message);
  },

  addMessageToConversation: async (conversationId, message) => {
    const state = get();
    const isCurrentConversation = conversationId === state.currentConversationId;

    // Capture current state for potential rollback
    const rollbackState = {
      messages: state.messages,
      conversations: state.conversations
    };

    // Optimistic update - add to conversation
    set((state) => {
      const updatedConversations = state.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...(conv.messages || []), message], updatedAt: new Date() }
          : conv
      );

      // If it's the current conversation, also update messages array
      const updatedMessages = isCurrentConversation
        ? [...state.messages, message]
        : state.messages;

      return {
        messages: updatedMessages,
        conversations: updatedConversations
      };
    });

    // Sync to Supabase in background
    try {
      await createMessageSupabase(conversationId, message);
      chatLogger.info(`Message synced to Supabase for conversation ${conversationId}`);

      // If this was a background conversation, show a notification
      if (!isCurrentConversation && typeof window !== 'undefined') {
        // Create a custom event that components can listen to
        const event = new CustomEvent('backgroundMessageReceived', {
          detail: { conversationId, message }
        });
        window.dispatchEvent(event);
        chatLogger.info(`Background message notification dispatched for conversation ${conversationId}`);
      }
    } catch (error) {
      chatLogger.error('Failed to sync message to Supabase:', error instanceof Error ? error : undefined);
      // ROLLBACK: Restore previous state
      set(rollbackState);
      // Set error for UI to display
      set({
        error: {
          message: 'Failed to save message. Please try again.',
          retryable: true
        }
      });
      throw error; // Propagate error to caller
    }
  },

  updateMessage: async (id, content, skipSync = false) => {
    const conversationId = get().currentConversationId;
    if (!conversationId) {
      chatLogger.error('Cannot update message: No current conversation');
      return;
    }
    await get().updateMessageInConversation(conversationId, id, content, skipSync);
  },

  updateMessageInConversation: async (conversationId, id, content, skipSync = false) => {
    const state = get();
    const isCurrentConversation = conversationId === state.currentConversationId;

    // CRITICAL: Find the existing message to preserve ALL its properties
    // Look in the target conversation, not just current messages
    const targetConversation = state.conversations.find(c => c.id === conversationId);
    const existingMessage = targetConversation?.messages?.find(msg => msg.id === id);

    if (!existingMessage) {
      chatLogger.error('updateMessageInConversation called for non-existent message', undefined, {
        messageId: id,
        conversationId,
      });
      return;
    }

    chatLogger.debug('updateMessageInConversation - Before update:', {
      messageId: id,
      conversationId,
      isCurrentConversation,
      wasGeneratedWithC1: existingMessage.wasGeneratedWithC1,
      isC1Streaming: existingMessage.isC1Streaming,
      contentPreview: content.substring(0, 50),
    });

    // SIMPLE: Update content while preserving ALL other properties
    const updatedMessage = {
      ...existingMessage,
      content,
      // If this is a C1 message being finalized, ensure isC1Streaming is false
      isC1Streaming: existingMessage.wasGeneratedWithC1 ? false : existingMessage.isC1Streaming,
    };

    // Optimistic update - update conversations (and messages if current)
    set((state) => {
      // Update conversation messages WITHOUT updating updatedAt (prevents reload)
      const conversations = state.conversations.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: (conv.messages || []).map(msg =>
                msg.id === id ? updatedMessage : msg
              ),
              // DON'T update updatedAt - prevents conversation reload
            }
          : conv
      );

      // If this is the current conversation, also update messages array
      const messages = isCurrentConversation
        ? state.messages.map((msg) => msg.id === id ? updatedMessage : msg)
        : state.messages;

      return { messages, conversations };
    });

    // Sync to Supabase (skip during streaming to prevent excessive updates)
    if (!skipSync) {
      try {
        // SIMPLE: Build update payload with ALL important flags preserved
        const updatePayload: Partial<Message> = {
          content,
          isC1Streaming: false, // Always false when syncing to Supabase (streaming is done)
        };

        // ALWAYS preserve wasGeneratedWithC1 flag if it exists
        if ('wasGeneratedWithC1' in existingMessage) {
          updatePayload.wasGeneratedWithC1 = existingMessage.wasGeneratedWithC1;
        }

        chatLogger.info('Syncing to Supabase with flags:', {
          messageId: id,
          conversationId,
          wasGeneratedWithC1: updatePayload.wasGeneratedWithC1,
          isC1Streaming: updatePayload.isC1Streaming,
          contentLength: content.length,
        });

        await updateMessageSupabase(id, updatePayload);
        chatLogger.info('Message updated in Supabase');
      } catch (error) {
        chatLogger.error('Failed to update message in Supabase:', error instanceof Error ? error : undefined);
      }
    }
  },

  updateMessageWithAttachments: async (id, content, attachments, videoTask, generationAttempt) => {
    const conversationId = get().currentConversationId;

    // Optimistic update - update both messages AND conversation
    set((state) => {
      if (!Array.isArray(state.messages)) {
        return { messages: [] };
      }

      const updatedMessageData = {
        content,
        attachments,
        videoTask,
        generationAttempt: generationAttempt ?? undefined,
      };

      const messages = state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updatedMessageData } : msg
      );

      // Also update in conversation
      const conversations = state.conversations.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: (conv.messages || []).map(msg =>
                msg.id === id ? { ...msg, ...updatedMessageData } : msg
              ),
              updatedAt: new Date()
            }
          : conv
      );

      return { messages, conversations };
    });

    // Sync to Supabase
    try {
      await updateMessageSupabase(id, {
        content,
        attachments,
        videoTask,
        generationAttempt,
      });
      chatLogger.info('Message with attachments updated in Supabase');
    } catch (error) {
      chatLogger.error('Failed to update message with attachments in Supabase:', error instanceof Error ? error : undefined);
    }
  },

  deleteMessage: async (id) => {
    // Optimistic update
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    }));

    // Sync to Supabase
    try {
      await deleteMessageSupabase(id);
      chatLogger.info('Message deleted from Supabase');
    } catch (error) {
      chatLogger.error('Failed to delete message from Supabase:', error instanceof Error ? error : undefined);
    }
  },

  // Conversations
  setConversations: (conversations) => set({ conversations }),

  addConversation: async (conversation) => {
    // Optimistic update
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));

    // Sync to Supabase
    try {
      await createConvSupabase(conversation);
      chatLogger.info('Conversation created in Supabase');
    } catch (error) {
      chatLogger.error('Failed to create conversation in Supabase:', error instanceof Error ? error : undefined);
    }
  },

  updateConversation: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv
      ),
    }));

    // Sync to Supabase
    try {
      await updateConvSupabase(id, updates);
      chatLogger.info('Conversation updated in Supabase');
    } catch (error) {
      chatLogger.error('Failed to update conversation in Supabase:', error instanceof Error ? error : undefined);
    }
  },

  deleteConversation: async (id) => {
    // Optimistic update
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
    }));

    // Sync to Supabase
    try {
      await deleteConvSupabase(id);
      chatLogger.info('Conversation deleted from Supabase');
    } catch (error) {
      chatLogger.error('Failed to delete conversation from Supabase:', error instanceof Error ? error : undefined);
    }
  },

  // UI State
  setCurrentConversationId: (id) => {
    // When switching conversation, load messages from that conversation
    const state = get();
    const conversation = state.conversations.find(c => c.id === id);

    // Persist to localStorage for page reload recovery
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('currentConversationId', id);
      } else {
        localStorage.removeItem('currentConversationId');
      }
    }

    // ⚠️ CRITICAL FIX: Don't reload messages if we're already in this conversation
    // and generation is in progress (prevents overwriting during streaming)
    if (id === state.currentConversationId && state.isGenerating) {
      chatLogger.warn('Skipping message reload - generation in progress for conversation:');
      return;
    }

    // 🎯 UX FIX: Clear messages immediately when switching conversations
    // This prevents the flash of old messages from the previous conversation
    if (id !== state.currentConversationId) {
      set({ messages: [] });
    }

    if (conversation && conversation.messages) {
      chatLogger.info('Loading ${conversation.messages.length} messages for conversation ${id}');
      set({
        currentConversationId: id,
        messages: conversation.messages
      });
    } else {
      chatLogger.info('Switching to conversation ${id} (no messages yet)');
      set({
        currentConversationId: id,
        messages: []
      });
    }
  },

  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [] }),
  clearError: () => set({ error: null }),
}));

// Auto-hydrate on first mount
if (typeof window !== 'undefined') {
  // Wait a tick to ensure store is initialized
  setTimeout(() => {
    useChatStore.getState().hydrate();
  }, 0);
}
