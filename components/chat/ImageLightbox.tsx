"use client";

import { X, Download } from "lucide-react";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { chatLogger } from '@/lib/logger';

interface ImageLightboxProps {
  imageUrl: string;
  imageName?: string;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl, imageName, onClose }: ImageLightboxProps) {
  const downloadAbortControllerRef = useRef<AbortController | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when lightbox is open & cleanup
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
      if (downloadAbortControllerRef.current) {
        downloadAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Download image function
  const handleDownload = async () => {
    try {
      downloadAbortControllerRef.current = new AbortController();

      const response = await fetch(imageUrl, {
        signal: downloadAbortControllerRef.current.signal,
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = imageName || "image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      downloadAbortControllerRef.current = null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        chatLogger.debug('Download aborted');
        return;
      }
      chatLogger.error('Download failed:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute top-4 right-20 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
        aria-label="Download"
        title="Bild herunterladen"
      >
        <Download className="w-6 h-6 text-white" />
      </button>

      {/* Image name */}
      {imageName && (
        <div className="absolute top-4 left-4 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg z-10">
          <p className="text-sm text-white font-medium">{imageName}</p>
        </div>
      )}

      {/* Image container */}
      <div
        className="relative max-w-[70vw] max-h-[70vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={imageName || "Image"}
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
        <p className="text-xs text-white/80">Klicken oder ESC zum Schließen</p>
      </div>
    </div>
  );
}
