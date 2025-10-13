"use client";

import { AlertCircle, RefreshCw, X } from "lucide-react";
import { useChatStore } from "@/store/chatStore.supabase";

export function ErrorDisplay() {
  const error = useChatStore((state) => state.error);
  const clearError = useChatStore((state) => state.clearError);

  if (!error) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4 md:bottom-20 md:top-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-800 font-medium">Fehler</p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
            {error.retryable && (
              <p className="text-xs text-red-600 mt-2">
                Bitte versuche es erneut
              </p>
            )}
          </div>
          <button
            onClick={clearError}
            className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
            aria-label="Fehler schließen"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
