/**
 * Conversation Sorter & Filter
 *
 * Utility functions for sorting and filtering conversations
 */

import { Conversation } from '@/types/chat';

export type SortBy = 'updated_at' | 'created_at' | 'title' | 'message_count';
export type SortDirection = 'asc' | 'desc';

/**
 * Sort conversations
 */
export function sortConversations(
  conversations: Conversation[],
  sortBy: SortBy = 'updated_at',
  direction: SortDirection = 'desc'
): Conversation[] {
  const sorted = [...conversations];

  sorted.sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'updated_at':
        compareValue = a.updatedAt.getTime() - b.updatedAt.getTime();
        break;

      case 'created_at':
        compareValue = a.createdAt.getTime() - b.createdAt.getTime();
        break;

      case 'title':
        compareValue = a.title.localeCompare(b.title, 'de', { sensitivity: 'base' });
        break;

      case 'message_count':
        compareValue = a.messages.length - b.messages.length;
        break;
    }

    return direction === 'asc' ? compareValue : -compareValue;
  });

  // Always put pinned conversations at the top
  const pinned = sorted.filter((c) => c.isPinned);
  const unpinned = sorted.filter((c) => !c.isPinned);

  return [...pinned, ...unpinned];
}

/**
 * Filter conversations by search query
 */
export function filterConversations(
  conversations: Conversation[],
  query: string
): Conversation[] {
  if (!query.trim()) {
    return conversations;
  }

  const lowerQuery = query.toLowerCase().trim();

  return conversations.filter((conv) => {
    // Search in title
    if (conv.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in messages
    return conv.messages.some((msg) =>
      msg.content.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Group conversations by date
 */
export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

export function groupConversationsByDate(
  conversations: Conversation[]
): ConversationGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);

  const groups: ConversationGroup[] = [
    { label: 'Heute', conversations: [] },
    { label: 'Gestern', conversations: [] },
    { label: 'Letzte 7 Tage', conversations: [] },
    { label: 'Letzte 30 Tage', conversations: [] },
    { label: 'Älter', conversations: [] },
  ];

  conversations.forEach((conv) => {
    const convDate = conv.updatedAt;

    if (convDate >= today) {
      groups[0]!.conversations.push(conv);
    } else if (convDate >= yesterday) {
      groups[1]!.conversations.push(conv);
    } else if (convDate >= lastWeek) {
      groups[2]!.conversations.push(conv);
    } else if (convDate >= lastMonth) {
      groups[3]!.conversations.push(conv);
    } else {
      groups[4]!.conversations.push(conv);
    }
  });

  // Filter out empty groups
  return groups.filter((group) => group.conversations.length > 0);
}

/**
 * Get conversation statistics
 */
export interface ConversationStats {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  pinnedConversations: number;
  conversationsWithImages: number;
  conversationsWithVideos: number;
}

export function getConversationStats(
  conversations: Conversation[]
): ConversationStats {
  const totalMessages = conversations.reduce(
    (sum, conv) => sum + conv.messages.length,
    0
  );

  return {
    totalConversations: conversations.length,
    totalMessages,
    averageMessagesPerConversation:
      conversations.length > 0 ? totalMessages / conversations.length : 0,
    pinnedConversations: conversations.filter((c) => c.isPinned).length,
    conversationsWithImages: conversations.filter((c) =>
      c.messages.some((m) => m.generationType === 'image')
    ).length,
    conversationsWithVideos: conversations.filter((c) =>
      c.messages.some((m) => m.generationType === 'video')
    ).length,
  };
}

/**
 * Find conversations with specific criteria
 */
export interface ConversationSearchCriteria {
  hasImages?: boolean;
  hasVideos?: boolean;
  isPinned?: boolean;
  minMessages?: number;
  maxMessages?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export function findConversations(
  conversations: Conversation[],
  criteria: ConversationSearchCriteria
): Conversation[] {
  return conversations.filter((conv) => {
    if (criteria.hasImages !== undefined) {
      const hasImages = conv.messages.some((m) => m.generationType === 'image');
      if (hasImages !== criteria.hasImages) return false;
    }

    if (criteria.hasVideos !== undefined) {
      const hasVideos = conv.messages.some((m) => m.generationType === 'video');
      if (hasVideos !== criteria.hasVideos) return false;
    }

    if (criteria.isPinned !== undefined) {
      if (conv.isPinned !== criteria.isPinned) return false;
    }

    if (criteria.minMessages !== undefined) {
      if (conv.messages.length < criteria.minMessages) return false;
    }

    if (criteria.maxMessages !== undefined) {
      if (conv.messages.length > criteria.maxMessages) return false;
    }

    if (criteria.createdAfter) {
      if (conv.createdAt < criteria.createdAfter) return false;
    }

    if (criteria.createdBefore) {
      if (conv.createdAt > criteria.createdBefore) return false;
    }

    return true;
  });
}
