"use client";

import { MessageSquare, Clock } from "lucide-react";
import { formatDateShort } from "@/lib/utils/dateUtils";

interface SearchResultItemProps {
  conversationTitle: string;
  messageContent: string;
  timestamp: Date;
  searchQuery: string;
  isSelected: boolean;
  onClick: () => void;
}

export function SearchResultItem({
  conversationTitle,
  messageContent,
  timestamp,
  searchQuery,
  isSelected,
  onClick,
}: SearchResultItemProps) {
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

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 text-left transition-colors ${
        isSelected ? "bg-pw-accent/10" : "hover:bg-pw-black/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="w-4 h-4 text-pw-black/40 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-pw-black truncate">
              {conversationTitle}
            </span>
            <span className="text-xs text-pw-black/40 flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" />
              {formatDateShort(timestamp)}
            </span>
          </div>
          <p className="text-sm text-pw-black/60 line-clamp-2">
            {highlightText(messageContent, searchQuery)}
          </p>
        </div>
      </div>
    </button>
  );
}
