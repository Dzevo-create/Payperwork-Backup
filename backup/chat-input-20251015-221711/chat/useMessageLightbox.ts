import { useState } from "react";

export interface LightboxMedia {
  url: string;
  name: string;
  sourceImage?: string; // Optional source image to show in lightbox
}

/**
 * Hook for managing image and video lightbox state
 * Extracted from ChatMessages.tsx for better separation of concerns
 */
export function useMessageLightbox() {
  const [lightboxImage, setLightboxImage] = useState<LightboxMedia | null>(null);
  const [lightboxVideo, setLightboxVideo] = useState<LightboxMedia | null>(null);

  return {
    lightboxImage,
    setLightboxImage,
    lightboxVideo,
    setLightboxVideo,
  };
}
