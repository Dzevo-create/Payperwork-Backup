import { useState, useEffect, useMemo, useCallback } from "react";
import { chatLogger } from '@/lib/logger';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: any[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  messageContent: string;
  messageRole: "user" | "assistant";
  timestamp: Date;
  matchIndex: number;
}

export function useChatSearch(conversations: Conversation[], limit: number = 50) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    chatLogger.debug('[Search] Query:');

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    conversations.forEach((conv) => {
      chatLogger.debug('[Search] Checking conversation "${conv.title}" with ${conv.messages?.length || 0} messages');

      // Safety check: ensure messages array exists
      if (!conv.messages || !Array.isArray(conv.messages)) {
        chatLogger.warn('[Search] Conversation ${conv.id} has no messages array');
        return;
      }

      conv.messages.forEach((msg) => {
        const content = msg.content.toLowerCase();
        const matchIndex = content.indexOf(query);

        if (matchIndex !== -1) {
          chatLogger.info('[Search] Match found in message: "${msg.content.substring(0, 50)}...');
          results.push({
            conversationId: conv.id,
            conversationTitle: conv.title,
            messageId: msg.id,
            messageContent: msg.content,
            messageRole: msg.role,
            timestamp: msg.timestamp,
            matchIndex,
          });
        }
      });

      // Also search in conversation titles
      const titleIndex = conv.title.toLowerCase().indexOf(query);
      if (titleIndex !== -1 && conv.messages.length > 0) {
        chatLogger.info('[Search] Match found in title: "${conv.title}');
        const firstMessage = conv.messages[0]!;
        results.push({
          conversationId: conv.id,
          conversationTitle: conv.title,
          messageId: firstMessage.id,
          messageContent: conv.title,
          messageRole: "user",
          timestamp: conv.updatedAt,
          matchIndex: titleIndex,
        });
      }
    });

    chatLogger.debug('[Search] Total results: ${results.length}');

    // Sort by most recent
    results.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return results.slice(0, limit);
  }, [searchQuery, conversations, limit]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  const navigateDown = useCallback(() => {
    setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev));
  }, [searchResults.length]);

  const navigateUp = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSelectedIndex(0);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedIndex,
    setSelectedIndex,
    navigateDown,
    navigateUp,
    clearSearch,
  };
}
