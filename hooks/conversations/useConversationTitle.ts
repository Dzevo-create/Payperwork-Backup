/**
 * Hook for auto-generating conversation titles
 *
 * Provides:
 * - Auto-generate title from first message
 * - Regenerate title
 * - Manual title editing
 * - Title validation
 */

import { useCallback, useState } from 'react';
import { useChatStore } from '@/store/chatStore.supabase';
import { logger } from '@/lib/logger';

export interface UseConversationTitleReturn {
  /** Generate title from first message */
  generateTitle: (conversationId: string) => Promise<string>;
  /** Regenerate title */
  regenerateTitle: (conversationId: string) => Promise<string>;
  /** Update title manually */
  updateTitle: (conversationId: string, newTitle: string) => Promise<void>;
  /** Validate title */
  validateTitle: (title: string) => { valid: boolean; error?: string };
  /** Loading state */
  isGenerating: boolean;
  /** Error state */
  error: string | null;
}

/**
 * Hook for conversation title management
 *
 * @example
 * ```tsx
 * const {
 *   generateTitle,
 *   updateTitle,
 *   isGenerating
 * } = useConversationTitle();
 *
 * // Auto-generate from first message
 * const title = await generateTitle(conversationId);
 *
 * // Update manually
 * await updateTitle(conversationId, 'My Project Chat');
 * ```
 */
export function useConversationTitle(): UseConversationTitleReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversations = useChatStore((state) => state.conversations);
  const updateConversation = useChatStore((state) => state.updateConversation);

  /**
   * Generate title from first user message
   */
  const generateTitle = useCallback(
    async (conversationId: string): Promise<string> => {
      setIsGenerating(true);
      setError(null);

      const abortController = new AbortController();

      try {
        const conversation = conversations.find((c) => c.id === conversationId);
        if (!conversation) {
          throw new Error('Conversation not found');
        }

        // Find first user message
        const firstUserMessage = conversation.messages.find((m) => m.role === 'user');

        if (!firstUserMessage) {
          throw new Error('No user message found');
        }

        // Call API to generate title
        const response = await fetch('/api/generate-chat-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: firstUserMessage.content }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const { title } = await response.json();

        // Update conversation
        await updateConversation(conversationId, { title });

        logger.debug('Generated title:');
        return title;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          logger.debug('Title generation aborted');
          return '';
        }

        const message = err instanceof Error ? err.message : 'Failed to generate title';
        setError(message);
        logger.error('Failed to generate title:', err);

        // Fallback: Use first message content
        const conversation = conversations.find((c) => c.id === conversationId);
        const firstUserMessage = conversation?.messages.find((m) => m.role === 'user');
        const fallbackTitle =
          firstUserMessage?.content.slice(0, 50) || 'Neuer Chat';

        await updateConversation(conversationId, { title: fallbackTitle });
        return fallbackTitle;
      } finally {
        setIsGenerating(false);
      }
    },
    [conversations, updateConversation]
  );

  /**
   * Regenerate title (useful if first attempt was poor)
   */
  const regenerateTitle = useCallback(
    async (conversationId: string): Promise<string> => {
      // Same as generateTitle, but forces regeneration
      return generateTitle(conversationId);
    },
    [generateTitle]
  );

  /**
   * Update title manually
   */
  const updateTitle = useCallback(
    async (conversationId: string, newTitle: string): Promise<void> => {
      setError(null);

      // Validate
      const validation = validateTitle(newTitle);
      if (!validation.valid) {
        setError(validation.error || 'Invalid title');
        throw new Error(validation.error || 'Invalid title');
      }

      try {
        await updateConversation(conversationId, { title: newTitle.trim() });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update title';
        setError(message);
        throw err;
      }
    },
    [updateConversation]
  );

  /**
   * Validate title
   */
  const validateTitle = useCallback((title: string) => {
    if (!title || !title.trim()) {
      return { valid: false, error: 'Titel darf nicht leer sein' };
    }

    if (title.length > 100) {
      return { valid: false, error: 'Titel ist zu lang (max. 100 Zeichen)' };
    }

    if (title.trim().length < 3) {
      return { valid: false, error: 'Titel ist zu kurz (min. 3 Zeichen)' };
    }

    return { valid: true };
  }, []);

  return {
    generateTitle,
    regenerateTitle,
    updateTitle,
    validateTitle,
    isGenerating,
    error,
  };
}
