"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChatSidebar } from "./Sidebar/ChatSidebar";
import { SlidesWorkflowContainer } from "@/components/slides/workflow/SlidesWorkflowContainer";
import { useSlidesSocket } from "@/hooks/slides/useSlidesSocket";
import { SearchModal } from "./shared/SearchModal";
import { ErrorDisplay } from "./ErrorDisplay";
import { ToastContainer } from "@/components/shared/Toast";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useChatStore } from "@/store/chatStore.supabase";
import { useToastStore } from "@/hooks/useToast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useNavigationCleanup } from "@/hooks/useNavigationCleanup";
import { Conversation } from "@/types/chat";
import { chatLogger } from '@/lib/logger';

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
  const searchParams = useSearchParams();
  const workflow = searchParams.get('workflow');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get state from Zustand store
  const messages = useChatStore((state) => state.messages);
  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const isHydrated = useChatStore((state) => state.isHydrated);
  const hydrate = useChatStore((state) => state.hydrate);
  const isGenerating = useChatStore((state) => state.isGenerating);

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

  // AbortController for title generation
  const titleAbortControllerRef = useRef<AbortController | null>(null);

  // Load user for WebSocket
  useEffect(() => {
    const loadUser = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    loadUser();
  }, []);

  // Connect to Slides WebSocket
  useSlidesSocket(userId);

  // Load conversations from Supabase on mount (ONLY ONCE per session)
  useEffect(() => {
    if (!isHydrated) {
      chatLogger.debug('💧 Hydrating store from Supabase...');
      hydrate();
    }
  }, []); // Empty dependency array - only run once on app startup

  // Cleanup title generation on unmount
  useEffect(() => {
    return () => {
      if (titleAbortControllerRef.current) {
        titleAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle URL parameter for conversation loading (from library page)
  useEffect(() => {
    if (!isHydrated || conversations.length === 0) return; // Wait for hydration and conversations
    if (hasLoadedFromUrlRef.current) return; // Already loaded from URL

    const params = new URLSearchParams(window.location.search);
    const convId = params.get('convId');

    if (convId && convId !== currentConversationId) {
      chatLogger.info('📋 Loading conversation from URL parameter:');
      const conv = conversations.find((c) => c.id === convId);
      if (conv) {
        hasRestoredRef.current = true; // Prevent duplicate restore
        hasLoadedFromUrlRef.current = true; // Mark as loaded from URL
        setCurrentConversationId(conv.id); // This automatically loads messages from store
        // Clean up URL parameter
        window.history.replaceState({}, '', '/chat');
        chatLogger.info('Conversation loaded from URL:');
      } else {
        chatLogger.warn('Conversation from URL not found:');
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
      chatLogger.info('Conversation already restored by store:');
      hasRestoredRef.current = true;
    }

    // Reset restore flag when conversation changes to null (new chat)
    if (!currentConversationId && hasRestoredRef.current) {
      hasRestoredRef.current = false;
    }
  }, [isHydrated, currentConversationId]);

  // Track when generation completes to trigger title generation
  const prevIsGeneratingRef = useRef(isGenerating);

  // Auto-generate title AFTER streaming completes (prevents race condition)
  useEffect(() => {
    // Detect when generation just completed
    const wasGenerating = prevIsGeneratingRef.current;
    const isNowNotGenerating = !isGenerating;
    const generationJustCompleted = wasGenerating && isNowNotGenerating;

    prevIsGeneratingRef.current = isGenerating;

    if (!generationJustCompleted) return;

    // Safety check: ensure messages is an array
    if (!Array.isArray(messages)) {
      chatLogger.error('ChatLayout: messages is not an array');
      return;
    }

    // Find first user message
    const firstUserMessage = messages.find((m) => m.role === "user");

    // Generate title now that generation is complete
    if (firstUserMessage && currentConversationId && !conversationCreatedRef.current) {
      conversationCreatedRef.current = true;

      const generateTitle = async () => {
        try {
          // Create new AbortController for this title generation
          titleAbortControllerRef.current = new AbortController();

          const response = await fetch("/api/generate-chat-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: firstUserMessage.content }),
            signal: titleAbortControllerRef.current.signal,
          });

          if (response.ok) {
            const { title } = await response.json();
            chatLogger.debug('Updating conversation with title:', { conversationId: currentConversationId });
            updateConversation(currentConversationId, { title });
            chatLogger.info('Chat title generated:');
          } else {
            throw new Error("Title generation failed");
          }

          titleAbortControllerRef.current = null;
        } catch (error) {
          // Handle AbortError
          if (error instanceof Error && error.name === 'AbortError') {
            chatLogger.debug('Title generation aborted');
            return;
          }

          chatLogger.error('Failed to generate chat title:', error instanceof Error ? error : undefined);
          const fallbackTitle = firstUserMessage.content.slice(0, 50) || "Neuer Chat";
          updateConversation(currentConversationId, { title: fallbackTitle });
        }
      };

      generateTitle().catch((error) => {
        chatLogger.error('Uncaught error in generateTitle:', error);
        const fallbackTitle = firstUserMessage.content.slice(0, 50) || "Neuer Chat";
        updateConversation(currentConversationId, { title: fallbackTitle });
      });
    }
  }, [isGenerating, messages, currentConversationId, updateConversation]);

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
    chatLogger.info('Loading conversation:');

    // Don't save current conversation on load - this causes unnecessary updatedAt changes
    // that trigger re-sorting and jumping. Save happens naturally through message updates.

    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      chatLogger.info('Found conversation, loading messages:');

      // Mark as restored FIRST to prevent useEffect from interfering
      hasRestoredRef.current = true;

      // If we need to navigate, do it in a way that preserves state
      if (pathname !== "/chat") {
        chatLogger.debug('🔀 Navigating to /chat');
        // setCurrentConversationId already loads messages from store, no need to call setMessages
        setCurrentConversationId(conv.id);
        // Navigate after state is set
        router.push("/chat");
      } else {
        // Already on chat page, just update state
        // setCurrentConversationId already loads messages from store
        setCurrentConversationId(conv.id);
      }

      chatLogger.info('Conversation loaded:');
    } else {
      chatLogger.warn('Conversation not found:');
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
    <ErrorBoundary>
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
          {workflow === 'slides' ? (
            <SlidesWorkflowContainer />
          ) : (
            <ChatArea onMenuClick={() => setIsSidebarOpen(true)} />
          )}
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
        onSearch={(_query) => {
          chatLogger.debug('Search:');
          // Future: implement search logic
        }}
      />

      {/* Error Display */}
      <ErrorDisplay />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </ErrorBoundary>
  );
}
