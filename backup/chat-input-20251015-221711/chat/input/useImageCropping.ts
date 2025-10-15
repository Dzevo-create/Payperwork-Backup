import { useState, useCallback } from "react";

interface UseImageCroppingReturn {
  cropModalOpen: boolean;
  cropImageIndex: number | null;
  cropImageUrl: string;
  openCropModal: (index: number, imageUrl: string) => void;
  closeCropModal: () => void;
  handleCropComplete: (
    croppedImageUrl: string,
    onUpdate: (index: number, data: any) => void
  ) => void;
}

/**
 * Custom hook for managing image cropping state and operations
 * Handles crop modal visibility, image selection, and crop completion
 */
export function useImageCropping(): UseImageCroppingReturn {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState<string>("");

  const openCropModal = useCallback((index: number, imageUrl: string) => {
    setCropImageIndex(index);
    setCropImageUrl(imageUrl);
    setCropModalOpen(true);
  }, []);

  const closeCropModal = useCallback(() => {
    setCropModalOpen(false);
    setCropImageIndex(null);
    setCropImageUrl("");
  }, []);

  const handleCropComplete = useCallback(
    (
      croppedImageUrl: string,
      onUpdate: (index: number, data: any) => void
    ) => {
      if (cropImageIndex !== null) {
        onUpdate(cropImageIndex, {
          url: croppedImageUrl,
          base64: croppedImageUrl,
        });
      }
      closeCropModal();
    },
    [cropImageIndex, closeCropModal]
  );

  return {
    cropModalOpen,
    cropImageIndex,
    cropImageUrl,
    openCropModal,
    closeCropModal,
    handleCropComplete,
  };
}
