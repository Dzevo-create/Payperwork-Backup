import { create } from 'zustand';
import { Message, Conversation, ChatError } from '@/types/chat';
import * as supabaseChat from '@/lib/supabase-chat';

interface ChatStore {
  // State
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  isGenerating: boolean;
  error: ChatError | null;
  isLoading: boolean;

  // Actions
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => Promise<void>;
  updateMessage: (id: string, content: string) => Promise<void>;
  updateMessageWithAttachments: (id: string, content: string, attachments: any[], videoTask?: Message['videoTask']) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;

  setCurrentConversationId: (id: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: ChatError | null) => void;

  // Utility actions
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
  isLoading: false,

  // Load conversations from Supabase
  loadConversations: async () => {
    set({ isLoading: true });
    const conversations = await supabaseChat.fetchConversations();
    set({ conversations, isLoading: false });
  },

  // Load messages for a conversation
  loadMessages: async (conversationId: string) => {
    set({ isLoading: true });
    const messages = await supabaseChat.fetchMessages(conversationId);
    set({ messages, currentConversationId: conversationId, isLoading: false });
  },

  // Actions
  setMessages: (messages) => set({ messages }),

  addMessage: async (message) => {
    const { currentConversationId } = get();

    // Optimistically update UI
    set((state) => ({ messages: [...state.messages, message] }));

    // Save to Supabase
    if (currentConversationId) {
      await supabaseChat.createMessage(currentConversationId, message);

      // Update conversation's updated_at
      const conversations = get().conversations.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, messages: [...conv.messages, message], updatedAt: new Date() }
          : conv
      );
      set({ conversations });
    }
  },

  updateMessage: async (id, content) => {
    // Optimistically update UI
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    }));

    // Save to Supabase
    await supabaseChat.updateMessage(id, { content });
  },

  updateMessageWithAttachments: async (id, content, attachments, videoTask) => {
    console.log("💾 updateMessageWithAttachments CALLED (Supabase):", { id, content, attachments, videoTask });

    // Optimistically update UI
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content, attachments, videoTask } : msg
      ),
    }));

    // Save to Supabase
    await supabaseChat.updateMessage(id, { content, attachments, videoTask });
  },

  deleteMessage: async (id) => {
    // Optimistically update UI
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    }));

    // Delete from Supabase
    await supabaseChat.deleteMessage(id);
  },

  setConversations: (conversations) => set({ conversations }),

  addConversation: async (conversation) => {
    // Optimistically update UI
    set((state) => ({
      conversations: [...state.conversations, conversation],
    }));

    // Save to Supabase
    await supabaseChat.createConversation(conversation);
  },

  updateConversation: async (id, updates) => {
    // Optimistically update UI
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
      ),
    }));

    // Save to Supabase
    await supabaseChat.updateConversation(id, updates);
  },

  deleteConversation: async (id) => {
    // Optimistically update UI
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
      currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
      messages: state.currentConversationId === id ? [] : state.messages,
    }));

    // Delete from Supabase
    await supabaseChat.deleteConversation(id);
  },

  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  setIsGenerating: (isGenerating) => set({ isGenerating }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [] }),

  clearError: () => set({ error: null }),
}));
