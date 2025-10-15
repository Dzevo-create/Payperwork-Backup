"use client";

import { useEffect, useRef } from "react";
import { X, Download, ChevronLeft, ChevronRight, Calendar, Sparkles, Film, ImageIcon } from "lucide-react";
import { LibraryItem } from "@/types/library";
import { useToast } from "@/hooks/useToast";

interface MediaLightboxProps {
  isOpen: boolean;
  item: LibraryItem;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function MediaLightbox({ isOpen, item, onClose, onNavigate, hasNext, hasPrev }: MediaLightboxProps) {
  const toast = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        onNavigate("prev");
      } else if (e.key === "ArrowRight" && hasNext) {
        onNavigate("next");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNavigate, hasNext, hasPrev]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Auto-play video when opened
  useEffect(() => {
    if (isOpen && item.type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [isOpen, item.type, item.id]);

  const handleDownload = async () => {
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
      console.error("Download error:", error);
      toast.error("Download fehlgeschlagen");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pw-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all z-10 shadow-lg"
        title="Schließen (ESC)"
      >
        <X className="w-5 h-5 text-pw-black" />
      </button>

      {/* Navigation Buttons */}
      {hasPrev && (
        <button
          onClick={() => onNavigate("prev")}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-pw-black/80 hover:bg-pw-black/90 flex items-center justify-center transition-all z-10"
          title="Vorheriges (←)"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={() => onNavigate("next")}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-pw-black/80 hover:bg-pw-black/90 flex items-center justify-center transition-all z-10"
          title="Nächstes (→)"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-center gap-8 h-full w-full px-20 py-16">
        {/* Media Display */}
        <div className="flex-1 flex items-center justify-center h-full">
          {item.url ? (
            item.type === "video" ? (
              <video
                ref={videoRef}
                src={item.url}
                controls
                className="max-w-full max-h-full rounded-lg shadow-2xl"
                autoPlay
              />
            ) : (
              <img
                src={item.url}
                alt={item.name}
                className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-white/60">
              <ImageIcon className="w-16 h-16" />
              <p className="text-lg">Media nicht verfügbar</p>
              <p className="text-sm text-white/40">
                {item.type === "image"
                  ? "Bilder werden nicht dauerhaft gespeichert"
                  : "Video konnte nicht geladen werden"}
              </p>
            </div>
          )}
        </div>

        {/* Metadata Sidebar */}
        <div className="w-80 h-full flex flex-col bg-white/95 backdrop-blur-lg rounded-2xl p-6 overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              {item.type === "video" ? (
                <Film className="w-5 h-5 text-pw-black/60" />
              ) : (
                <ImageIcon className="w-5 h-5 text-pw-black/60" />
              )}
              <span className="text-pw-black/60 text-sm uppercase tracking-wide">
                {item.type === "video" ? "Video" : "Bild"}
              </span>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-full bg-pw-black/10 hover:bg-pw-black/20 flex items-center gap-2 text-pw-black text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          {/* Title */}
          <h2 className="text-pw-black text-xl font-semibold mb-6 break-words">{item.name}</h2>

          {/* Details */}
          <div className="space-y-4">
            {/* Source Image */}
            {item.sourceImage && (
              <div className="mb-4 p-3 bg-pw-black/5 rounded-xl">
                <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-2">Ausgangsbild</p>
                <img
                  src={item.sourceImage}
                  alt="Source"
                  className="w-full h-32 object-cover rounded-lg shadow-sm"
                />
              </div>
            )}

            {/* Model */}
            {item.model && (
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-pw-black/60 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-1">Modell</p>
                  <p className="text-pw-black text-sm">{item.model}</p>
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-pw-black/60 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-1">Erstellt</p>
                <p className="text-pw-black text-sm">{formatDate(item.createdAt)}</p>
              </div>
            </div>

            {/* Metadata */}
            {item.metadata && (
              <>
                {item.metadata.duration && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-pw-black/60" />
                    </div>
                    <div className="flex-1">
                      <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-1">Dauer</p>
                      <p className="text-pw-black text-sm">{item.metadata.duration}</p>
                    </div>
                  </div>
                )}
                {item.metadata.aspectRatio && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-pw-black/60" />
                    </div>
                    <div className="flex-1">
                      <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-1">Seitenverhältnis</p>
                      <p className="text-pw-black text-sm">{item.metadata.aspectRatio}</p>
                    </div>
                  </div>
                )}
                {item.metadata.resolution && (
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-pw-black/60" />
                    </div>
                    <div className="flex-1">
                      <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-1">Auflösung</p>
                      <p className="text-pw-black text-sm">{item.metadata.resolution}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Prompt */}
            {item.prompt && (
              <div className="pt-4 mt-4 border-t border-pw-black/10">
                <p className="text-pw-black/60 text-xs uppercase tracking-wide mb-2">Prompt</p>
                <p className="text-pw-black/80 text-sm leading-relaxed">{item.prompt}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
