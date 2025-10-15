/**
 * Image Processor for Sketch-to-Render Workflow
 *
 * Handles image preparation, validation, and ordering for Gemini API.
 * IMPORTANT: Source image must be LAST in the array (determines aspect ratio).
 */

import { apiLogger } from "@/lib/logger";

/**
 * Image data structure for API calls
 */
export interface ImageData {
  data: string;
  mimeType: string;
}

/**
 * Gemini API image format
 */
export interface GeminiImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Prepares images for Gemini generation
 *
 * CRITICAL ORDER: Reference images first, source image LAST
 * The last image in the array determines the aspect ratio for generation!
 *
 * @param sourceImage - The main sketch/source image (determines aspect ratio)
 * @param referenceImages - Optional reference images for style/context
 * @returns Array of Gemini-formatted image parts in correct order
 *
 * @example
 * ```typescript
 * const images = prepareImagesForGeneration(
 *   { data: "base64...", mimeType: "image/jpeg" },
 *   [
 *     { data: "base64...", mimeType: "image/png" },
 *     { data: "base64...", mimeType: "image/jpeg" }
 *   ]
 * );
 * // Returns: [ref1, ref2, sourceImage] - sourceImage is LAST
 * ```
 */
export function prepareImagesForGeneration(
  sourceImage: ImageData,
  referenceImages?: ImageData[]
): GeminiImagePart[] {
  const images: GeminiImagePart[] = [];

  // Add reference images first (if provided)
  if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
    for (const refImage of referenceImages) {
      if (refImage?.data && refImage?.mimeType) {
        images.push({
          inlineData: {
            data: refImage.data,
            mimeType: refImage.mimeType,
          },
        });
        apiLogger.debug("Added reference image", {
          mimeType: refImage.mimeType,
          dataLength: refImage.data.length,
        });
      }
    }
  }

  // Add source image LAST (this determines the aspect ratio!)
  images.push({
    inlineData: {
      data: sourceImage.data,
      mimeType: sourceImage.mimeType,
    },
  });

  apiLogger.info("Prepared images for generation", {
    totalImages: images.length,
    referenceCount: referenceImages?.length || 0,
    sourceImageLast: true,
  });

  return images;
}

/**
 * Validates source image
 *
 * @param sourceImage - The source image to validate
 * @returns Validation result with error message if invalid
 */
export function validateSourceImage(sourceImage: any): ValidationResult {
  if (!sourceImage) {
    return {
      valid: false,
      error: "Source image is required",
    };
  }

  if (typeof sourceImage !== "object") {
    return {
      valid: false,
      error: "Source image must be an object",
    };
  }

  if (!sourceImage.data || typeof sourceImage.data !== "string") {
    return {
      valid: false,
      error: "Source image data is required and must be a base64 string",
    };
  }

  if (!sourceImage.mimeType || typeof sourceImage.mimeType !== "string") {
    return {
      valid: false,
      error: "Source image mimeType is required",
    };
  }

  // Validate mime type
  const validMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validMimeTypes.includes(sourceImage.mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid mime type: ${sourceImage.mimeType}. Must be one of: ${validMimeTypes.join(", ")}`,
    };
  }

  // Validate base64 data
  if (sourceImage.data.length < 100) {
    return {
      valid: false,
      error: "Source image data appears to be too short",
    };
  }

  return { valid: true };
}

/**
 * Validates reference images
 *
 * @param referenceImages - Array of reference images to validate
 * @returns Validation result with error message if invalid
 */
export function validateReferenceImages(referenceImages?: any[]): ValidationResult {
  // Reference images are optional
  if (!referenceImages || referenceImages.length === 0) {
    return { valid: true };
  }

  if (!Array.isArray(referenceImages)) {
    return {
      valid: false,
      error: "Reference images must be an array",
    };
  }

  // Validate each reference image
  for (let i = 0; i < referenceImages.length; i++) {
    const refImage = referenceImages[i];

    if (!refImage || typeof refImage !== "object") {
      return {
        valid: false,
        error: `Reference image ${i + 1} is invalid`,
      };
    }

    if (!refImage.data || typeof refImage.data !== "string") {
      return {
        valid: false,
        error: `Reference image ${i + 1} is missing valid data`,
      };
    }

    if (!refImage.mimeType || typeof refImage.mimeType !== "string") {
      return {
        valid: false,
        error: `Reference image ${i + 1} is missing mimeType`,
      };
    }

    const validMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validMimeTypes.includes(refImage.mimeType.toLowerCase())) {
      return {
        valid: false,
        error: `Reference image ${i + 1} has invalid mime type: ${refImage.mimeType}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates all images for generation
 *
 * @param sourceImage - The source image
 * @param referenceImages - Optional reference images
 * @returns Validation result with error message if invalid
 */
export function validateImages(
  sourceImage: any,
  referenceImages?: any[]
): ValidationResult {
  // Validate source image first
  const sourceValidation = validateSourceImage(sourceImage);
  if (!sourceValidation.valid) {
    return sourceValidation;
  }

  // Validate reference images
  const refValidation = validateReferenceImages(referenceImages);
  if (!refValidation.valid) {
    return refValidation;
  }

  apiLogger.debug("Image validation successful", {
    hasSource: !!sourceImage,
    referenceCount: referenceImages?.length || 0,
  });

  return { valid: true };
}

/**
 * Extracts mime type from base64 data URL
 *
 * @param dataUrl - Base64 data URL (e.g., "data:image/jpeg;base64,...")
 * @returns Mime type or null if invalid
 */
export function extractMimeType(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
}

/**
 * Strips data URL prefix from base64 string
 *
 * @param dataUrl - Base64 data URL
 * @returns Pure base64 string without prefix
 */
export function stripDataUrlPrefix(dataUrl: string): string {
  if (dataUrl.startsWith("data:")) {
    const base64Index = dataUrl.indexOf("base64,");
    if (base64Index !== -1) {
      return dataUrl.substring(base64Index + 7);
    }
  }
  return dataUrl;
}

/**
 * Converts File to ImageData
 *
 * @param file - File object from input
 * @returns Promise resolving to ImageData
 */
export async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = file.type;
      const data = stripDataUrlPrefix(result);

      resolve({
        data,
        mimeType,
      });
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}
