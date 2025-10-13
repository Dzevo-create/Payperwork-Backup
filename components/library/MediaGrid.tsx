"use client";

import { useEffect, useRef } from "react";
import { MediaCard } from "./MediaCard";
import { LibraryItem, MediaType } from "@/types/library";
import { Video, Image as ImageIcon, Loader2 } from "lucide-react";

interface MediaGridProps {
  items: LibraryItem[];
  selectedTab: MediaType | "all" | "favorites";
  onItemClick?: (item: LibraryItem) => void;
  selectionMode?: boolean;
  selectedItems?: Set<string>;
  onToggleSelection?: (itemId: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
}

export function MediaGrid({ items, selectedTab, onItemClick, selectionMode, selectedItems, onToggleSelection, onLoadMore, isLoading, hasMore }: MediaGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, isLoading, hasMore]);
  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pw-light flex items-center justify-center">
            {selectedTab === "video" ? (
              <Video className="w-8 h-8 text-pw-black/40" />
            ) : selectedTab === "image" ? (
              <ImageIcon className="w-8 h-8 text-pw-black/40" />
            ) : (
              <div className="flex gap-1">
                <Video className="w-6 h-6 text-pw-black/40" />
                <ImageIcon className="w-6 h-6 text-pw-black/40" />
              </div>
            )}
          </div>
          <p className="text-pw-black/60 text-sm">
            {selectedTab === "video"
              ? "Noch keine Videos generiert"
              : selectedTab === "image"
                ? "Noch keine Bilder generiert"
                : "Noch keine Medien generiert"}
          </p>
          <p className="text-pw-black/40 text-xs mt-2">
            Erstelle deine ersten Inhalte im Chat
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onClick={() => onItemClick?.(item)}
            selectionMode={selectionMode}
            isSelected={selectedItems?.has(item.id)}
            onToggleSelection={() => onToggleSelection?.(item.id)}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoading && (
            <Loader2 className="w-6 h-6 text-pw-black/40 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
