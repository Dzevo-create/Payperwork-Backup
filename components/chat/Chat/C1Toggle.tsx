"use client";

import { Sparkles } from "lucide-react";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { useSuperChatStore } from "@/store/superChatStore";

/**
 * C1 Toggle Component - Interactive Button
 *
 * Allows users to toggle between Standard Chat and Super Chat (C1).
 * Only visible if SHOW_C1_TOGGLE is enabled in feature flags.
 *
 * Usage:
 * Import this in ChatHeader and add it to the right side of the header.
 */

export function C1Toggle() {
  // IMPORTANT: Hooks MUST be called before any conditional returns
  const isSuperChatEnabled = useSuperChatStore((state) => state.isSuperChatEnabled);
  const toggleSuperChat = useSuperChatStore((state) => state.toggleSuperChat);

  // Don't render if toggle is not enabled
  if (!FEATURE_FLAGS.SHOW_C1_TOGGLE) {
    return null;
  }

  return (
    <button
      onClick={toggleSuperChat}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-200 hover:scale-105 active:scale-95
        ${
          isSuperChatEnabled
            ? "bg-purple-500/20 text-purple-600 border border-purple-500/30 hover:bg-purple-500/30"
            : "bg-pw-black/5 text-pw-black/60 border border-pw-black/10 hover:bg-pw-black/10"
        }
      `}
      title={isSuperChatEnabled ? "Super Chat aktiv - Klick zum Deaktivieren" : "Standard Chat - Klick für Super Chat"}
    >
      <Sparkles className={`w-3.5 h-3.5 ${isSuperChatEnabled ? "animate-pulse" : ""}`} />
      <span className="hidden sm:inline">{isSuperChatEnabled ? "Super Chat" : "Standard"}</span>
    </button>
  );
}
