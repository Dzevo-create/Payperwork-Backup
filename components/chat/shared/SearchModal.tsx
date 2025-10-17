"use client";

import { X, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
}

export function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation handling
  useEffect(() => {
    // Clear previous timeout if exists
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    if (isOpen) {
      animationTimeoutRef.current = setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }

    // Cleanup timeout on unmount to prevent memory leaks
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Auto-focus input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query);
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className={`fixed inset-0 bg-pw-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[5vh] md:pt-[10vh] transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-full md:max-w-2xl mx-3 md:mx-4 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-pw-black/10 overflow-hidden transform transition-all duration-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-pw-black/5 rounded-lg transition-colors z-10"
          aria-label="Suchfenster schließen"
        >
          <X className="w-5 h-5 text-pw-black/60" />
        </button>

        {/* Search Input Section */}
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-pw-black/10 pr-16">
            <Search className="w-5 h-5 text-pw-black/40 flex-shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Konversationen durchsuchen..."
              className="flex-1 bg-transparent text-base md:text-lg text-pw-black placeholder:text-pw-black/40 outline-none"
              autoComplete="off"
              aria-label="Konversationen durchsuchen"
            />
            <kbd className="hidden md:inline-flex px-2 py-1 bg-pw-light border border-pw-black/10 rounded text-xs text-pw-black/60 font-mono mr-2">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Results Section */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="text-center py-12 text-sm text-pw-black/40">
            {query ? "Keine Ergebnisse gefunden..." : "Geben Sie einen Suchbegriff ein..."}
          </div>
        </div>
      </div>
    </div>
  );
}
