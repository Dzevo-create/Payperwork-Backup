import { useState, useRef, useEffect } from "react";
import { LibraryItem } from "@/types/library";
import { useLibraryStore } from "@/store/libraryStore.v2";
import { useToast } from "@/hooks/useToast";
import { libraryLogger } from '@/lib/logger';

export function useMediaCardActions(item: LibraryItem) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { removeItem, renameItem, toggleFavorite } = useLibraryStore();
  const toast = useToast();

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
      libraryLogger.error('Download error:', error instanceof Error ? error : undefined);
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

  return {
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
  };
}
