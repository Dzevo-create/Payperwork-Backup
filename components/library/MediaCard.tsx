"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import { LibraryItem } from "@/types/library";
import { useMediaCardActions } from "@/hooks/library/useMediaCardActions";
import { MediaCardActions } from "./MediaCardActions";
import { MediaCardMetadata } from "./MediaCardMetadata";

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
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    showDeleteConfirm,
    isDeleting,
    isRenaming,
    newName,
    setNewName,
    handleDownload,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    handleToggleFavorite,
    handleRenameClick,
    handleRenameSubmit,
    handleRenameCancel,
  } = useMediaCardActions(item);

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

      {/* Metadata */}
      <MediaCardMetadata
        name={item.name}
        createdAt={item.createdAt}
        duration={item.metadata?.duration}
        isRenaming={isRenaming}
        newName={newName}
        selectionMode={!!selectionMode}
        onNameChange={setNewName}
        onRenameSubmit={handleRenameSubmit}
        onRenameCancel={handleRenameCancel}
        onRenameClick={handleRenameClick}
      />

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
          <MediaCardActions
            isFavorite={!!item.isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onDownload={handleDownload}
            onDeleteClick={handleDeleteClick}
            showDeleteConfirm={showDeleteConfirm}
            onConfirmDelete={handleConfirmDelete}
            onCancelDelete={handleCancelDelete}
          />
        </div>
      )}
    </div>
  );
}
