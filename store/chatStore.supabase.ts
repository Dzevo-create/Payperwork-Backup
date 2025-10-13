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
import { Message, Conversation, ChatError } from '@/types/chat';
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
  updateMessage: (id: string, content: string) => Promise<void>;
  updateMessageWithAttachments: (
    id: string,
    content: string,
    attachments: any[],
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

export const useChatStore = create<ChatStore>()((set, get) => ({
  // Initial state
  messages: [],
  conversations: [],
  currentConversationId: null,
  isGenerating: false,
  error: null,
  isHydrated: false,

  // Load data from Supabase
  hydrate: async () => {
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
    }
  },

  // Messages
  setMessages: (messages) => set({ messages }),

  addMessage: async (message) => {
    const conversationId = get().currentConversationId;

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
        // Don't revert optimistic update - we'll retry on next action
      }
    }
  },

  updateMessage: async (id, content) => {
    const conversationId = get().currentConversationId;

    // Optimistic update - update both messages AND conversation
    set((state) => {
      if (!Array.isArray(state.messages)) {
        console.error('⚠️ state.messages is not an array');
        return { messages: [] };
      }

      const messages = state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      );

      // Also update in conversation
      const conversations = state.conversations.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: (conv.messages || []).map(msg =>
                msg.id === id ? { ...msg, content } : msg
              ),
              updatedAt: new Date()
            }
          : conv
      );

      return { messages, conversations };
    });

    // Sync to Supabase
    try {
      await updateMessageSupabase(id, { content });
      console.log('✅ Message updated in Supabase');
    } catch (error) {
      console.error('❌ Failed to update message in Supabase:', error);
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
