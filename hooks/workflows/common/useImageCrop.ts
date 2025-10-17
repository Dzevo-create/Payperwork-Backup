'use client';

import { useState, useCallback } from 'react';

export type CropImageType = 'source' | 'reference' | null;

export interface UseImageCrop {
  cropModalOpen: boolean;
  imageToCrop: string | null;
  cropImageType: CropImageType;
  cropReferenceIndex: number | null;
  openCropModal: (image: string, type: 'source' | 'reference', index?: number) => void;
  closeCropModal: () => void;
  handleCropComplete: (
    croppedImage: string,
    onUpdate: (type: CropImageType, index: number | null, image: string) => void
  ) => void;
}

/**
 * Hook for managing image crop modal state
 * Handles opening/closing crop modal and processing cropped images
 */
export function useImageCrop(): UseImageCrop {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropImageType, setCropImageType] = useState<CropImageType>(null);
  const [cropReferenceIndex, setCropReferenceIndex] = useState<number | null>(null);

  const openCropModal = useCallback((
    image: string,
    type: 'source' | 'reference',
    index?: number
  ) => {
    setImageToCrop(image);
    setCropImageType(type);
    setCropReferenceIndex(index ?? null);
    setCropModalOpen(true);
  }, []);

  const closeCropModal = useCallback(() => {
    setCropModalOpen(false);
    setImageToCrop(null);
    setCropImageType(null);
    setCropReferenceIndex(null);
  }, []);

  const handleCropComplete = useCallback((
    croppedImage: string,
    onUpdate: (type: CropImageType, index: number | null, image: string) => void
  ) => {
    onUpdate(cropImageType, cropReferenceIndex, croppedImage);
    closeCropModal();
  }, [cropImageType, cropReferenceIndex, closeCropModal]);

  return {
    cropModalOpen,
    imageToCrop,
    cropImageType,
    cropReferenceIndex,
    openCropModal,
    closeCropModal,
    handleCropComplete,
  };
}
