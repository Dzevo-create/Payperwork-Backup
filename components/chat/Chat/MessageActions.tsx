"use client";

import { memo } from "react";
import { Copy, Check, Edit2 } from "lucide-react";
import { Message } from "@/types/chat";

interface MessageActionsProps {
  message: Message;
  copiedId: string | null;
  onCopy: (content: string, messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
}

export const MessageActions = memo(function MessageActions({
  message,
  copiedId,
  onCopy,
  onEdit,
}: MessageActionsProps) {
  if (!message.content) return null;

  return (
    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
      {/* Copy Button */}
      <button
        onClick={() => onCopy(message.content, message.id)}
        className="p-1 hover:bg-pw-black/5 rounded transition-colors"
        title="Kopieren"
      >
        {copiedId === message.id ? (
          <Check className="w-3 h-3 text-green-600" />
        ) : (
          <Copy className="w-3 h-3 text-pw-black/40" />
        )}
      </button>

      {/* Edit Button - Only for User Messages */}
      {message.role === "user" && (
        <button
          onClick={() => onEdit(message.id, message.content)}
          className="p-1 hover:bg-pw-black/5 rounded transition-colors"
          title="Bearbeiten"
        >
          <Edit2 className="w-3 h-3 text-pw-black/40" />
        </button>
      )}
    </div>
  );
});
