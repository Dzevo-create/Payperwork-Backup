"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, MessageSquare, Clock } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: any[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface SearchResult {
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  messageContent: string;
  messageRole: "user" | "assistant";
  timestamp: Date;
  matchIndex: number;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchQuery("");
      setSearchResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
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
  }, [isOpen, searchResults, selectedIndex, onClose, onNavigateToChat]);

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

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        const content = msg.content.toLowerCase();
        const matchIndex = content.indexOf(query);

        if (matchIndex !== -1) {
          results.push({
            conversationId: conv.id,
            conversationTitle: conv.title,
            messageId: msg.id,
            messageContent: msg.content,
            messageRole: msg.role,
            timestamp: msg.timestamp,
            matchIndex,
          });
        }
      });

      // Also search in conversation titles
      const titleIndex = conv.title.toLowerCase().indexOf(query);
      if (titleIndex !== -1 && conv.messages.length > 0) {
        const firstMessage = conv.messages[0];
        results.push({
          conversationId: conv.id,
          conversationTitle: conv.title,
          messageId: firstMessage.id,
          messageContent: conv.title,
          messageRole: "user",
          timestamp: conv.updatedAt,
          matchIndex: titleIndex,
        });
      }
    });

    // Sort by most recent
    results.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setSearchResults(results.slice(0, 50)); // Limit to 50 results
    setSelectedIndex(0);
  }, [searchQuery, conversations]);

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;

    // Get context around the match (50 chars before and after)
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 150);
    let snippet = text.slice(start, end);

    if (start > 0) snippet = "..." + snippet;
    if (end < text.length) snippet = snippet + "...";

    // Highlight the matching part
    const lowerSnippet = snippet.toLowerCase();
    const matchIndex = lowerSnippet.indexOf(query.toLowerCase());

    if (matchIndex === -1) return snippet;

    const before = snippet.slice(0, matchIndex);
    const match = snippet.slice(matchIndex, matchIndex + query.length);
    const after = snippet.slice(matchIndex + query.length);

    return (
      <>
        {before}
        <mark className="bg-pw-accent/30 text-pw-black font-medium">{match}</mark>
        {after}
      </>
    );
  };

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
                <button
                  key={`${result.conversationId}-${result.messageId}-${index}`}
                  onClick={() => {
                    onNavigateToChat(result.conversationId, result.messageId);
                    onClose();
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-pw-accent/10"
                      : "hover:bg-pw-black/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-pw-black/40 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-pw-black truncate">
                          {result.conversationTitle}
                        </span>
                        <span className="text-xs text-pw-black/40 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(result.timestamp).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-pw-black/60 line-clamp-2">
                        {highlightText(result.messageContent, searchQuery)}
                      </p>
                    </div>
                  </div>
                </button>
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
