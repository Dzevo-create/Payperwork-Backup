/**
 * Hook for switching between conversations
 *
 * Provides:
 * - Switch to conversation with loading state
 * - Auto-save current conversation before switching
 * - Navigation to conversation from external source
 * - Keyboard shortcuts for switching
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore.supabase';
import { logger } from '@/lib/logger';

export interface UseConversationSwitchOptions {
  /** Auto-save current conversation before switching */
  autoSave?: boolean;
  /** Enable keyboard shortcuts (Cmd/Ctrl + 1-9) */
  enableKeyboardShortcuts?: boolean;
}

export interface UseConversationSwitchReturn {
  /** Switch to conversation */
  switchTo: (conversationId: string) => void;
  /** Go to previous conversation */
  goToPrevious: () => void;
  /** Go to next conversation */
  goToNext: () => void;
  /** Create and switch to new conversation */
  createAndSwitch: () => void;
  /** Loading state during switch */
  isSwitching: boolean;
}

/**
 * Hook for switching between conversations
 *
 * @example
 * ```tsx
 * const { switchTo, goToNext, goToPrevious } = useConversationSwitch({
 *   autoSave: true,
 *   enableKeyboardShortcuts: true
 * });
 *
 * // Switch to conversation
 * switchTo('conv-123');
 *
 * // Navigate with keyboard
 * // Cmd/Ctrl + ] = next conversation
 * // Cmd/Ctrl + [ = previous conversation
 * ```
 */
export function useConversationSwitch(
  options: UseConversationSwitchOptions = {}
): UseConversationSwitchReturn {
  const { autoSave = true, enableKeyboardShortcuts = false } = options;

  const [isSwitching, setIsSwitching] = useState(false);
  const router = useRouter();

  // Store state and actions
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const messages = useChatStore((state) => state.messages);
  const setCurrentConversationId = useChatStore(
    (state) => state.setCurrentConversationId
  );
  const setMessages = useChatStore((state) => state.setMessages);
  const updateConversation = useChatStore((state) => state.updateConversation);

  /**
   * Save current conversation before switching
   */
  const saveCurrentConversation = useCallback(async () => {
    if (!autoSave || !currentConversationId || messages.length === 0) {
      return;
    }

    try {
      // Update conversation with current messages
      // (Don't update updatedAt to prevent list reordering)
      await updateConversation(currentConversationId, {
        messages: [...messages],
      });
    } catch (error) {
      logger.error('Failed to save conversation before switch:', error);
    }
  }, [autoSave, currentConversationId, messages, updateConversation]);

  /**
   * Switch to conversation
   */
  const switchTo = useCallback(
    async (conversationId: string) => {
      if (conversationId === currentConversationId) {
        return; // Already on this conversation
      }

      setIsSwitching(true);

      try {
        // Save current conversation
        await saveCurrentConversation();

        // Find target conversation
        const targetConversation = conversations.find((c) => c.id === conversationId);

        if (!targetConversation) {
          logger.warn('Conversation not found:');
          return;
        }

        // Switch conversation
        setCurrentConversationId(conversationId);

        console.log(
          `Switched to conversation: ${conversationId} (${targetConversation.messages.length} messages)`
        );
      } catch (error) {
        logger.error('Failed to switch conversation:', error);
      } finally {
        setIsSwitching(false);
      }
    },
    [
      currentConversationId,
      conversations,
      saveCurrentConversation,
      setCurrentConversationId,
    ]
  );

  /**
   * Go to previous conversation
   */
  const goToPrevious = useCallback(() => {
    if (!currentConversationId || conversations.length === 0) {
      return;
    }

    const currentIndex = conversations.findIndex((c) => c.id === currentConversationId);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : conversations.length - 1;
    const previousConversation = conversations[previousIndex];

    if (previousConversation) {
      switchTo(previousConversation.id);
    }
  }, [currentConversationId, conversations, switchTo]);

  /**
   * Go to next conversation
   */
  const goToNext = useCallback(() => {
    if (!currentConversationId || conversations.length === 0) {
      return;
    }

    const currentIndex = conversations.findIndex((c) => c.id === currentConversationId);
    const nextIndex = currentIndex < conversations.length - 1 ? currentIndex + 1 : 0;
    const nextConversation = conversations[nextIndex];

    if (nextConversation) {
      switchTo(nextConversation.id);
    }
  }, [currentConversationId, conversations, switchTo]);

  /**
   * Create and switch to new conversation
   */
  const createAndSwitch = useCallback(async () => {
    // If current conversation is empty, don't create new one
    if (messages.length === 0) {
      return;
    }

    // Save current conversation
    await saveCurrentConversation();

    // Reset to empty state (new conversation will be created on first message)
    setCurrentConversationId(null);
    setMessages([]);

    // Navigate to chat page if not already there
    router.push('/chat');
  }, [messages, saveCurrentConversation, setCurrentConversationId, setMessages, router]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    if (!enableKeyboardShortcuts) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + ] = next conversation
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        goToNext();
      }

      // Cmd/Ctrl + [ = previous conversation
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        goToPrevious();
      }

      // Cmd/Ctrl + N = new conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createAndSwitch();
      }

      // Cmd/Ctrl + 1-9 = switch to conversation by index
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (conversations[index]) {
          switchTo(conversations[index].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboardShortcuts,
    conversations,
    goToNext,
    goToPrevious,
    createAndSwitch,
    switchTo,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    switchTo,
    goToPrevious,
    goToNext,
    createAndSwitch,
    isSwitching,
  };
}
