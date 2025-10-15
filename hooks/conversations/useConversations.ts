/**
 * Hook for fetching and managing conversations list
 *
 * Provides:
 * - Conversations list with filters
 * - Loading and error states
 * - Refresh functionality
 * - Sorting and filtering utilities
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useChatStore } from '@/store/chatStore.supabase';
import { Conversation } from '@/types/chat';

export interface UseConversationsOptions {
  /** Auto-refresh on mount */
  autoFetch?: boolean;
  /** Filter: show only pinned conversations */
  pinnedOnly?: boolean;
  /** Filter: search query */
  searchQuery?: string;
  /** Sort order */
  sortBy?: 'updated_at' | 'created_at' | 'title';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

export interface UseConversationsReturn {
  /** All conversations */
  conversations: Conversation[];
  /** Filtered and sorted conversations */
  filteredConversations: Conversation[];
  /** Currently active conversation */
  currentConversation: Conversation | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Refresh conversations from database */
  refresh: () => Promise<void>;
  /** Check if conversation is active */
  isActive: (convId: string) => boolean;
}

/**
 * Hook for managing conversations list
 *
 * @example
 * ```tsx
 * const {
 *   filteredConversations,
 *   isLoading,
 *   refresh
 * } = useConversations({
 *   searchQuery: 'project',
 *   sortBy: 'updated_at'
 * });
 * ```
 */
export function useConversations(
  options: UseConversationsOptions = {}
): UseConversationsReturn {
  const {
    autoFetch = true,
    pinnedOnly = false,
    searchQuery = '',
    sortBy = 'updated_at',
    sortDirection = 'desc',
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get state from store
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const hydrate = useChatStore((state) => state.hydrate);
  const isHydrated = useChatStore((state) => state.isHydrated);

  // Refresh conversations from database
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await hydrate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(message);
      console.error('Failed to refresh conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [hydrate]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && !isHydrated) {
      refresh();
    }
  }, [autoFetch, isHydrated, refresh]);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Filter: Pinned only
    if (pinnedOnly) {
      filtered = filtered.filter((conv) => conv.isPinned);
    }

    // Filter: Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((conv) => {
        // Search in title
        if (conv.title.toLowerCase().includes(query)) {
          return true;
        }

        // Search in messages
        return conv.messages.some((msg) =>
          msg.content.toLowerCase().includes(query)
        );
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'updated_at':
          compareValue = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'created_at':
          compareValue = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'title':
          compareValue = a.title.localeCompare(b.title);
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    // Pinned conversations always at top (if not using pinnedOnly filter)
    if (!pinnedOnly) {
      const pinned = filtered.filter((c) => c.isPinned);
      const unpinned = filtered.filter((c) => !c.isPinned);
      filtered = [...pinned, ...unpinned];
    }

    return filtered;
  }, [conversations, pinnedOnly, searchQuery, sortBy, sortDirection]);

  // Get current conversation
  const currentConversation = useMemo(() => {
    if (!currentConversationId) return null;
    return conversations.find((conv) => conv.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  // Check if conversation is active
  const isActive = useCallback(
    (convId: string) => {
      return currentConversationId === convId;
    },
    [currentConversationId]
  );

  return {
    conversations,
    filteredConversations,
    currentConversation,
    isLoading,
    error,
    refresh,
    isActive,
  };
}
