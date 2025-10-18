"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useChatSearch } from "@/hooks/chat/useChatSearch";
import { SearchResultItem } from "./SearchResultItem";
import type { Attachment } from "@/types/chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onNavigateToChat: (conversationId: string, messageId?: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  conversations,
  onNavigateToChat,
}: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedIndex,
    navigateDown,
    navigateUp,
    clearSearch,
  } = useChatSearch(conversations);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      clearSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateDown();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateUp();
      } else if (e.key === "Enter" && searchResults.length > 0) {
        e.preventDefault();
        const result = searchResults[selectedIndex];
        if (result) {
          onNavigateToChat(result.conversationId, result.messageId);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, navigateDown, navigateUp, onClose, onNavigateToChat]);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && searchResults.length > 0) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, searchResults]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-pw-black/10">
          <Search className="w-5 h-5 text-pw-black/40 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chat durchsuchen..."
            className="flex-1 bg-transparent outline-none text-base text-pw-black placeholder:text-pw-black/40"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-pw-black/5 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-pw-black/40" />
          </button>
        </div>

        {/* Search Results */}
        <div
          ref={resultsRef}
          className="max-h-[60vh] overflow-y-auto overscroll-contain"
        >
          {searchQuery.trim() === "" ? (
            <div className="py-12 text-center text-pw-black/40">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Beginne mit der Suche nach Chats...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center text-pw-black/40">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Keine Ergebnisse für "{searchQuery}"</p>
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <SearchResultItem
                  key={`${result.conversationId}-${result.messageId}-${index}`}
                  conversationTitle={result.conversationTitle}
                  messageContent={result.messageContent}
                  timestamp={result.timestamp}
                  searchQuery={searchQuery}
                  isSelected={index === selectedIndex}
                  onClick={() => {
                    onNavigateToChat(result.conversationId, result.messageId);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        {searchResults.length > 0 && (
          <div className="px-4 py-2 border-t border-pw-black/10 bg-pw-black/5">
            <div className="flex items-center gap-4 text-xs text-pw-black/40">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-pw-black/10">
                  ↑↓
                </kbd>
                Navigieren
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-pw-black/10">
                  Enter
                </kbd>
                Öffnen
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-pw-black/10">
                  Esc
                </kbd>
                Schließen
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
