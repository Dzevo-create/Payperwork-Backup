/**
 * useChatIntegration Hook
 *
 * Chat Store integration for WorkflowPage component.
 * Handles all chat-related actions (load, new, delete, duplicate, rename).
 *
 * Responsibilities:
 * - Access chat store state
 * - Provide chat action handlers
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore.supabase';
import { Conversation } from '@/types/chat';

/**
 * Chat integration interface
 */
export interface ChatIntegration {
  // Chat Store State
  conversations: Conversation[];
  currentConversationId: string | null;

  // Chat Actions
  handleLoadConversation: (convId: string) => void;
  handleNewChat: () => void;
  handleDeleteConversation: (id: string) => void;
  handleDuplicateConversation: (id: string) => void;
  handleRenameConversation: (id: string, title: string) => void;
}

/**
 * Custom hook for Chat Store integration
 *
 * @returns Chat state and action handlers
 */
export function useChatIntegration(): ChatIntegration {
  const router = useRouter();

  // Chat Store State
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversation = useChatStore((state) => state.addConversation);
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const setMessages = useChatStore((state) => state.setMessages);

  // Load Conversation
  const handleLoadConversation = useCallback((convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setCurrentConversationId(convId);
      router.push(`/chat?convId=${convId}`);
    }
  }, [conversations, setCurrentConversationId, router]);

  // New Chat
  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    router.push("/chat");
  }, [setCurrentConversationId, setMessages, router]);

  // Delete Conversation
  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation(id);
  }, [deleteConversation]);

  // Duplicate Conversation
  const handleDuplicateConversation = useCallback((id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      addConversation({
        ...conv,
        id: Date.now().toString(),
        title: `${conv.title} (Kopie)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [conversations, addConversation]);

  // Rename Conversation
  const handleRenameConversation = useCallback((id: string, title: string) => {
    updateConversation(id, { title });
  }, [updateConversation]);

  return {
    conversations,
    currentConversationId,
    handleLoadConversation,
    handleNewChat,
    handleDeleteConversation,
    handleDuplicateConversation,
    handleRenameConversation,
  };
}
