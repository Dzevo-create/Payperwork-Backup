"use client";

import { Edit2 } from "lucide-react";
import { formatDate } from "@/lib/utils/dateUtils";

interface MediaCardMetadataProps {
  name: string;
  createdAt: string;
  duration?: string;
  isRenaming: boolean;
  newName: string;
  selectionMode: boolean;
  onNameChange: (name: string) => void;
  onRenameSubmit: (e: React.FormEvent) => void;
  onRenameCancel: (e: React.MouseEvent) => void;
  onRenameClick: (e: React.MouseEvent) => void;
}

export function MediaCardMetadata({
  name,
  createdAt,
  duration,
  isRenaming,
  newName,
  selectionMode,
  onNameChange,
  onRenameSubmit,
  onRenameCancel,
  onRenameClick,
}: MediaCardMetadataProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/90 via-white/70 to-transparent z-10">
      {isRenaming ? (
        <form onSubmit={onRenameSubmit} className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={newName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-2 py-1 text-sm bg-white border border-pw-black/20 rounded text-pw-black mb-1 focus:outline-none focus:ring-2 focus:ring-pw-accent"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onRenameCancel(e as any);
              }
            }}
          />
          <div className="flex gap-1">
            <button
              type="submit"
              className="px-2 py-1 text-xs bg-pw-black text-white rounded hover:bg-pw-black/90 transition-all"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={onRenameCancel}
              className="px-2 py-1 text-xs bg-white text-pw-black rounded hover:bg-pw-light transition-all"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        <div className="pointer-events-none">
          <div className="flex items-center justify-between mb-1">
            <p className="text-pw-black text-sm font-medium truncate flex-1">{name}</p>
            {!selectionMode && (
              <button
                onClick={onRenameClick}
                className="pointer-events-auto ml-2 w-6 h-6 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all"
                title="Umbenennen"
              >
                <Edit2 className="w-3 h-3 text-pw-black" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-pw-black/70">
            <span>{formatDate(createdAt)}</span>
            {duration && <span>{duration}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
