"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, MoreVertical } from "lucide-react";
import { ConversationMenu } from "./ConversationMenu";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onLoadConversation?: (convId: string) => void;
  onDeleteConversation?: (convId: string) => void;
  onDuplicateConversation?: (convId: string) => void;
  onRenameConversation?: (convId: string, newTitle: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onLoadConversation,
  onDeleteConversation,
  onDuplicateConversation,
  onRenameConversation,
}: ConversationItemProps) {
  const [activeMenu, setActiveMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartRename = () => {
    setIsEditing(true);
    setEditingTitle(conversation.title);
    setActiveMenu(false);
  };

  const handleFinishRename = () => {
    if (editingTitle.trim()) {
      onRenameConversation?.(conversation.id, editingTitle.trim());
    }
    setIsEditing(false);
    setEditingTitle("");
  };

  return (
    <div className="relative group">
      <div
        onClick={() => onLoadConversation?.(conversation.id)}
        className={`w-full p-2 rounded-lg transition-colors duration-200 cursor-pointer ${
          isActive ? "bg-pw-light" : "hover:bg-pw-black/20"
        }`}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-pw-black/60" />
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={handleFinishRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishRename();
                  if (e.key === "Escape") {
                    setIsEditing(false);
                    setEditingTitle("");
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-xs font-medium bg-white border border-pw-accent rounded px-1 py-0.5 outline-none"
              />
            ) : (
              <p className="text-xs font-medium truncate text-pw-black/80">
                {conversation.title}
              </p>
            )}
          </div>

          {/* Three dots menu button */}
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(!activeMenu);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-pw-black/20 rounded transition-all duration-200"
            >
              <MoreVertical className="w-3.5 h-3.5 text-pw-black/60" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {activeMenu && (
        <ConversationMenu
          onRename={handleStartRename}
          onDuplicate={() => {
            onDuplicateConversation?.(conversation.id);
            setActiveMenu(false);
          }}
          onDelete={() => {
            onDeleteConversation?.(conversation.id);
            setActiveMenu(false);
          }}
          onClose={() => setActiveMenu(false)}
        />
      )}
    </div>
  );
}
