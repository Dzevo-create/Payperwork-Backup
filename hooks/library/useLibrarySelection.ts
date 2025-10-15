import { useState, useCallback } from "react";

export function useLibrarySelection() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev);
    setSelectedItems(new Set());
  }, []);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((itemIds: string[]) => {
    setSelectedItems(new Set(itemIds));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  }, []);

  return {
    selectionMode,
    selectedItems,
    toggleSelectionMode,
    toggleItemSelection,
    selectAll,
    deselectAll,
    clearSelection,
  };
}
