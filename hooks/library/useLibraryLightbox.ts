import { useState, useCallback } from "react";
import { LibraryItem } from "@/types/library";

export function useLibraryLightbox(
  filteredItems: LibraryItem[],
  markAsSeen: (id: string) => void
) {
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
    // Delay clearing selectedItem to allow exit animation
    setTimeout(() => setSelectedItem(null), 300);
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
      setSelectedItem(newItem);
      markAsSeen(newItem.id);
    },
    [selectedItem, filteredItems, markAsSeen]
  );

  return {
    selectedItem,
    isLightboxOpen,
    handleOpenLightbox,
    handleCloseLightbox,
    handleNavigate,
  };
}
