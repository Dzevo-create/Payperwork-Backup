'use client';

import { useCallback } from 'react';
import { workflowLogger } from '@/lib/logger';
import { uploadBase64Image, uploadFile } from '@/lib/supabase-library';

export interface UseFileUpload {
  uploadResultImage: (imageUrl: string, filename: string) => Promise<string>;
  uploadSourceImage: (imageUrl: string, filename: string) => Promise<string>;
  uploadImageFromUrl: (imageUrl: string, filename: string) => Promise<string>;
  uploadPreviousImage: (previousImage: string, filename: string) => Promise<string>;
}

/**
 * Hook for uploading images to storage
 * Handles base64 images, URLs, and blob uploads for workflow generations
 */
export function useFileUpload(): UseFileUpload {
  const uploadResultImage = useCallback(async (imageUrl: string, filename: string): Promise<string> => {
    try {
      const uploadedResult = await uploadBase64Image(imageUrl, filename);
      if (uploadedResult) {
        return uploadedResult;
      } else {
        workflowLogger.error('[Upload] Failed to upload result image, using base64');
        return imageUrl;
      }
    } catch (error) {
      workflowLogger.error('[Upload] Error uploading result image:', error as Error);
      return imageUrl;
    }
  }, []);

  const uploadSourceImage = useCallback(async (imageUrl: string, filename: string): Promise<string> => {
    try {
      const uploadedSource = await uploadBase64Image(imageUrl, filename);
      if (uploadedSource) {
        return uploadedSource;
      } else {
        workflowLogger.error('[Upload] Failed to upload source image, using base64');
        return imageUrl;
      }
    } catch (error) {
      workflowLogger.error('[Upload] Error uploading source image:', error as Error);
      return imageUrl;
    }
  }, []);

  const uploadImageFromUrl = useCallback(async (imageUrl: string, filename: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const uploadedImage = await uploadFile(blob, filename, 'image');
      if (uploadedImage) {
        return uploadedImage;
      } else {
        workflowLogger.error('[Upload] Failed to upload image from URL');
        return imageUrl;
      }
    } catch (error) {
      workflowLogger.error('[Upload] Error uploading image from URL:', error as Error);
      return imageUrl;
    }
  }, []);

  const uploadPreviousImage = useCallback(async (previousImage: string, filename: string): Promise<string> => {
    try {
      // If already in storage, return as-is
      if (previousImage.includes('supabase.co/storage')) {
        return previousImage;
      }

      // Handle base64 images
      if (previousImage.startsWith('data:')) {
        const uploadedPrevious = await uploadBase64Image(previousImage, filename);
        if (uploadedPrevious) {
          return uploadedPrevious;
        }
        return previousImage;
      }

      // Handle URL images
      const response = await fetch(previousImage);
      const blob = await response.blob();
      const uploadedPrevious = await uploadFile(blob, filename, 'image');
      if (uploadedPrevious) {
        return uploadedPrevious;
      }
      return previousImage;
    } catch (error) {
      workflowLogger.error('[Upload] Error uploading previous image:', error as Error);
      return previousImage;
    }
  }, []);

  return {
    uploadResultImage,
    uploadSourceImage,
    uploadImageFromUrl,
    uploadPreviousImage,
  };
}
