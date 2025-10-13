"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore.supabase";

/**
 * Hook to detect online/offline status and show error to user
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const setError = useChatStore((state) => state.setError);
  const clearError = useChatStore((state) => state.clearError);

  useEffect(() => {
    // Initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      clearError();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setError({
        message: "Keine Internetverbindung. Bitte überprüfe deine Verbindung.",
        code: "NETWORK_OFFLINE",
        retryable: true,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setError, clearError]);

  return isOnline;
}
