"use client";

import { useMemo } from "react";
import { ConversationItem } from "./ConversationItem";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string | null;
  isOnChatPage: boolean;
  onLoadConversation?: (convId: string) => void;
  onDeleteConversation?: (convId: string) => void;
  onDuplicateConversation?: (convId: string) => void;
  onRenameConversation?: (convId: string, newTitle: string) => void;
}

export function ConversationList({
  conversations,
  currentConversationId,
  isOnChatPage,
  onLoadConversation,
  onDeleteConversation,
  onDuplicateConversation,
  onRenameConversation,
}: ConversationListProps) {
  // Sort conversations with useMemo to prevent jumping
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();

      // Primary sort: by time
      if (timeB !== timeA) {
        return timeB - timeA;
      }

      // Secondary sort: by ID for stability
      return a.id.localeCompare(b.id);
    });
  }, [conversations]);

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-pw-black/40 text-center px-4 py-8">
        Keine Konversationen
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {sortedConversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={isOnChatPage && currentConversationId === conv.id}
          onLoadConversation={onLoadConversation}
          onDeleteConversation={onDeleteConversation}
          onDuplicateConversation={onDuplicateConversation}
          onRenameConversation={onRenameConversation}
        />
      ))}
    </div>
  );
}
