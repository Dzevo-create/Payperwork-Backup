/**
 * useConversationManager Hook
 *
 * Manages conversation lifecycle, chat name, and SuperChat mode.
 * Extracted from ChatArea.tsx for better separation of concerns.
 */

import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/store/chatStore.supabase";
import { DEFAULT_CHAT_NAME } from "@/config/chatArea";

export function useConversationManager() {
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const updateConversation = useChatStore((state) => state.updateConversation);

  const [chatName, setChatName] = useState(DEFAULT_CHAT_NAME);
  const [isSuperChatEnabled, setIsSuperChatEnabled] = useState(false);

  // Update chat name and SuperChat state when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      const currentConv = conversations.find(c => c.id === currentConversationId);
      if (currentConv) {
        setChatName(currentConv.title);
        setIsSuperChatEnabled(currentConv.isSuperChatEnabled ?? false);
      }
    } else {
      setChatName(DEFAULT_CHAT_NAME);
      setIsSuperChatEnabled(false);
    }
  }, [currentConversationId, conversations]);

  const handleChatNameChange = useCallback(async (newName: string) => {
    setChatName(newName);

    // Update conversation in store if we have a current conversation
    if (currentConversationId) {
      await updateConversation(currentConversationId, { title: newName });
    }
  }, [currentConversationId, updateConversation]);

  const handleSuperChatToggle = useCallback(async (enabled: boolean) => {
    setIsSuperChatEnabled(enabled);

    // Update conversation in store if we have a current conversation
    if (currentConversationId) {
      await updateConversation(currentConversationId, { isSuperChatEnabled: enabled });
    }
  }, [currentConversationId, updateConversation]);

  return {
    chatName,
    isSuperChatEnabled,
    handleChatNameChange,
    handleSuperChatToggle,
  };
}
