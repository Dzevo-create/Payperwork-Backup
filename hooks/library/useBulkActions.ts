import { useState } from "react";
import { LibraryItem } from "@/types/library";
import { useToast } from "@/hooks/useToast";
import { libraryLogger } from '@/lib/logger';

interface UseBulkActionsProps {
  items: LibraryItem[];
  removeItem: (id: string) => Promise<void> | void;
  onComplete?: () => void;
}

export function useBulkActions({ items, removeItem, onComplete }: UseBulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const handleBulkDelete = async (selectedIds: Set<string>) => {
    if (selectedIds.size === 0 || isProcessing) return;

    // Rate limit: max 50 items at once
    if (selectedIds.size > 50) {
      toast.error("Maximal 50 Items auf einmal löschen");
      return;
    }

    const confirmed = confirm(
      `${selectedIds.size} ${selectedIds.size === 1 ? "Item" : "Items"} löschen?`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    toast.success("Lösche Items...");

    try {
      let deletedCount = 0;
      for (const itemId of selectedIds) {
        await removeItem(itemId);
        deletedCount++;

        // Show progress for large deletions
        if (selectedIds.size > 10 && deletedCount % 5 === 0) {
          toast.success(`${deletedCount}/${selectedIds.size} gelöscht...`);
        }
      }

      toast.success(`${deletedCount} Items gelöscht`);
      onComplete?.();
    } catch (error) {
      libraryLogger.error('Bulk delete failed:', error instanceof Error ? error : undefined);
      toast.error("Fehler beim Löschen");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDownload = async (selectedIds: Set<string>) => {
    if (selectedIds.size === 0 || isProcessing) return;

    // Rate limit: max 30 items at once (to prevent memory issues)
    if (selectedIds.size > 30) {
      toast.error("Maximal 30 Items auf einmal herunterladen");
      return;
    }

    setIsProcessing(true);
    toast.success("ZIP wird erstellt...");

    try {
      // Load JSZip from CDN if not already loaded
      if (!(window as any).JSZip) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
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
      for (const itemId of selectedIds) {
        const item = items.find((i) => i.id === itemId);
        if (!item?.url) continue;

        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          zip.file(item.name, blob);
          successCount++;
        } catch (error) {
          libraryLogger.error('Failed to add ${item.name} to ZIP:', error instanceof Error ? error : undefined);
        }

        processedCount++;
        // Show progress every 5 files
        if (selectedIds.size > 10 && processedCount % 5 === 0) {
          toast.success(`${processedCount}/${selectedIds.size} Dateien hinzugefügt...`);
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
        compressionOptions: { level: 6 },
      });

      // Create download link
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      a.download = `payperwork-${timestamp}-${selectedIds.size}items.zip`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        `ZIP mit ${successCount} ${successCount === 1 ? "Datei" : "Dateien"} heruntergeladen`
      );
    } catch (error) {
      libraryLogger.error('ZIP creation failed:', error instanceof Error ? error : undefined);
      toast.error("ZIP-Erstellung fehlgeschlagen");
    } finally {
      setIsProcessing(false);
      // Note: We don't remove the script element as it's cached globally for reuse
      // and will be cleaned up when the page unloads
    }
  };

  return {
    isProcessing,
    handleBulkDelete,
    handleBulkDownload,
  };
}
