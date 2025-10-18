import { useState, useCallback, useRef, useEffect } from "react";
import { LibraryItem } from "@/types/library";

export function useLibraryLightbox(
  filteredItems: LibraryItem[],
  markAsSeen: (id: string) => void
) {
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenLightbox = useCallback(
    (item: LibraryItem) => {
      setSelectedItem(item);
      setIsLightboxOpen(true);
      markAsSeen(item.id);
    },
    [markAsSeen]
  );

  const handleCloseLightbox = useCallback(() => {
    setIsLightboxOpen(false);

    // Clear previous timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Delay clearing selectedItem to allow exit animation
    timeoutRef.current = setTimeout(() => setSelectedItem(null), 300);
  }, []);

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      if (!selectedItem) return;

      const currentIndex = filteredItems.findIndex((i) => i.id === selectedItem.id);
      let newIndex: number;

      if (direction === "prev") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : filteredItems.length - 1;
      } else {
        newIndex = currentIndex < filteredItems.length - 1 ? currentIndex + 1 : 0;
      }

      const newItem = filteredItems[newIndex];
      setSelectedItem(newItem ?? null);
      if (newItem) {
        markAsSeen(newItem.id);
      }
    },
    [selectedItem, filteredItems, markAsSeen]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    selectedItem,
    isLightboxOpen,
    handleOpenLightbox,
    handleCloseLightbox,
    handleNavigate,
  };
}
