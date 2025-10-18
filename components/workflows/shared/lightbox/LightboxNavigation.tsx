/**
 * LightboxNavigation Component
 *
 * Navigation buttons for lightbox: Close, Previous, Next.
 */

"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxNavigationProps {
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function LightboxNavigation({
  onClose,
  onNavigate,
  hasPrev,
  hasNext,
}: LightboxNavigationProps) {
  return (
    <>
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all z-10 shadow-lg"
        title="Schließen (ESC)"
      >
        <X className="w-5 h-5 text-pw-black" />
      </button>

      {/* Previous Button */}
      {hasPrev && onNavigate && (
        <button
          onClick={() => onNavigate("prev")}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-pw-black/80 hover:bg-pw-black/90 flex items-center justify-center transition-all z-10"
          title="Vorheriges (←)"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Next Button */}
      {hasNext && onNavigate && (
        <button
          onClick={() => onNavigate("next")}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-pw-black/80 hover:bg-pw-black/90 flex items-center justify-center transition-all z-10"
          title="Nächstes (→)"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}
    </>
  );
}
