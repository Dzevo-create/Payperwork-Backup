import { logger } from '@/lib/logger';

/**
 * Download a file from a URL with proper error handling
 * Extracted from ChatMessages.tsx for reusability
 *
 * @param url - URL of the file to download
 * @param filename - Desired filename for the download
 * @throws Error if fetch fails (caught internally and fallback to window.open)
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    // Fetch the file as a blob
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();

    // Create temporary URL for blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Create temporary anchor element to trigger download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;

    // Trigger download
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch (error) {
    logger.error('Download failed:', error);

    // Fallback: try opening in new tab (browser may prompt download)
    window.open(url, '_blank');
  }
}
