"use client";

import { useState, useRef, useEffect } from "react";
import { X, Search, Settings, User, MessageSquare, MoreVertical, Trash2, Copy, Edit2, LogOut, Moon, Bell } from "lucide-react";
import { SidebarHeader } from "./SidebarHeader";
import { NewChatButton } from "./NewChatButton";
import { SidebarSearch } from "./SidebarSearch";
import { SidebarFooter } from "./SidebarFooter";

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
  onSearchClick?: () => void;
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
  onSearchClick,
  onNewChat,
  conversations = [],
  currentConversationId,
  onLoadConversation,
  onDeleteConversation,
  onDuplicateConversation,
  onRenameConversation,
}: ChatSidebarProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showCollapsedSettings, setShowCollapsedSettings] = useState(false);
  const [showCollapsedProfile, setShowCollapsedProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const collapsedSettingsRef = useRef<HTMLDivElement>(null);
  const collapsedProfileRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
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

  // Auto-focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
    setActiveMenuId(null);
  };

  const handleFinishRename = (convId: string) => {
    if (editingTitle.trim()) {
      onRenameConversation?.(convId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle("");
  };

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
            <button
              onClick={onSearchClick}
              className="p-2 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-pw-black/60" />
            </button>
          </div>
        ) : (
          <>
            {/* New Chat Button */}
            <NewChatButton onClick={onNewChat} />

            {/* Search */}
            <SidebarSearch onSearchClick={onSearchClick} />

            {/* Chats Label */}
            <div className="px-4 py-2">
              <p className="text-xs text-pw-black/50 font-semibold">Chats</p>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-2 py-1">
              {conversations.length === 0 ? (
                <p className="text-sm text-pw-black/40 text-center px-4 py-8">
                  Keine Konversationen
                </p>
              ) : (
                <div className="space-y-0.5">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      <div
                        onClick={() => onLoadConversation?.(conv.id)}
                        className={`w-full p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                          currentConversationId === conv.id
                            ? "bg-pw-light"
                            : "hover:bg-pw-black/20 active:bg-pw-black/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-pw-black/60" />
                          <div className="flex-1 min-w-0">
                            {editingId === conv.id ? (
                              <input
                                ref={inputRef}
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={() => handleFinishRename(conv.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleFinishRename(conv.id);
                                  if (e.key === "Escape") {
                                    setEditingId(null);
                                    setEditingTitle("");
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs font-medium bg-white border border-pw-accent rounded px-1 py-0.5 outline-none"
                              />
                            ) : (
                              <p className="text-xs font-medium truncate text-pw-black/80">
                                {conv.title}
                              </p>
                            )}
                          </div>

                          {/* Three dots menu button */}
                          {editingId !== conv.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === conv.id ? null : conv.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-pw-black/20 rounded transition-all duration-200"
                            >
                              <MoreVertical className="w-3.5 h-3.5 text-pw-black/60" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      {activeMenuId === conv.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-2 top-full mt-1 w-40 bg-white rounded-xl shadow-2xl border border-pw-black/10 py-1 z-50"
                        >
                          <button
                            onClick={() => handleStartRename(conv)}
                            className="w-full px-3 py-2 text-left text-xs text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Umbenennen</span>
                          </button>
                          <button
                            onClick={() => {
                              onDuplicateConversation?.(conv.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplizieren</span>
                          </button>
                          <div className="border-t border-pw-black/10 my-1"></div>
                          <button
                            onClick={() => {
                              onDeleteConversation?.(conv.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-100 active:bg-red-200 transition-all duration-150 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Löschen</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
    </>
  );
}
