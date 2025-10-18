import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, Conversation, ChatError, Attachment } from '@/types/chat';
import { chatLogger } from '@/lib/logger';

interface ChatStore {
  // State
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  isGenerating: boolean;
  error: ChatError | null;

  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string) => void;
  updateMessageWithAttachments: (id: string, content: string, attachments: Attachment[], videoTask?: Message['videoTask'], generationAttempt?: number) => void;
  deleteMessage: (id: string) => void;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;

  setCurrentConversationId: (id: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: ChatError | null) => void;

  // Utility actions
  clearMessages: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      // Initial state
      messages: [],
      conversations: [],
      currentConversationId: null,
      isGenerating: false,
      error: null,

      // Actions
      setMessages: (messages) => set({ messages }),

      addMessage: (message) => set((state) => {
        const newMessages = [...state.messages, message];

        // FIX: Capture currentConversationId at the start to avoid race condition
        const conversationId = state.currentConversationId;

        // Update current conversation
        if (conversationId) {
          const conversations = state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: newMessages, updatedAt: new Date() }
              : conv
          );
          return { messages: newMessages, conversations };
        }

        return { messages: newMessages };
      }),

      updateMessage: (id, content) => set((state) => {
        // Safety check: ensure state.messages is an array
        if (!Array.isArray(state.messages)) {
          chatLogger.error('updateMessage: state.messages is not an array, resetting');
          return { messages: [] };
        }

        const messages = state.messages.map((msg) =>
          msg.id === id ? { ...msg, content } : msg
        );

        // FIX: Capture currentConversationId at the start to avoid race condition
        const conversationId = state.currentConversationId;

        // Update conversation
        if (conversationId) {
          const safeConversations = Array.isArray(state.conversations) ? state.conversations : [];
          const conversations = safeConversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages, updatedAt: new Date() }
              : conv
          );
          return { messages, conversations };
        }

        return { messages };
      }),

      updateMessageWithAttachments: (id, content, attachments, videoTask, generationAttempt) => set((state) => {
        chatLogger.debug('💾 updateMessageWithAttachments CALLED:', {
          id,
          content,
          attachments,
          videoTask,
          generationAttempt,
          currentMessagesCount: state.messages.length,
        });

        const messageFound = state.messages.find((msg) => msg.id === id);
        chatLogger.debug('🔎 Message found:', messageFound);

        const messages = state.messages.map((msg) =>
          msg.id === id ? {
            ...msg,
            content,
            attachments,
            videoTask,
            ...(generationAttempt !== undefined && { generationAttempt }),
          } : msg
        );

        chatLogger.debug('📝 Updated messages array:', messages.slice(0, 50).map(m => ({ id: m.id, content: m.content.slice(0, 50), attachments: m.attachments, videoTask: m.videoTask })));

        // FIX: Capture currentConversationId at the start to avoid race condition
        const conversationId = state.currentConversationId;

        // Update conversation
        if (conversationId) {
          const conversations = state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages, updatedAt: new Date() }
              : conv
          );
          chatLogger.debug('💬 Updating conversation:');
          return { messages, conversations };
        }

        chatLogger.info('Returning updated messages (no conversation)');
        return { messages };
      }),

      deleteMessage: (id) => set((state) => {
        const messages = state.messages.filter((msg) => msg.id !== id);

        // FIX: Capture currentConversationId at the start to avoid race condition
        const conversationId = state.currentConversationId;

        // Update conversation
        if (conversationId) {
          const conversations = state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages, updatedAt: new Date() }
              : conv
          );
          return { messages, conversations };
        }

        return { messages };
      }),

      setConversations: (conversations) => set({ conversations }),

      addConversation: (conversation) => set((state) => ({
        // Add new conversation at the beginning (top of list)
        conversations: [conversation, ...state.conversations],
      })),

      updateConversation: (id, updates) => set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === id ? {
            ...conv,
            ...updates,
            // Only update timestamp if messages changed or explicitly requested
            updatedAt: updates.messages || updates.updatedAt ? new Date() : conv.updatedAt
          } : conv
        ),
      })),

      deleteConversation: (id) => set((state) => ({
        conversations: state.conversations.filter((conv) => conv.id !== id),
        currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        messages: state.currentConversationId === id ? [] : state.messages,
      })),

      setCurrentConversationId: (id) => set({ currentConversationId: id }),

      setIsGenerating: (isGenerating) => set({ isGenerating }),

      setError: (error) => set({ error }),

      clearMessages: () => set({ messages: [] }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'payperwork-chat-storage',
      partialize: (state) => {
        // Helper function to strip base64 from attachments
        const stripBase64FromAttachments = (attachments: Attachment[] | undefined) => {
          if (!attachments) return attachments;
          return attachments.map((att) => {
            // Remove base64 data from images to save space
            if (att.base64) {
              return { ...att, base64: undefined };
            }
            // Remove large data URLs from images
            if (att.type === 'image' && att.url?.startsWith('data:image') && att.url.length > 1000) {
              return { ...att, url: '[removed to save space]' };
            }
            return att;
          });
        };

        // Safety check: ensure state.messages and state.conversations are arrays
        const safeMessages = Array.isArray(state.messages) ? state.messages : [];
        const safeConversations = Array.isArray(state.conversations) ? state.conversations : [];

        return {
          // Strip base64 from current messages
          messages: safeMessages.map((msg) => ({
            ...msg,
            attachments: stripBase64FromAttachments(msg.attachments),
          })),
          // Strip base64 from conversations
          conversations: safeConversations.map((conv) => ({
            ...conv,
            messages: Array.isArray(conv.messages) ? conv.messages.map((msg) => ({
              ...msg,
              attachments: stripBase64FromAttachments(msg.attachments),
            })) : [],
          })),
          currentConversationId: state.currentConversationId,
        };
      },
      // Add error handling for quota exceeded + data validation
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          chatLogger.error('Failed to rehydrate storage:', error as Error);
          // Clear localStorage if quota exceeded
          if ((error as Error).name === 'QuotaExceededError') {
            chatLogger.warn('🚨 Storage quota exceeded, clearing old data...');
            try {
              localStorage.removeItem('payperwork-chat-storage');
            } catch (e) {
              chatLogger.error('Failed to clear storage:');
            }
          }
        }

        // Validate rehydrated state
        if (state) {
          // Ensure messages is always an array
          if (!Array.isArray(state.messages)) {
            chatLogger.error('Corrupted messages detected, resetting to empty array');
            state.messages = [];
          }
          // Ensure conversations is always an array
          if (!Array.isArray(state.conversations)) {
            chatLogger.error('Corrupted conversations detected, resetting to empty array');
            state.conversations = [];
          }

          // Validate each conversation's messages array
          if (Array.isArray(state.conversations)) {
            state.conversations = state.conversations.map((conv) => {
              if (!Array.isArray(conv.messages)) {
                chatLogger.error(`Corrupted messages in conversation ${conv.id}, resetting`);
                return { ...conv, messages: [] };
              }
              return conv;
            });
          }

          // Validate all messages have required fields
          if (Array.isArray(state.messages)) {
            state.messages = state.messages.filter((msg) => {
              if (!msg.id || !msg.role || msg.content === undefined) {
                chatLogger.error('Invalid message detected, removing:');
                return false;
              }
              return true;
            });
          }
        }
      },
    }
  )
);
