"use client";

import { useState, useEffect } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { requestQueue } from "@/lib/requestQueue";
import { useChatStore } from "@/store/chatStore.supabase";
import { Message } from "@/types/chat";
import { ToastMessage } from "@/components/shared/Toast";

interface BackgroundRequestIndicatorProps {
  onAddToast: (toast: Omit<ToastMessage, "id">) => void;
}

export function BackgroundRequestIndicator({ onAddToast }: BackgroundRequestIndicatorProps) {
  const [backgroundCount, setBackgroundCount] = useState(0);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const conversations = useChatStore((state) => state.conversations);

  // Update background request count
  useEffect(() => {
    const updateCount = () => {
      const bgRequests = requestQueue.getBackgroundRequests(currentConversationId);
      setBackgroundCount(bgRequests.length);
    };

    // Initial count
    updateCount();

    // Subscribe to queue changes
    const unsubscribe = requestQueue.subscribe(updateCount);

    return unsubscribe;
  }, [currentConversationId]);

  // Listen for background message received events
  useEffect(() => {
    const handleBackgroundMessage = (event: Event) => {
      const customEvent = event as CustomEvent<{ conversationId: string; message: Message }>;
      const { conversationId } = customEvent.detail;

      // Only show toast if this is truly a background conversation
      if (conversationId === currentConversationId) {
        return;
      }

      // Find the conversation name
      const conversation = conversations.find((c) => c.id === conversationId);
      const conversationName = conversation?.title || "Unknown Conversation";

      // Show a toast notification
      onAddToast({
        type: "info",
        message: `Response received in "${conversationName}"`,
        duration: 5000,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('backgroundMessageReceived', handleBackgroundMessage);

      return () => {
        window.removeEventListener('backgroundMessageReceived', handleBackgroundMessage);
      };
    }
    return undefined;
  }, [currentConversationId, conversations, onAddToast]);

  if (backgroundCount === 0) {
    return null;
  }

  const handleClick = () => {
    // Find the first background request
    const bgRequests = requestQueue.getBackgroundRequests(currentConversationId);
    if (bgRequests.length > 0) {
      const firstRequest = bgRequests[0];
      if (firstRequest) {
        setCurrentConversationId(firstRequest.conversationId);
      }
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        title={`${backgroundCount} request${backgroundCount > 1 ? 's' : ''} running in other conversations`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <MessageSquare className="w-4 h-4" />
        <span className="font-medium">{backgroundCount}</span>
      </button>
    </div>
  );
}
