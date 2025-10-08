"use client";

import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "./Sidebar/ChatSidebar";
import { ChatArea } from "./Chat/ChatArea";
import { SearchModal } from "./shared/SearchModal";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: {
    type: "image" | "pdf";
    url: string;
    name: string;
  }[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export function ChatLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Track if we've already created a conversation for the current chat
  const conversationCreatedRef = useRef(false);

  // Initialize with localStorage data
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem("payperwork_conversations");
      const savedCurrentId = localStorage.getItem("payperwork_current_conversation");

      if (savedConversations) {
        const parsed = JSON.parse(savedConversations);
        // Convert date strings back to Date objects
        const conversations = parsed.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(conversations);

        // Load the current conversation if it exists
        if (savedCurrentId) {
          const currentConv = conversations.find((c: any) => c.id === savedCurrentId);
          if (currentConv) {
            setCurrentConversationId(savedCurrentId);
            setMessages(currentConv.messages);
            conversationCreatedRef.current = true;
          }
        }
      }
    } catch (error) {
      console.error("Error loading conversations from localStorage:", error);
    }
  }, []);

  // Save to localStorage whenever conversations or current conversation changes
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem("payperwork_conversations", JSON.stringify(conversations));
      } catch (error) {
        console.error("Error saving conversations to localStorage:", error);
      }
    }
  }, [conversations]);

  useEffect(() => {
    try {
      if (currentConversationId) {
        localStorage.setItem("payperwork_current_conversation", currentConversationId);
      } else {
        localStorage.removeItem("payperwork_current_conversation");
      }
    } catch (error) {
      console.error("Error saving current conversation to localStorage:", error);
    }
  }, [currentConversationId]);

  // Auto-create conversation when first user message is sent (ChatGPT/Claude behavior)
  useEffect(() => {
    // Find first user message
    const firstUserMessage = messages.find((m) => m.role === "user");

    // Only create conversation if we have a user message, no currentConversationId yet, and haven't created one already
    if (firstUserMessage && !currentConversationId && !conversationCreatedRef.current) {
      conversationCreatedRef.current = true;
      const newConvId = Date.now().toString();
      setCurrentConversationId(newConvId);

      // Create conversation in sidebar with title from first message
      const title = firstUserMessage.content.slice(0, 50) || "Neuer Chat";

      const newConversation: Conversation = {
        id: newConvId,
        title,
        messages: [...messages],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setConversations((prev) => [newConversation, ...prev]);
    }
  }, [messages, currentConversationId]);

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
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? { ...conv, messages: [...messages], updatedAt: new Date() }
            : conv
        )
      );
    }
    // Note: If conversation doesn't exist, it should have been created automatically
    // when the first message was sent (see useEffect above)
  };

  // Handle new chat (ChatGPT/Claude behavior)
  const handleNewChat = () => {
    // If we're already on the welcome screen (no conversation), do nothing
    if (!currentConversationId && messages.length === 0) {
      return;
    }

    saveCurrentConversation();

    // If we're in an existing chat, create a new empty chat in sidebar immediately
    if (currentConversationId) {
      const newConvId = Date.now().toString();
      const newConversation: Conversation = {
        id: newConvId,
        title: "Neuer Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(newConvId);
      setMessages([]);
      conversationCreatedRef.current = true; // Mark as already created
    } else {
      // We're on welcome screen but have unsent messages - just reset
      setCurrentConversationId(null);
      setMessages([]);
      conversationCreatedRef.current = false;
    }
  };

  // Load a conversation
  const handleLoadConversation = (convId: string) => {
    saveCurrentConversation(); // Save current first

    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setCurrentConversationId(conv.id);
      setMessages(conv.messages);
    }
  };

  // Delete a conversation (ChatGPT/Claude behavior)
  const handleDeleteConversation = (convId: string) => {
    // Remove from conversations list
    setConversations((prev) => prev.filter((c) => c.id !== convId));

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
      setConversations((prev) => [duplicatedConv, ...prev]);
    }
  };

  // Rename a conversation
  const handleRenameConversation = (convId: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === convId
          ? { ...conv, title: newTitle, updatedAt: new Date() }
          : conv
      )
    );
  };

  return (
    <div className="h-screen bg-pw-dark overflow-hidden p-1">
      <div className="h-full flex gap-1 max-w-[1800px] mx-auto">
        {/* Sidebar Container */}
        <ChatSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onSearchClick={() => setIsSearchModalOpen(true)}
          onNewChat={handleNewChat}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onLoadConversation={handleLoadConversation}
          onDeleteConversation={handleDeleteConversation}
          onDuplicateConversation={handleDuplicateConversation}
          onRenameConversation={handleRenameConversation}
        />

        {/* Main Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-lg border border-pw-black/10">
          <ChatArea
            onMenuClick={() => setIsSidebarOpen(true)}
            messages={messages}
            setMessages={setMessages}
          />
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
    </div>
  );
}
