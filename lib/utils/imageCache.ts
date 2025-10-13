/**
 * Image Cache Utility
 *
 * Provides an in-memory LRU cache for base64 converted images to:
 * - Reduce repeated image conversions
 * - Improve performance when replying to images
 * - Prevent duplicate API calls for the same image URL
 *
 * Features:
 * - LRU eviction policy (least recently used)
 * - Configurable max cache size
 * - Automatic cleanup of oldest entries
 */

interface CacheEntry {
  base64: string;
  timestamp: number;
  accessCount: number;
}

class ImageCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private maxAge: number; // in milliseconds

  constructor(maxSize = 50, maxAgeMinutes = 30) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAgeMinutes * 60 * 1000; // convert to milliseconds
  }

  /**
   * Get cached base64 data for a URL
   */
  get(url: string): string | null {
    const entry = this.cache.get(url);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(url);
      return null;
    }

    // Update access count and timestamp (LRU)
    entry.accessCount++;
    entry.timestamp = now;
    this.cache.set(url, entry); // Update entry

    return entry.base64;
  }

  /**
   * Set cached base64 data for a URL
   */
  set(url: string, base64: string): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      base64,
      timestamp: Date.now(),
      accessCount: 1,
    };

    this.cache.set(url, entry);
  }

  /**
   * Check if URL is cached
   */
  has(url: string): boolean {
    const entry = this.cache.get(url);
    if (!entry) return false;

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(url);
      return false;
    }

    return true;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    entries: Array<{ url: string; accessCount: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([url, entry]) => ({
      url,
      accessCount: entry.accessCount,
      age: Math.floor((now - entry.timestamp) / 1000), // in seconds
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries,
    };
  }

  /**
   * Evict the least recently used (oldest) entry
   */
  private evictOldest(): void {
    let oldestUrl: string | null = null;
    let oldestTimestamp = Infinity;

    // Find entry with oldest timestamp (LRU)
    for (const [url, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      this.cache.delete(oldestUrl);
      console.log("🗑️ Evicted oldest cache entry:", oldestUrl.substring(0, 50) + "...");
    }
  }

  /**
   * Remove expired entries (cleanup)
   */
  cleanup(): void {
    const now = Date.now();
    const expiredUrls: string[] = [];

    for (const [url, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredUrls.push(url);
      }
    }

    expiredUrls.forEach(url => this.cache.delete(url));

    if (expiredUrls.length > 0) {
      console.log(`🧹 Cleaned up ${expiredUrls.length} expired cache entries`);
    }
  }
}

// Export singleton instance
export const imageCache = new ImageCache(50, 30);

// Run cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    imageCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Helper function: Get cached base64 or convert and cache
 */
export async function getCachedBase64(
  url: string,
  converter: (url: string) => Promise<string>
): Promise<string> {
  // Check cache first
  const cached = imageCache.get(url);
  if (cached) {
    console.log("✅ Image cache HIT:", url.substring(0, 50) + "...");
    return cached;
  }

  // Cache miss - convert and store
  console.log("❌ Image cache MISS:", url.substring(0, 50) + "...");
  const base64 = await converter(url);
  imageCache.set(url, base64);

  return base64;
}
