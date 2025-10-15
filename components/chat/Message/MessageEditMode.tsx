"use client";

import { X, Send } from "lucide-react";

interface MessageEditModeProps {
  messageId: string;
  editContent: string;
  onEditContentChange: (value: string) => void;
  onSave: (messageId: string) => void;
  onCancel: () => void;
}

export function MessageEditMode({
  messageId,
  editContent,
  onEditContentChange,
  onSave,
  onCancel,
}: MessageEditModeProps) {
  return (
    <div className="w-full space-y-1.5">
      <textarea
        value={editContent}
        onChange={(e) => onEditContentChange(e.target.value)}
        className="w-full min-h-[50px] max-h-[120px] p-3 bg-transparent border-0 rounded-lg text-sm resize-none focus:outline-none placeholder:text-pw-black/30"
        autoFocus
      />
      <div className="flex gap-1 justify-end">
        <button
          onClick={onCancel}
          className="p-1 text-pw-black/40 hover:text-pw-black/60 hover:bg-pw-black/5 rounded transition-colors"
          title="Abbrechen"
        >
          <X className="w-3 h-3" />
        </button>
        <button
          onClick={() => onSave(messageId)}
          className="p-1 text-pw-black/40 hover:text-pw-black/60 hover:bg-pw-black/5 rounded transition-colors"
          title="Senden"
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
