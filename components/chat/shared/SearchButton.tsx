"use client";

import { Search } from "lucide-react";

interface SearchButtonProps {
  onClick: () => void;
  isCollapsed?: boolean;
}

export function SearchButton({ onClick, isCollapsed = false }: SearchButtonProps) {
  if (isCollapsed) {
    return (
      <button
        onClick={onClick}
        className="p-3 hover:bg-pw-black/5 rounded-lg transition-colors"
        aria-label="Search"
      >
        <Search className="w-5 h-5 text-pw-black/60" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 bg-pw-light border border-pw-black/10 rounded-xl text-sm text-pw-black hover:bg-pw-black/5 transition-all"
    >
      <Search className="w-4 h-4 text-pw-black/60" />
      <span>Suchen</span>
    </button>
  );
}
