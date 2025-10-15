"use client";

import { useRef, useEffect } from "react";
import { Edit2, Copy, Trash2 } from "lucide-react";

interface ConversationMenuProps {
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ConversationMenu({
  onRename,
  onDuplicate,
  onDelete,
  onClose,
}: ConversationMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute right-2 top-full mt-1 w-40 bg-white rounded-xl shadow-2xl border border-pw-black/10 py-1 z-50"
    >
      <button
        onClick={onRename}
        className="w-full px-3 py-2 text-left text-xs text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-2"
      >
        <Edit2 className="w-3.5 h-3.5" />
        <span>Umbenennen</span>
      </button>
      <button
        onClick={onDuplicate}
        className="w-full px-3 py-2 text-left text-xs text-pw-black/80 hover:bg-pw-black/20 active:bg-pw-black/30 transition-all duration-150 flex items-center gap-2"
      >
        <Copy className="w-3.5 h-3.5" />
        <span>Duplizieren</span>
      </button>
      <div className="border-t border-pw-black/10 my-1"></div>
      <button
        onClick={onDelete}
        className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-100 active:bg-red-200 transition-all duration-150 flex items-center gap-2"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Löschen</span>
      </button>
    </div>
  );
}
