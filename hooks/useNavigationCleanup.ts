"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore.supabase";
import { logger } from '@/lib/logger';

/**
 * Hook to handle browser navigation (back button) during generation
 * Cleans up ongoing operations to prevent memory leaks and API waste
 */
export function useNavigationCleanup() {
  const isGenerating = useChatStore((state) => state.isGenerating);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const clearError = useChatStore((state) => state.clearError);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Warn user if generation is in progress
      if (isGenerating) {
        e.preventDefault();
        e.returnValue = "Chat-Generierung läuft noch. Möchtest du wirklich abbrechen?";
        return e.returnValue;
      }
    };

    const handlePopState = () => {
      // User pressed back button - cleanup ongoing operations
      if (isGenerating) {
        logger.warn('Navigation during generation - cleaning up');
        setIsGenerating(false);
        clearError();

        // Abort any ongoing AbortController signals
        // Note: The actual AbortController is in ChatArea, but state cleanup helps
      }
    };

    // Listen for page unload and back button
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isGenerating, setIsGenerating, clearError]);
}
