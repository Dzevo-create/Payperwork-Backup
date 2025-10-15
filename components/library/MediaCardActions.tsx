"use client";

import { Download, Trash2, Star } from "lucide-react";

interface MediaCardActionsProps {
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
  showDeleteConfirm: boolean;
  onConfirmDelete: (e: React.MouseEvent) => void;
  onCancelDelete: (e: React.MouseEvent) => void;
}

export function MediaCardActions({
  isFavorite,
  onToggleFavorite,
  onDownload,
  onDeleteClick,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: MediaCardActionsProps) {
  if (showDeleteConfirm) {
    return (
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={onConfirmDelete}
          className="px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-all"
        >
          Bestätigen
        </button>
        <button
          onClick={onCancelDelete}
          className="px-3 py-1.5 rounded-full bg-white/90 text-pw-black text-xs font-medium hover:bg-white transition-all"
        >
          Abbrechen
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-3 right-3 flex gap-2">
      <button
        onClick={onToggleFavorite}
        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all"
        title={isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      >
        <Star
          className={`w-4 h-4 transition-all ${
            isFavorite ? "fill-yellow-400 text-yellow-400" : "text-pw-black"
          }`}
        />
      </button>
      <button
        onClick={onDownload}
        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all"
        title="Download"
      >
        <Download className="w-4 h-4 text-pw-black" />
      </button>
      <button
        onClick={onDeleteClick}
        className="w-8 h-8 rounded-full bg-white/90 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
        title="Löschen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
