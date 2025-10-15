"use client";

import { useState, useEffect } from "react";
import { useLibraryStore } from "@/store/libraryStore.v2";
import { MediaGrid } from "./MediaGrid";
import { MediaLightbox } from "./MediaLightbox";
import { LibraryHeader } from "./LibraryHeader";
import { SelectionActionBar } from "./SelectionActionBar";
import { MediaType } from "@/types/library";
import { useLibrarySelection } from "@/hooks/library/useLibrarySelection";
import { useBulkActions } from "@/hooks/library/useBulkActions";
import { useLibraryLightbox } from "@/hooks/library/useLibraryLightbox";

export function LibraryLayout() {
  const [selectedTab, setSelectedTab] = useState<MediaType | "all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [mounted, setMounted] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { items, filters, setFilters, getFilteredItems, getUnseenByType, markAsSeen, loadItems, loadMoreItems, removeItem, isLoading } = useLibraryStore();

  // Custom hooks
  const {
    selectionMode,
    selectedItems,
    toggleSelectionMode,
    toggleItemSelection,
    selectAll,
    deselectAll,
    clearSelection,
  } = useLibrarySelection();

  const filteredItems = getFilteredItems();

  const { isProcessing, handleBulkDelete, handleBulkDownload } = useBulkActions({
    items,
    removeItem,
    onComplete: clearSelection,
  });

  const {
    selectedItem,
    isLightboxOpen,
    handleOpenLightbox,
    handleCloseLightbox,
    handleNavigate,
  } = useLibraryLightbox(filteredItems, markAsSeen);

  // Handle loading more items for infinite scroll
  const handleLoadMore = async () => {
    if (!loadMoreItems || isLoading) return;

    const newItemsCount = await loadMoreItems();
    if (newItemsCount === 0) {
      setHasMore(false);
    }
  };

  // Fix hydration mismatch by only rendering after mount (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load items from Supabase on mount
  useEffect(() => {
    if (mounted && loadItems) {
      loadItems();
    }
  }, [mounted, loadItems]);

  // Update filters when tab, search, or sort changes
  useEffect(() => {
    setFilters({
      type: selectedTab,
      searchQuery: searchQuery.trim() || undefined,
      sortBy,
    });
  }, [selectedTab, searchQuery, sortBy, setFilters]);

  // Computed counts
  const videoCount = items.filter((i) => i.type === "video").length;
  const imageCount = items.filter((i) => i.type === "image").length;
  const favoritesCount = items.filter((i) => i.isFavorite).length;
  const unseenVideos = getUnseenByType("video");
  const unseenImages = getUnseenByType("image");

  // Keyboard shortcuts (only for non-lightbox actions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts if lightbox is open (MediaLightbox handles its own)
      if (isLightboxOpen) return;

      // Escape - Exit selection mode
      if (e.key === "Escape" && selectionMode) {
        toggleSelectionMode();
        return;
      }

      // Ctrl+A / Cmd+A - Select all (only in selection mode)
      if ((e.ctrlKey || e.metaKey) && e.key === "a" && selectionMode) {
        e.preventDefault();
        selectAll(filteredItems.map((item) => item.id));
        return;
      }

      // Delete - Bulk delete selected items (only in selection mode)
      if (e.key === "Delete" && selectionMode && selectedItems.size > 0) {
        e.preventDefault();
        handleBulkDelete(selectedItems);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, selectionMode, selectedItems]);

  // Don't render until mounted (prevent hydration mismatch)
  if (!mounted) {
    return null;
  }

  // Show loading state on initial load
  if (isLoading && items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-pw-accent/30 border-t-pw-accent rounded-full animate-spin" />
            <p className="text-sm text-pw-black/60 font-medium">Bibliothek wird geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <LibraryHeader
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectionMode={selectionMode}
        onToggleSelection={toggleSelectionMode}
        counts={{
          all: items.length,
          videos: videoCount,
          images: imageCount,
          favorites: favoritesCount,
          unseenVideos,
          unseenImages,
        }}
      />

      {/* Selection Action Bar */}
      {selectionMode && (
        <SelectionActionBar
          selectedCount={selectedItems.size}
          totalCount={filteredItems.length}
          onSelectAll={() => selectAll(filteredItems.map((item) => item.id))}
          onDeselectAll={deselectAll}
          onDownload={() => handleBulkDownload(selectedItems)}
          onDelete={() => handleBulkDelete(selectedItems)}
          isProcessing={isProcessing}
        />
      )}

      {/* Media Grid */}
      <MediaGrid
        items={filteredItems}
        selectedTab={selectedTab}
        onItemClick={selectionMode ? undefined : handleOpenLightbox}
        selectionMode={selectionMode}
        selectedItems={selectedItems}
        onToggleSelection={toggleItemSelection}
        onLoadMore={handleLoadMore}
        isLoading={isLoading}
        hasMore={hasMore}
      />

      {/* Lightbox */}
      {selectedItem && (
        <MediaLightbox
          isOpen={isLightboxOpen}
          item={selectedItem}
          onClose={handleCloseLightbox}
          onNavigate={handleNavigate}
          hasNext={filteredItems.length > 1}
          hasPrev={filteredItems.length > 1}
        />
      )}
    </div>
  );
}
