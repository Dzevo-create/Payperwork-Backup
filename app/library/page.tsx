"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "@/components/chat/Sidebar/ChatSidebar";
import { LibraryLayout } from "@/components/library/LibraryLayout";
import { LibraryErrorBoundary } from "@/components/library/LibraryErrorBoundary";
import { useChatStore } from "@/store/chatStore.supabase";

export default function LibraryPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const conversations = useChatStore((state) => state.conversations);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const addConversation = useChatStore((state) => state.addConversation);
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const setMessages = useChatStore((state) => state.setMessages);

  const handleLoadConversation = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      // FIX: Use Next.js router for client-side navigation (no full page reload)
      setCurrentConversationId(convId);
      router.push(`/chat?convId=${convId}`);
    }
  };

  const handleDuplicateConversation = (convId: string) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;

    const newConvId = Date.now().toString();
    const newConv = {
      ...conv,
      id: newConvId,
      title: `${conv.title} (Kopie)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addConversation(newConv);
  };

  const handleRenameConversation = (convId: string, newTitle: string) => {
    updateConversation(convId, { title: newTitle });
  };

  const handleNewChat = () => {
    // FIX: Use Next.js router for client-side navigation (no full page reload)
    setCurrentConversationId(null);
    setMessages([]);
    router.push("/chat");
  };

  return (
    <div className="h-screen bg-pw-dark overflow-hidden px-0 sm:px-1 md:px-2 py-0 sm:py-1">
      <div className="h-full flex gap-0 sm:gap-1 max-w-none mx-auto">
        {/* Sidebar */}
        <ChatSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onSearchClick={() => {}}
          onNewChat={handleNewChat}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onLoadConversation={handleLoadConversation}
          onDeleteConversation={deleteConversation}
          onDuplicateConversation={handleDuplicateConversation}
          onRenameConversation={handleRenameConversation}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-none sm:rounded-2xl shadow-lg bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-lg border-0 sm:border sm:border-pw-black/10">
          <LibraryErrorBoundary>
            <LibraryLayout />
          </LibraryErrorBoundary>
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
