/**
 * Image utility functions for handling image conversions and transformations
 */

/**
 * Converts an image URL (Supabase or other HTTP URL) to a base64 data URL
 *
 * @param url - Image URL to convert (can be HTTP URL or already a data URL)
 * @returns Base64 data URL (data:image/png;base64,...)
 * @throws Error if image cannot be fetched or converted
 *
 * @example
 * // Convert Supabase URL to base64
 * const base64 = await convertImageUrlToBase64("https://supabase.co/.../image.png");
 * // Returns: "data:image/png;base64,iVBORw0KGgo..."
 *
 * @example
 * // Already base64 - returns as-is
 * const base64 = await convertImageUrlToBase64("data:image/png;base64,iVBORw0KGgo...");
 * // Returns: "data:image/png;base64,iVBORw0KGgo..."
 */
export async function convertImageUrlToBase64(url: string): Promise<string> {
  try {
    // If already base64 data URL, return as-is
    if (url.startsWith('data:')) {
      return url;
    }

    // Fetch image from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Convert response to blob
    const blob = await response.blob();

    // Convert blob to base64 data URL using FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image blob'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image URL to base64:', error);
    throw error;
  }
}
