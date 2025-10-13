import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

/**
 * Compress an image file to reduce size
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 1, // Max 1MB
    maxWidthOrHeight: 1920, // Max 1920px
    useWebWorker: true, // Use web worker for better performance
    ...options,
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Convert image file to base64
 * @param file - The image file
 * @returns Base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image and convert to base64
 * @param file - The image file
 * @param options - Compression options
 * @returns Base64 string of compressed image
 */
export async function compressAndConvertToBase64(
  file: File,
  options?: CompressionOptions
): Promise<string> {
  const compressedFile = await compressImage(file, options);
  return fileToBase64(compressedFile);
}
