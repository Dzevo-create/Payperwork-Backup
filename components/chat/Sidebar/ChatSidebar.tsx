"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, Settings, User, LogOut, Moon, Bell, Library } from "lucide-react";
import { SidebarHeader } from "./SidebarHeader";
import { NewChatButton } from "./NewChatButton";
import { SidebarSearch } from "./SidebarSearch";
import { SidebarFooter } from "./SidebarFooter";
import { SearchModal } from "./SearchModal";
import { ConversationList } from "./ConversationList";
import { NavigationSection } from "./NavigationSection";
import { WorkflowList } from "./WorkflowList";
import { useLibraryStore } from "@/store/libraryStore.v2";

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

interface ChatSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNewChat?: () => void;
  conversations?: Conversation[];
  currentConversationId?: string | null;
  onLoadConversation?: (convId: string) => void;
  onDeleteConversation?: (convId: string) => void;
  onDuplicateConversation?: (convId: string) => void;
  onRenameConversation?: (convId: string, newTitle: string) => void;
}

export function ChatSidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  onNewChat,
  conversations = [],
  currentConversationId,
  onLoadConversation,
  onDeleteConversation,
  onDuplicateConversation,
  onRenameConversation,
}: ChatSidebarProps) {
  const [showCollapsedSettings, setShowCollapsedSettings] = useState(false);
  const [showCollapsedProfile, setShowCollapsedProfile] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const collapsedSettingsRef = useRef<HTMLDivElement>(null);
  const collapsedProfileRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const unseenCount = useLibraryStore((state) => state.unseenCount);

  // Only show active conversation if we're on the chat page
  const isOnChatPage = pathname === "/chat" || pathname === "/";

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Handle navigation from search modal
  const handleNavigateToChat = (conversationId: string, messageId?: string) => {
    onLoadConversation?.(conversationId);

    // Scroll to specific message after navigation
    if (messageId) {
      // Clear previous timeouts if they exist
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }

      // Use setTimeout to wait for navigation to complete
      scrollTimeoutRef.current = setTimeout(() => {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight the message briefly
          messageElement.style.transition = "background-color 0.3s ease";
          messageElement.style.backgroundColor = "rgba(255, 200, 0, 0.2)";
          highlightTimeoutRef.current = setTimeout(() => {
            messageElement.style.backgroundColor = "";
          }, 2000);
        }
      }, 300);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collapsedSettingsRef.current && !collapsedSettingsRef.current.contains(event.target as Node)) {
        setShowCollapsedSettings(false);
      }
      if (collapsedProfileRef.current && !collapsedProfileRef.current.contains(event.target as Node)) {
        setShowCollapsedProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-[60] inset-y-0 left-0 md:inset-y-auto
          md:h-full
          bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-lg
          md:rounded-2xl md:shadow-lg
          border md:border-pw-black/10
          flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? "overflow-visible" : "overflow-hidden"}
          ${isCollapsed ? "w-[60px]" : "w-[280px]"}
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden p-2 hover:bg-pw-black/5 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-pw-black/60" />
        </button>

        {/* Header */}
        <SidebarHeader isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />

        {/* Collapsed View - Only Icons */}
        {isCollapsed ? (
          <div className="flex-1 flex flex-col items-center gap-3 py-4">
            <button
              onClick={onNewChat}
              className="p-2 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-colors"
              aria-label="New Chat"
            >
              <span className="text-lg font-bold text-pw-black/60">+</span>
            </button>
          </div>
        ) : (
          <>
            {/* New Chat Button */}
            <NewChatButton onClick={onNewChat} />

            {/* Search */}
            <SidebarSearch onClick={() => setIsSearchModalOpen(true)} />

            {/* Library Link */}
            <div className="px-2 pb-2">
              <button
                onClick={() => router.push("/library")}
                className="w-full p-3 rounded-lg hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-200 flex items-center gap-3 group relative"
              >
                <Library className="w-4 h-4 text-pw-black/60 group-hover:text-pw-black/80 transition-colors" />
                <span className="text-sm font-medium text-pw-black/70 group-hover:text-pw-black/90 transition-colors">
                  Bibliothek
                </span>
                {unseenCount > 0 && (
                  <span className="ml-auto bg-pw-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unseenCount}
                  </span>
                )}
              </button>
            </div>

            {/* Workflows Section */}
            <div className="px-2 pb-2">
              <NavigationSection title="Workflows">
                <WorkflowList />
              </NavigationSection>
            </div>

            {/* Chats Section */}
            <div className="px-4 py-2">
              <p className="text-xs text-pw-black/50 font-semibold uppercase tracking-wide">Chats</p>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-2 py-1">
              <ConversationList
                conversations={conversations}
                currentConversationId={currentConversationId}
                isOnChatPage={isOnChatPage}
                onLoadConversation={onLoadConversation}
                onDeleteConversation={onDeleteConversation}
                onDuplicateConversation={onDuplicateConversation}
                onRenameConversation={onRenameConversation}
              />
            </div>

            {/* Footer */}
            <SidebarFooter credits={3000} />
          </>
        )}

        {/* Collapsed Footer - Only Icons */}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-3 pb-4">
            {/* Settings Dropdown */}
            <div className="relative" ref={collapsedSettingsRef}>
              <button
                onClick={() => setShowCollapsedSettings(!showCollapsedSettings)}
                className="p-2 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-pw-black/60" />
              </button>

              {showCollapsedSettings && (
                <div className="absolute bottom-0 left-full ml-2 w-48 bg-white rounded-xl shadow-2xl border border-pw-black/10 py-2 z-[9999]">
                  <button className="w-full px-4 py-2 text-left text-sm text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-3">
                    <Moon className="w-4 h-4" />
                    <span>Dark Mode</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-3">
                    <Bell className="w-4 h-4" />
                    <span>Benachrichtigungen</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={collapsedProfileRef}>
              <button
                onClick={() => setShowCollapsedProfile(!showCollapsedProfile)}
                className="p-2 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-colors"
                aria-label="Profile"
              >
                <User className="w-4 h-4 text-pw-black/60" />
              </button>

              {showCollapsedProfile && (
                <div className="absolute bottom-0 left-full ml-2 w-52 bg-white rounded-xl shadow-2xl border border-pw-black/10 py-2 z-[9999]">
                  <div className="px-4 py-2 border-b border-pw-black/10">
                    <p className="text-sm font-semibold text-pw-black">Benutzer</p>
                    <p className="text-xs text-pw-black/60">user@example.com</p>
                  </div>
                  {/* Credits in Dropdown */}
                  <div className="px-4 py-3 border-b border-pw-black/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-pw-black/60">Credits</span>
                      <span className="text-sm font-bold text-pw-accent">3000</span>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 text-left text-sm text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-3">
                    <User className="w-4 h-4" />
                    <span>Profil bearbeiten</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-red-100 active:bg-red-200 transition-all duration-150 flex items-center gap-3 text-red-600">
                    <LogOut className="w-4 h-4" />
                    <span>Abmelden</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        conversations={conversations}
        onNavigateToChat={handleNavigateToChat}
      />
    </>
  );
}
