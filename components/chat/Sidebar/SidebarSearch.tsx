"use client";

import { Search } from "lucide-react";

interface SidebarSearchProps {
  onClick?: () => void;
}

export function SidebarSearch({ onClick }: SidebarSearchProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Remove focus from button after click to prevent active state
    e.currentTarget.blur();
    onClick?.();
  };

  return (
    <div className="px-2 py-0">
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-all duration-200 group focus:outline-none"
      >
        <Search className="w-4 h-4 text-pw-black/60 group-hover:text-pw-black/80 transition-colors" />
        <span className="text-pw-black/70 group-hover:text-pw-black/90 transition-colors">
          Chat durchsuchen...
        </span>
      </button>
    </div>
  );
}
