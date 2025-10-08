"use client";

import { Search } from "lucide-react";

interface SidebarSearchProps {
  onSearchClick?: () => void;
}

export function SidebarSearch({ onSearchClick }: SidebarSearchProps) {
  return (
    <div className="px-2 py-0">
      <button
        onClick={onSearchClick}
        className="w-full p-2 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-start gap-2"
        aria-label="Chat suchen"
      >
        <Search className="w-4 h-4 text-pw-black/60" />
        <span className="text-sm text-pw-black/70">Chat suchen</span>
      </button>
    </div>
  );
}
