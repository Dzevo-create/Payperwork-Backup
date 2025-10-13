"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { ChatSidebar } from "./Sidebar/ChatSidebar";
import { SearchModal } from "./shared/SearchModal";
import { ErrorDisplay } from "./ErrorDisplay";
import { ToastContainer } from "@/components/shared/Toast";
import { useChatStore } from "@/store/chatStore.supabase";
import { useToastStore } from "@/hooks/useToast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useNavigationCleanup } from "@/hooks/useNavigationCleanup";
import { Conversation } from "@/types/chat";

// Dynamic import for ChatArea
const ChatArea = dynamic(() => import("./Chat/ChatArea").then((m) => ({ default: m.ChatArea })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen text-white">Loading Chat...</div>,
});

export function ChatLayout() {
  // Monitor online status and navigation cleanup
  useOnlineStatus();
  useNavigationCleanup();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Get state from Zustand store
  const messages = useChatStore((state) => state.messages);
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const isHydrated = useChatStore((state) => state.isHydrated);
  const hydrate = useChatStore((state) => state.hydrate);

  // Toast state
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const setMessages = useChatStore((state) => state.setMessages);
  const addConversation = useChatStore((state) => state.addConversation);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);

  // Track if we've already created a conversation for the current chat
  const conversationCreatedRef = useRef(false);

  // Restore current conversation messages on mount/refresh
  // Ref to track if we've already restored (prevents restore during streaming)
  const hasRestoredRef = useRef(false);

  // Track if we've loaded from URL parameter (to prevent re-running the effect)
  const hasLoadedFromUrlRef = useRef(false);

  // Load conversations from Supabase on mount
  useEffect(() => {
    if (!isHydrated) {
      console.log('💧 Hydrating store from Supabase...');
      hydrate();
    }
  }, [isHydrated, hydrate]);

  // Handle URL parameter for conversation loading (from library page)
  useEffect(() => {
    if (!isHydrated || conversations.length === 0) return; // Wait for hydration and conversations
    if (hasLoadedFromUrlRef.current) return; // Already loaded from URL

    const params = new URLSearchParams(window.location.search);
    const convId = params.get('convId');

    if (convId && convId !== currentConversationId) {
      console.log('📋 Loading conversation from URL parameter:', convId);
      const conv = conversations.find((c) => c.id === convId);
      if (conv) {
        hasRestoredRef.current = true; // Prevent duplicate restore
        hasLoadedFromUrlRef.current = true; // Mark as loaded from URL
        setCurrentConversationId(conv.id); // This automatically loads messages from store
        // Clean up URL parameter
        window.history.replaceState({}, '', '/chat');
        console.log('✅ Conversation loaded from URL:', conv.id, 'with', conv.messages.length, 'messages');
      } else {
        console.warn('⚠️ Conversation from URL not found:', convId);
        hasLoadedFromUrlRef.current = true; // Mark as attempted
        // Clean up invalid URL parameter
        window.history.replaceState({}, '', '/chat');
      }
    }
  }, [isHydrated, conversations, setCurrentConversationId]);

  useEffect(() => {
    // Mark as restored if we have a currentConversationId after hydration
    // This happens when the store restored from localStorage
    if (isHydrated && currentConversationId && !hasRestoredRef.current) {
      console.log('✅ Conversation already restored by store:', currentConversationId);
      hasRestoredRef.current = true;
    }

    // Reset restore flag when conversation changes to null (new chat)
    if (!currentConversationId && hasRestoredRef.current) {
      hasRestoredRef.current = false;
    }
  }, [isHydrated, currentConversationId]);

  // Auto-generate title for existing conversation when first user message is sent
  useEffect(() => {
    // Safety check: ensure messages is an array
    if (!Array.isArray(messages)) {
      console.error("⚠️ ChatLayout: messages is not an array");
      return;
    }

    // Find first user message
    const firstUserMessage = messages.find((m) => m.role === "user");

    // Only generate title if we already have a conversation and user message, but haven't done this yet
    // NOTE: Conversation is now created in ChatArea BEFORE first message!
    if (firstUserMessage && currentConversationId && !conversationCreatedRef.current) {
      conversationCreatedRef.current = true;

      // Generate professional title from first message
      const generateTitle = async () => {
        try {
          const response = await fetch("/api/generate-chat-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: firstUserMessage.content }),
          });

          if (response.ok) {
            const { title } = await response.json();

            // Update conversation with generated title
            console.log("🎯 Updating conversation with title:", title, "for ID:", currentConversationId);
            updateConversation(currentConversationId, { title });
            console.log("✅ Chat title generated:", title);
          } else {
            console.error("❌ Title generation API failed with status:", response.status);
            throw new Error("Title generation failed");
          }
        } catch (error) {
          console.error("Failed to generate chat title:", error);
          // Fallback to simple title if API fails
          const fallbackTitle = firstUserMessage.content.slice(0, 50) || "Neuer Chat";
          updateConversation(currentConversationId, { title: fallbackTitle });
        }
      };

      // Generate title asynchronously - wrapped in catch to prevent page crashes
      generateTitle().catch((error) => {
        // Failsafe: If any uncaught error escapes, log it and use fallback title
        console.error("Uncaught error in generateTitle:", error);
        const fallbackTitle = firstUserMessage.content.slice(0, 50) || "Neuer Chat";
        updateConversation(currentConversationId, { title: fallbackTitle });
      });
    }
  }, [messages, currentConversationId, updateConversation]);

  // CMD+K / CTRL+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Save current conversation (update only - creation happens automatically)
  const saveCurrentConversation = () => {
    if (messages.length === 0 || !currentConversationId) return;

    const existingConv = conversations.find((c) => c.id === currentConversationId);

    if (existingConv) {
      // Update existing conversation
      updateConversation(currentConversationId, {
        messages: [...messages],
        updatedAt: new Date(),
      });
    }
  };

  // Handle new chat (ChatGPT/Claude behavior)
  const handleNewChat = () => {
    // If current chat is empty (no messages), do nothing - we're already in a fresh chat
    if (messages.length === 0) {
      return;
    }

    // If we're in an existing chat with messages, save it and reset to welcome screen
    if (currentConversationId) {
      // Save current conversation WITHOUT updating updatedAt (to prevent jumping to top)
      const existingConv = conversations.find((c) => c.id === currentConversationId);
      if (existingConv) {
        updateConversation(currentConversationId, {
          messages: [...messages],
          // Don't update updatedAt - keep original position in list
        });
      }
    }

    // Reset to welcome screen - conversation will be auto-created when first message is sent
    setCurrentConversationId(null);
    setMessages([]);
    conversationCreatedRef.current = false;
  };

  // Load a conversation
  const handleLoadConversation = (convId: string) => {
    console.log("🔄 Loading conversation:", convId);

    // Don't save current conversation on load - this causes unnecessary updatedAt changes
    // that trigger re-sorting and jumping. Save happens naturally through message updates.

    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      console.log("✅ Found conversation, loading messages:", conv.messages.length);

      // Mark as restored FIRST to prevent useEffect from interfering
      hasRestoredRef.current = true;

      // If we need to navigate, do it in a way that preserves state
      if (pathname !== "/chat") {
        console.log("🔀 Navigating to /chat");
        // setCurrentConversationId already loads messages from store, no need to call setMessages
        setCurrentConversationId(conv.id);
        // Navigate after state is set
        router.push("/chat");
      } else {
        // Already on chat page, just update state
        // setCurrentConversationId already loads messages from store
        setCurrentConversationId(conv.id);
      }

      console.log("✅ Conversation loaded:", conv.id, "with", conv.messages.length, "messages");
    } else {
      console.warn("⚠️ Conversation not found:", convId);
    }
  };

  // Delete a conversation (ChatGPT/Claude behavior)
  const handleDeleteConversation = (convId: string) => {
    // Remove from conversations list
    deleteConversation(convId);

    // If we're deleting the current conversation, reset to welcome screen
    if (convId === currentConversationId) {
      setCurrentConversationId(null);
      setMessages([]);
      conversationCreatedRef.current = false; // Reset the ref
    }
  };

  // Duplicate a conversation
  const handleDuplicateConversation = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      const newConvId = Date.now().toString();
      const duplicatedConv: Conversation = {
        ...conv,
        id: newConvId,
        title: `${conv.title} (Kopie)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addConversation(duplicatedConv);
    }
  };

  // Rename a conversation
  const handleRenameConversation = (convId: string, newTitle: string) => {
    updateConversation(convId, { title: newTitle });
  };

  return (
    <div className="h-screen bg-pw-dark overflow-hidden px-0 sm:px-1 md:px-2 py-0 sm:py-1">
      <div className="h-full flex gap-0 sm:gap-1 max-w-none mx-auto">
        {/* Sidebar Container */}
        <ChatSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onNewChat={handleNewChat}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onLoadConversation={handleLoadConversation}
          onDeleteConversation={handleDeleteConversation}
          onDuplicateConversation={handleDuplicateConversation}
          onRenameConversation={handleRenameConversation}
        />

        {/* Main Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-none sm:rounded-2xl shadow-lg bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-lg border-0 sm:border sm:border-pw-black/10">
          <ChatArea onMenuClick={() => setIsSidebarOpen(true)} />
        </div>

        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-pw-black/50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearch={(query) => {
          console.log("Search:", query);
          // Future: implement search logic
        }}
      />

      {/* Error Display */}
      <ErrorDisplay />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
