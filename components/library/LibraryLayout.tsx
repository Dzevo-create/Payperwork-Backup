"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, Download, Trash2, X } from "lucide-react";
import { useLibraryStore } from "@/store/libraryStore.v2";
import { MediaGrid } from "./MediaGrid";
import { MediaLightbox } from "./MediaLightbox";
import { LibraryItem, MediaType } from "@/types/library";
import { useToast } from "@/hooks/useToast";

export function LibraryLayout() {
  const [selectedTab, setSelectedTab] = useState<MediaType | "all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { items, filters, setFilters, getFilteredItems, getUnseenByType, markAsSeen, loadItems, loadMoreItems, removeItem, isLoading } = useLibraryStore();
  const toast = useToast();

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

  const filteredItems = getFilteredItems();
  const videoCount = items.filter((i) => i.type === "video").length;
  const imageCount = items.filter((i) => i.type === "image").length;
  const favoritesCount = items.filter((i) => i.isFavorite).length;
  const unseenVideos = getUnseenByType("video");
  const unseenImages = getUnseenByType("image");

  const handleOpenLightbox = (item: LibraryItem) => {
    setSelectedItem(item);
    setIsLightboxOpen(true);
    markAsSeen(item.id);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    // Delay clearing selectedItem to allow exit animation
    setTimeout(() => setSelectedItem(null), 300);
  };

  const handleNavigate = (direction: "prev" | "next") => {
    if (!selectedItem) return;

    const currentIndex = filteredItems.findIndex((i) => i.id === selectedItem.id);
    let newIndex: number;

    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1;
    } else {
      newIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0;
    }

    const newItem = filteredItems[newIndex];
    setSelectedItem(newItem);
    markAsSeen(newItem.id);
  };

  // Selection mode handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredItems.map((item) => item.id));
    setSelectedItems(allIds);
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0 || isProcessing) return;

    // Rate limit: max 50 items at once
    if (selectedItems.size > 50) {
      toast.error("Maximal 50 Items auf einmal löschen");
      return;
    }

    const confirmed = confirm(`${selectedItems.size} ${selectedItems.size === 1 ? 'Item' : 'Items'} löschen?`);
    if (!confirmed) return;

    setIsProcessing(true);
    toast.success("Lösche Items...");

    try {
      let deletedCount = 0;
      for (const itemId of selectedItems) {
        await removeItem(itemId);
        deletedCount++;

        // Show progress for large deletions
        if (selectedItems.size > 10 && deletedCount % 5 === 0) {
          toast.success(`${deletedCount}/${selectedItems.size} gelöscht...`);
        }
      }

      toast.success(`${deletedCount} Items gelöscht`);
      setSelectedItems(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Fehler beim Löschen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedItems.size === 0 || isProcessing) return;

    // Rate limit: max 30 items at once (to prevent memory issues)
    if (selectedItems.size > 30) {
      toast.error("Maximal 30 Items auf einmal herunterladen");
      return;
    }

    setIsProcessing(true);
    toast.success("ZIP wird erstellt...");

    try {
      // Load JSZip from CDN if not already loaded
      if (!(window as any).JSZip) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const JSZip = (window as any).JSZip;
      const zip = new JSZip();

      // Add all selected files to ZIP with progress
      let successCount = 0;
      let processedCount = 0;
      for (const itemId of selectedItems) {
        const item = items.find((i) => i.id === itemId);
        if (!item?.url) continue;

        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          zip.file(item.name, blob);
          successCount++;
        } catch (error) {
          console.error(`Failed to add ${item.name} to ZIP:`, error);
        }

        processedCount++;
        // Show progress every 5 files
        if (selectedItems.size > 10 && processedCount % 5 === 0) {
          toast.success(`${processedCount}/${selectedItems.size} Dateien hinzugefügt...`);
        }
      }

      if (successCount === 0) {
        toast.error("Keine Dateien konnten hinzugefügt werden");
        return;
      }

      // Show ZIP generation progress
      toast.success("Erstelle ZIP...");

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      // Create download link
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `payperwork-${timestamp}-${selectedItems.size}items.zip`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`ZIP mit ${successCount} ${successCount === 1 ? 'Datei' : 'Dateien'} heruntergeladen`);
    } catch (error) {
      console.error("ZIP creation failed:", error);
      toast.error("ZIP-Erstellung fehlgeschlagen");
    } finally {
      setIsProcessing(false);
    }
  };

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
        selectAll();
        return;
      }

      // Delete - Bulk delete selected items (only in selection mode)
      if (e.key === "Delete" && selectionMode && selectedItems.size > 0) {
        e.preventDefault();
        handleBulkDelete();
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-pw-black/10">
        <h1 className="text-2xl font-semibold text-pw-black mb-6">Bibliothek</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedTab === "all"
                ? "bg-pw-black text-pw-white"
                : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
            }`}
          >
            Alle ({items.length})
          </button>
          <button
            onClick={() => setSelectedTab("video")}
            className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedTab === "video"
                ? "bg-pw-black text-pw-white"
                : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
            }`}
          >
            Videos ({videoCount})
            {unseenVideos > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unseenVideos}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab("image")}
            className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedTab === "image"
                ? "bg-pw-black text-pw-white"
                : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
            }`}
          >
            Bilder ({imageCount})
            {unseenImages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unseenImages}
              </span>
            )}
          </button>
          <button
            onClick={() => setSelectedTab("favorites")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedTab === "favorites"
                ? "bg-pw-black text-pw-white"
                : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
            }`}
          >
            Favoriten ({favoritesCount})
          </button>
        </div>

        {/* Search & Sort & Selection */}
        <div className="flex gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-black/40" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-pw-light rounded-full text-sm text-pw-black placeholder:text-pw-black/40 focus:outline-none focus:ring-2 focus:ring-pw-black/20"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")}
              className="appearance-none pl-4 pr-10 py-2 bg-pw-light rounded-full text-sm text-pw-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-pw-black/20"
            >
              <option value="newest">Neueste</option>
              <option value="oldest">Älteste</option>
              <option value="name">Name</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pw-black/60 pointer-events-none" />
          </div>

          {/* Selection Mode Button */}
          <button
            onClick={toggleSelectionMode}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectionMode
                ? "bg-pw-black text-white hover:bg-pw-black/90"
                : "bg-pw-light text-pw-black/60 hover:bg-pw-black/10"
            }`}
          >
            {selectionMode ? "Abbrechen" : "Auswählen"}
          </button>
        </div>
      </div>

      {/* Selection Action Bar */}
      {selectionMode && (
        <div className="px-6 py-3 bg-pw-accent/10 border-b border-pw-accent/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-pw-black">
              {selectedItems.size} {selectedItems.size === 1 ? "Item" : "Items"} ausgewählt
            </span>
            {selectedItems.size < filteredItems.length && (
              <button
                onClick={selectAll}
                className="px-2.5 py-1 bg-pw-black hover:bg-pw-black/90 text-white rounded-full text-xs font-medium transition-all"
              >
                Alle auswählen
              </button>
            )}
            {selectedItems.size > 0 && (
              <button
                onClick={deselectAll}
                className="px-2.5 py-1 bg-white hover:bg-white/80 text-pw-black rounded-full text-xs font-medium transition-all border border-pw-black/10"
              >
                Abwählen
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDownload}
              disabled={selectedItems.size === 0 || isProcessing}
              className="w-8 h-8 rounded-full bg-pw-black text-white hover:bg-pw-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              title={isProcessing ? "Verarbeite..." : "Download"}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selectedItems.size === 0 || isProcessing}
              className="w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              title={isProcessing ? "Verarbeite..." : "Löschen"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
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
