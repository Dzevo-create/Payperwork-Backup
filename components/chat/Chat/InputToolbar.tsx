"use client";

import { useRef, useEffect } from "react";
import { Plus, FileText, MessageSquare, Image as ImageIcon, Video } from "lucide-react";

interface InputToolbarProps {
  mode: "chat" | "image" | "video";
  showDropdown: boolean;
  isUploading: boolean;
  onToggleDropdown: () => void;
  onModeChange: (mode: "chat" | "image" | "video") => void;
  onFileClick: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

export function InputToolbar({
  mode,
  showDropdown,
  isUploading,
  onToggleDropdown,
  onModeChange,
  onFileClick,
  dropdownRef,
}: InputToolbarProps) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggleDropdown}
        disabled={isUploading}
        className="flex-shrink-0 p-2 hover:bg-pw-black/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Options"
      >
        {mode === "chat" && <Plus className="w-4 h-4 text-pw-black/60" />}
        {mode === "image" && <ImageIcon className="w-4 h-4 text-pw-black/60" />}
        {mode === "video" && <Video className="w-4 h-4 text-pw-black/60" />}
      </button>

      {showDropdown && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-lg border border-pw-black/10 py-1 z-50">
          {/* Chat Mode */}
          <button
            onClick={() => {
              onModeChange("chat");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pw-black/5 transition-colors text-left"
          >
            <MessageSquare className="w-4 h-4 text-pw-black/60" />
            <span className="text-sm text-pw-black/80">Chat-Modus</span>
          </button>

          {/* Files */}
          <button
            onClick={onFileClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pw-black/5 transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-pw-black/60" />
            <span className="text-sm text-pw-black/80">Fotos und Dateien hinzufügen</span>
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-pw-black/10" />

          {/* Create Images */}
          <button
            onClick={() => {
              onModeChange("image");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pw-black/5 transition-colors text-left"
          >
            <ImageIcon className="w-4 h-4 text-pw-black/60" />
            <span className="text-sm text-pw-black/80">Erstelle Bilder</span>
          </button>

          {/* Create Videos */}
          <button
            onClick={() => {
              onModeChange("video");
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-pw-black/5 transition-colors text-left"
          >
            <Video className="w-4 h-4 text-pw-black/60" />
            <span className="text-sm text-pw-black/80">Erstelle Videos</span>
          </button>
        </div>
      )}
    </div>
  );
}
