import { logger } from '@/lib/logger';

/**
 * Automatically crops black borders from images
 * Useful for 21:9 images that have letterboxing
 */
export async function cropBlackBorders(base64Data: string, mimeType: string): Promise<{ data: string; mimeType: string }> {
  // Only works in Node.js environment with sharp
  if (typeof window !== 'undefined') {
    return { data: base64Data, mimeType };
  }

  try {
    const sharp = require('sharp');

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Load image and get metadata
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return { data: base64Data, mimeType };
    }

    // Get raw pixel data
    const { data: pixels, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Detect black borders (threshold for "black" - adjust as needed)
    const blackThreshold = 30; // RGB values below this are considered black

    let top = 0;
    let bottom = info.height - 1;
    let left = 0;
    let right = info.width - 1;

    // Find top border
    for (let y = 0; y < info.height; y++) {
      let hasContent = false;
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * info.channels;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        if (r > blackThreshold || g > blackThreshold || b > blackThreshold) {
          hasContent = true;
          break;
        }
      }
      if (hasContent) {
        top = y;
        break;
      }
    }

    // Find bottom border
    for (let y = info.height - 1; y >= 0; y--) {
      let hasContent = false;
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * info.channels;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        if (r > blackThreshold || g > blackThreshold || b > blackThreshold) {
          hasContent = true;
          break;
        }
      }
      if (hasContent) {
        bottom = y;
        break;
      }
    }

    // Find left border
    for (let x = 0; x < info.width; x++) {
      let hasContent = false;
      for (let y = 0; y < info.height; y++) {
        const idx = (y * info.width + x) * info.channels;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        if (r > blackThreshold || g > blackThreshold || b > blackThreshold) {
          hasContent = true;
          break;
        }
      }
      if (hasContent) {
        left = x;
        break;
      }
    }

    // Find right border
    for (let x = info.width - 1; x >= 0; x--) {
      let hasContent = false;
      for (let y = 0; y < info.height; y++) {
        const idx = (y * info.width + x) * info.channels;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        if (r > blackThreshold || g > blackThreshold || b > blackThreshold) {
          hasContent = true;
          break;
        }
      }
      if (hasContent) {
        right = x;
        break;
      }
    }

    // Calculate crop dimensions
    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;

    // Only crop if we found significant borders (at least 5% of image)
    const borderThreshold = 0.05;
    const topBorder = top / info.height;
    const bottomBorder = (info.height - bottom - 1) / info.height;
    const leftBorder = left / info.width;
    const rightBorder = (info.width - right - 1) / info.width;

    const hasSigBorders = topBorder > borderThreshold || bottomBorder > borderThreshold ||
                          leftBorder > borderThreshold || rightBorder > borderThreshold;

    if (!hasSigBorders) {
      // No significant borders detected
      return { data: base64Data, mimeType };
    }

    // Crop the image
    const croppedBuffer = await sharp(imageBuffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();

    // Convert back to base64
    const croppedBase64 = croppedBuffer.toString('base64');

    return {
      data: croppedBase64,
      mimeType,
    };
  } catch (error) {
    logger.error('Error cropping black borders:', error);
    // Return original if cropping fails
    return { data: base64Data, mimeType };
  }
}
