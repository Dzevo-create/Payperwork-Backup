"use client";

import { Plus } from "lucide-react";

interface NewChatButtonProps {
  onClick?: () => void;
}

export function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <div className="px-2 py-0.5">
      <button
        onClick={onClick}
        className="w-full p-2 hover:bg-pw-black/20 active:bg-pw-black/30 rounded-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-start gap-2"
        aria-label="Neuer Chat"
      >
        <Plus className="w-4 h-4 text-pw-black/60" />
        <span className="text-sm text-pw-black/70">Neuer Chat</span>
      </button>
    </div>
  );
}
