import { useState, useCallback } from "react";

/**
 * Hook for managing message actions (copy, edit)
 * Extracted from ChatMessages.tsx for better separation of concerns
 *
 * Performance: Uses useCallback to memoize callbacks and prevent unnecessary re-renders
 */
export function useMessageActions(onEditMessage?: (messageId: string, content: string) => void) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleCopy = useCallback(async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleEdit = useCallback((messageId: string, currentContent: string) => {
    setEditingId(messageId);
    setEditContent(currentContent);
  }, []);

  const handleSaveEdit = useCallback((messageId: string) => {
    if (editContent.trim() && onEditMessage) {
      onEditMessage(messageId, editContent);
      setEditingId(null);
      setEditContent("");
    }
  }, [editContent, onEditMessage]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditContent("");
  }, []);

  return {
    copiedId,
    editingId,
    editContent,
    setEditContent,
    handleCopy,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
  };
}
