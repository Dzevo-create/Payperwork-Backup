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
  updateMessage: (id: string, content: string, skipSync?: boolean) => Promise<void>;
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
      console.log('⏭️ Skipping hydration (already done or in progress)');
      return;
    }

    isHydrating = true;

    try {
      console.log('🔄 Loading conversations from Supabase...');
      const conversations = await fetchConversations();

      // Restore currentConversationId from localStorage (for page reload)
      let restoredConvId: string | null = null;
      if (typeof window !== 'undefined') {
        restoredConvId = localStorage.getItem('currentConversationId');
      }

      // Verify the restored conversation exists
      if (restoredConvId && !conversations.find(c => c.id === restoredConvId)) {
        console.warn('⚠️ Restored conversation ID not found, clearing:', restoredConvId);
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

      console.log(`✅ Loaded ${conversations.length} conversations from Supabase`);
      if (restoredConvId) {
        console.log(`✅ Restored conversation: ${restoredConvId}`);
      }
    } catch (error) {
      console.error('❌ Failed to hydrate from Supabase:', error);
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
    const state = get();

    // Capture current state for potential rollback
    const rollbackState = {
      messages: state.messages,
      conversations: state.conversations
    };

    // Optimistic update - add to UI immediately AND to conversation
    set((state) => ({
      messages: [...state.messages, message],
      // IMPORTANT: Also update the conversation's messages array
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...(conv.messages || []), message], updatedAt: new Date() }
          : conv
      )
    }));

    // Sync to Supabase in background
    if (conversationId) {
      try {
        await createMessageSupabase(conversationId, message);
        console.log('✅ Message synced to Supabase');
      } catch (error) {
        console.error('❌ Failed to sync message to Supabase:', error);
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
    }
  },

  updateMessage: async (id, content, skipSync = false) => {
    const conversationId = get().currentConversationId;
    const state = get();

    // CRITICAL: Find the existing message to preserve ALL its properties
    const existingMessage = state.messages.find(msg => msg.id === id);

    if (!existingMessage) {
      console.error('⚠️ updateMessage called for non-existent message:', id);
      return;
    }

    console.log("🔍 updateMessage - Before update:", {
      messageId: id,
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

    // Optimistic update - update both messages and conversations
    set((state) => {
      if (!Array.isArray(state.messages)) {
        console.error('⚠️ state.messages is not an array');
        return { messages: [] };
      }

      const messages = state.messages.map((msg) =>
        msg.id === id ? updatedMessage : msg
      );

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

        console.log('✅ Syncing to Supabase with flags:', {
          messageId: id,
          wasGeneratedWithC1: updatePayload.wasGeneratedWithC1,
          isC1Streaming: updatePayload.isC1Streaming,
          contentLength: content.length,
        });

        await updateMessageSupabase(id, updatePayload);
        console.log('✅ Message updated in Supabase');
      } catch (error) {
        console.error('❌ Failed to update message in Supabase:', error);
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
      console.log('✅ Message with attachments updated in Supabase');
    } catch (error) {
      console.error('❌ Failed to update message with attachments in Supabase:', error);
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
      console.log('✅ Message deleted from Supabase');
    } catch (error) {
      console.error('❌ Failed to delete message from Supabase:', error);
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
      console.log('✅ Conversation created in Supabase');
    } catch (error) {
      console.error('❌ Failed to create conversation in Supabase:', error);
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
      console.log('✅ Conversation updated in Supabase');
    } catch (error) {
      console.error('❌ Failed to update conversation in Supabase:', error);
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
      console.log('✅ Conversation deleted from Supabase');
    } catch (error) {
      console.error('❌ Failed to delete conversation from Supabase:', error);
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
      console.log('⚠️ Skipping message reload - generation in progress for conversation:', id);
      return;
    }

    if (conversation && conversation.messages) {
      console.log(`🔄 Loading ${conversation.messages.length} messages for conversation ${id}`);
      set({
        currentConversationId: id,
        messages: conversation.messages
      });
    } else {
      console.log(`🔄 Switching to conversation ${id} (no messages yet)`);
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
