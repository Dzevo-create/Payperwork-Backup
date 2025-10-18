'use client';

import { useState, useCallback } from 'react';

export interface LightboxItem {
  id: string;
  imageUrl: string;
  timestamp: Date;
  name?: string;
  prompt?: string;
  type?: 'render' | 'video' | 'upscale';
}

export interface UseWorkflowLightbox {
  lightboxOpen: boolean;
  lightboxItem: LightboxItem | null;
  lightboxIndex: number;
  openLightbox: (item: LightboxItem, index: number) => void;
  closeLightbox: () => void;
  setLightboxIndex: (index: number) => void;
}

/**
 * Hook for managing lightbox state
 * Handles opening/closing lightbox and navigating between items
 */
export function useWorkflowLightbox(): UseWorkflowLightbox {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((item: LightboxItem, index: number) => {
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
