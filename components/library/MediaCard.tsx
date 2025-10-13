"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Download, Trash2, Loader2, Star, Edit2 } from "lucide-react";
import { LibraryItem } from "@/types/library";
import { useLibraryStore } from "@/store/libraryStore.v2";
import { useToast } from "@/hooks/useToast";

interface MediaCardProps {
  item: LibraryItem;
  onClick: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

export function MediaCard({ item, onClick, selectionMode, isSelected, onToggleSelection }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const videoRef = useRef<HTMLVideoElement>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { removeItem, renameItem, toggleFavorite } = useLibraryStore();
  const toast = useToast();

  // Auto-play video on hover
  useEffect(() => {
    if (item.type === "video" && videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => {
          // Ignore autoplay errors
        });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, item.type]);

  // Cleanup delete timeout
  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!item.url) {
      toast.error("Kein Download verfügbar");
      return;
    }

    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Download gestartet");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download fehlgeschlagen");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);

    // Auto-cancel after 3 seconds
    deleteTimeoutRef.current = setTimeout(() => {
      setShowDeleteConfirm(false);
    }, 3000);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }

    setIsDeleting(true);

    // Simulate network delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    removeItem(item.id);
    toast.success("Gelöscht");
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }
    setShowDeleteConfirm(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(item.id);
    toast.success(item.isFavorite ? "Aus Favoriten entfernt" : "Zu Favoriten hinzugefügt");
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(true);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (newName.trim() && newName !== item.name) {
      await renameItem(item.id, newName.trim());
      toast.success("Umbenannt");
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewName(item.name);
    setIsRenaming(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const handleCardClick = () => {
    if (selectionMode) {
      onToggleSelection?.();
    } else {
      onClick();
    }
  };

  return (
    <div
      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer card-hover bg-pw-light transition-all ${
        isDeleting ? "opacity-50 scale-95" : ""
      } ${!item.seen ? "ring-2 ring-blue-500" : ""} ${isSelected ? "ring-4 ring-pw-accent" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Media Preview */}
      {item.type === "video" ? (
        item.url ? (
          <video
            ref={videoRef}
            src={item.url}
            poster={item.thumbnailUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            onLoadedData={() => setIsLoading(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-pw-light">
            <p className="text-pw-black/40 text-xs">Video nicht verfügbar</p>
          </div>
        )
      ) : item.url ? (
        <img
          src={item.url}
          alt={item.name}
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-pw-light">
          <p className="text-pw-black/40 text-xs">Bild nicht verfügbar</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-pw-light">
          <Loader2 className="w-6 h-6 text-pw-black/40 animate-spin" />
        </div>
      )}

      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-20">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xl border-2 ${
              isSelected
                ? "bg-white border-white"
                : "bg-white/80 backdrop-blur-sm border-white"
            }`}
          >
            {isSelected && (
              <svg className="w-5 h-5 text-pw-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Unseen Badge */}
      {!item.seen && !selectionMode && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-lg z-10" />
      )}

      {/* Always Visible Bottom Metadata */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/90 via-white/70 to-transparent z-10">
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-2 py-1 text-sm bg-white border border-pw-black/20 rounded text-pw-black mb-1 focus:outline-none focus:ring-2 focus:ring-pw-accent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleRenameCancel(e as any);
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
                onClick={handleRenameCancel}
                className="px-2 py-1 text-xs bg-white text-pw-black rounded hover:bg-pw-light transition-all"
              >
                Abbrechen
              </button>
            </div>
          </form>
        ) : (
          <div className="pointer-events-none">
            <div className="flex items-center justify-between mb-1">
              <p className="text-pw-black text-sm font-medium truncate flex-1">{item.name}</p>
              {!selectionMode && (
                <button
                  onClick={handleRenameClick}
                  className="pointer-events-auto ml-2 w-6 h-6 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-all"
                  title="Umbenennen"
                >
                  <Edit2 className="w-3 h-3 text-pw-black" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-pw-black/70">
              <span>{formatDate(item.createdAt)}</span>
              {item.metadata?.duration && (
                <span>{item.metadata.duration}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Play Icon (Videos only) - Always Visible, Bottom Right */}
      {item.type === "video" && (
        <div className={`absolute bottom-3 right-3 pointer-events-none z-20 transition-opacity ${isHovered ? "opacity-0" : "opacity-100"}`}>
          <div className="w-12 h-12 rounded-full bg-pw-black/80 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      {!selectionMode && (
        <div
          className={`absolute inset-0 bg-pw-black/60 transition-opacity ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Action Buttons */}
          {!showDeleteConfirm ? (
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={handleToggleFavorite}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all"
              title={item.isFavorite ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
            >
              <Star
                className={`w-4 h-4 transition-all ${
                  item.isFavorite
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-pw-black"
                }`}
              />
            </button>
            <button
              onClick={handleDownload}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all"
              title="Download"
            >
              <Download className="w-4 h-4 text-pw-black" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
              title="Löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-all"
            >
              Bestätigen
            </button>
            <button
              onClick={handleCancelDelete}
              className="px-3 py-1.5 rounded-full bg-white/90 text-pw-black text-xs font-medium hover:bg-white transition-all"
            >
              Abbrechen
            </button>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
