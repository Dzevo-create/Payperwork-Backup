"use client";

import { useState } from "react";
import { Share2, Menu } from "lucide-react";

interface ChatHeaderProps {
  onMenuClick?: () => void;
}

export function ChatHeader({ onMenuClick }: ChatHeaderProps) {
  const [chatName, setChatName] = useState("Neuer Chat");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-transparent">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-pw-black/5 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-pw-black/60" />
        </button>

        {/* Editable Chat Name */}
        {isEditing ? (
          <input
            type="text"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="text-lg font-semibold text-pw-black bg-transparent border-b-2 border-pw-accent focus:outline-none"
            autoFocus
          />
        ) : (
          <h1
            onClick={() => setIsEditing(true)}
            className="text-lg font-semibold text-pw-black cursor-pointer hover:text-pw-accent transition-colors"
          >
            {chatName}
          </h1>
        )}
      </div>

      {/* Share Button */}
      <button
        className="p-2.5 hover:bg-pw-black/5 rounded-lg transition-colors"
        aria-label="Share chat"
      >
        <Share2 className="w-5 h-5 text-pw-black/60" />
      </button>
    </header>
  );
}
