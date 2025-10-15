/**
 * Hook for conversation CRUD operations
 *
 * Provides:
 * - Create new conversation
 * - Update conversation (title, pin status)
 * - Delete conversation
 * - Duplicate conversation
 * - Bulk operations
 */

import { useCallback, useState } from 'react';
import { useChatStore } from '@/store/chatStore.supabase';
import { Conversation, Message } from '@/types/chat';

export interface UseConversationActionsReturn {
  /** Create new conversation */
  createConversation: (title?: string) => Promise<Conversation>;
  /** Update conversation */
  updateConversation: (
    id: string,
    updates: Partial<Conversation>
  ) => Promise<void>;
  /** Delete conversation */
  deleteConversation: (id: string) => Promise<void>;
  /** Duplicate conversation */
  duplicateConversation: (id: string) => Promise<Conversation | null>;
  /** Toggle pin status */
  togglePin: (id: string) => Promise<void>;
  /** Rename conversation */
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  /** Delete multiple conversations */
  bulkDelete: (ids: string[]) => Promise<void>;
  /** Export conversation as JSON */
  exportConversation: (id: string) => Promise<string>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for conversation CRUD operations
 *
 * @example
 * ```tsx
 * const {
 *   createConversation,
 *   deleteConversation,
 *   togglePin
 * } = useConversationActions();
 *
 * // Create new conversation
 * const conv = await createConversation('My Project');
 *
 * // Toggle pin
 * await togglePin(conv.id);
 *
 * // Delete
 * await deleteConversation(conv.id);
 * ```
 */
export function useConversationActions(): UseConversationActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store actions
  const conversations = useChatStore((state) => state.conversations);
  const addConversation = useChatStore((state) => state.addConversation);
  const updateConversationStore = useChatStore((state) => state.updateConversation);
  const deleteConversationStore = useChatStore((state) => state.deleteConversation);

  /**
   * Create new conversation
   */
  const createConversation = useCallback(
    async (title: string = 'Neuer Chat'): Promise<Conversation> => {
      setIsLoading(true);
      setError(null);

      try {
        const newConversation: Conversation = {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
        };

        await addConversation(newConversation);
        return newConversation;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create conversation';
        setError(message);
        console.error('Failed to create conversation:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [addConversation]
  );

  /**
   * Update conversation
   */
  const updateConversation = useCallback(
    async (id: string, updates: Partial<Conversation>): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await updateConversationStore(id, updates);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update conversation';
        setError(message);
        console.error('Failed to update conversation:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [updateConversationStore]
  );

  /**
   * Delete conversation
   */
  const deleteConversation = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await deleteConversationStore(id);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete conversation';
        setError(message);
        console.error('Failed to delete conversation:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [deleteConversationStore]
  );

  /**
   * Duplicate conversation
   */
  const duplicateConversation = useCallback(
    async (id: string): Promise<Conversation | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const original = conversations.find((c) => c.id === id);
        if (!original) {
          throw new Error('Conversation not found');
        }

        const duplicate: Conversation = {
          id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `${original.title} (Kopie)`,
          messages: original.messages.map((msg) => ({
            ...msg,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
        };

        await addConversation(duplicate);
        return duplicate;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to duplicate conversation';
        setError(message);
        console.error('Failed to duplicate conversation:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [conversations, addConversation]
  );

  /**
   * Toggle pin status
   */
  const togglePin = useCallback(
    async (id: string): Promise<void> => {
      const conversation = conversations.find((c) => c.id === id);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      await updateConversation(id, {
        isPinned: !conversation.isPinned,
      });
    },
    [conversations, updateConversation]
  );

  /**
   * Rename conversation
   */
  const renameConversation = useCallback(
    async (id: string, newTitle: string): Promise<void> => {
      if (!newTitle.trim()) {
        throw new Error('Title cannot be empty');
      }

      await updateConversation(id, { title: newTitle.trim() });
    },
    [updateConversation]
  );

  /**
   * Bulk delete conversations
   */
  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all(ids.map((id) => deleteConversationStore(id)));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete conversations';
        setError(message);
        console.error('Failed to bulk delete conversations:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [deleteConversationStore]
  );

  /**
   * Export conversation as JSON
   */
  const exportConversation = useCallback(
    async (id: string): Promise<string> => {
      const conversation = conversations.find((c) => c.id === id);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        conversation: {
          id: conversation.id,
          title: conversation.title,
          created_at: conversation.createdAt.toISOString(),
          updated_at: conversation.updatedAt.toISOString(),
          messages: conversation.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            attachments: msg.attachments,
            generation_type: msg.generationType,
            was_generated_with_c1: msg.wasGeneratedWithC1,
          })),
        },
      };

      return JSON.stringify(exportData, null, 2);
    },
    [conversations]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createConversation,
    updateConversation,
    deleteConversation,
    duplicateConversation,
    togglePin,
    renameConversation,
    bulkDelete,
    exportConversation,
    isLoading,
    error,
    clearError,
  };
}
