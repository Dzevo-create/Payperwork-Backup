'use client';

import { useState, useCallback } from 'react';

export interface UseWorkflowLightbox {
  lightboxOpen: boolean;
  lightboxItem: any | null;
  lightboxIndex: number;
  openLightbox: (item: any, index: number) => void;
  closeLightbox: () => void;
  setLightboxIndex: (index: number) => void;
}

/**
 * Hook for managing lightbox state
 * Handles opening/closing lightbox and navigating between items
 */
export function useWorkflowLightbox(): UseWorkflowLightbox {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<any | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((item: any, index: number) => {
    setLightboxItem(item);
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxItem(null);
  }, []);

  return {
    lightboxOpen,
    lightboxItem,
    lightboxIndex,
    openLightbox,
    closeLightbox,
    setLightboxIndex,
  };
}
