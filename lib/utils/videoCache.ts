/**
 * Video Cache Utility
 *
 * Provides an in-memory LRU cache for video URLs to:
 * - Reduce repeated video loading
 * - Improve performance when switching between conversations
 * - Prevent duplicate API calls for video status checks
 *
 * Features:
 * - LRU eviction policy (least recently used)
 * - Configurable max cache size (smaller than images due to memory)
 * - Automatic cleanup of oldest entries
 * - Task ID → Video URL mapping
 */

interface VideoCacheEntry {
  videoUrl: string;
  taskId: string;
  model: "payperwork-v1" | "payperwork-v2";
  timestamp: number;
  accessCount: number;
  duration?: string;
  aspectRatio?: string;
}

class VideoCache {
  private cache: Map<string, VideoCacheEntry>;
  private taskIdIndex: Map<string, string>; // taskId → cacheKey mapping
  private maxSize: number;
  private maxAge: number; // in milliseconds

  constructor(maxSize = 20, maxAgeHours = 1) {
    this.cache = new Map();
    this.taskIdIndex = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAgeHours * 60 * 60 * 1000; // convert to milliseconds
  }

  /**
   * Get cached video data by task ID or video URL
   */
  get(keyOrTaskId: string): VideoCacheEntry | null {
    // Try direct cache lookup first
    let entry = this.cache.get(keyOrTaskId);

    // If not found, try task ID index
    if (!entry) {
      const cacheKey = this.taskIdIndex.get(keyOrTaskId);
      if (cacheKey) {
        entry = this.cache.get(cacheKey);
      }
    }

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.maxAge) {
      this.delete(keyOrTaskId);
      return null;
    }

    // Update access count and timestamp (LRU)
    entry.accessCount++;
    entry.timestamp = now;
    this.cache.set(entry.videoUrl, entry); // Update entry

    return entry;
  }

  /**
   * Set cached video data
   */
  set(entry: Omit<VideoCacheEntry, "timestamp" | "accessCount">): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const cacheEntry: VideoCacheEntry = {
      ...entry,
      timestamp: Date.now(),
      accessCount: 1,
    };

    // Store in cache with videoUrl as key
    this.cache.set(entry.videoUrl, cacheEntry);

    // Add task ID index
    this.taskIdIndex.set(entry.taskId, entry.videoUrl);
  }

  /**
   * Check if video is cached (by URL or task ID)
   */
  has(keyOrTaskId: string): boolean {
    const entry = this.get(keyOrTaskId);
    return entry !== null;
  }

  /**
   * Delete cache entry (by URL or task ID)
   */
  delete(keyOrTaskId: string): void {
    // Try direct cache lookup
    let entry = this.cache.get(keyOrTaskId);

    // If not found, try task ID index
    if (!entry) {
      const cacheKey = this.taskIdIndex.get(keyOrTaskId);
      if (cacheKey) {
        entry = this.cache.get(cacheKey);
      }
    }

    if (entry) {
      this.cache.delete(entry.videoUrl);
      this.taskIdIndex.delete(entry.taskId);
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.taskIdIndex.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    entries: Array<{
      videoUrl: string;
      taskId: string;
      model: string;
      accessCount: number;
      age: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([url, entry]) => ({
      videoUrl: url.substring(0, 50) + "...",
      taskId: entry.taskId,
      model: entry.model,
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
      const entry = this.cache.get(oldestUrl);
      if (entry) {
        this.cache.delete(oldestUrl);
        this.taskIdIndex.delete(entry.taskId);
        console.log(
          "🗑️ Evicted oldest video cache entry:",
          entry.taskId
        );
      }
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
        this.taskIdIndex.delete(entry.taskId);
      }
    }

    expiredUrls.forEach((url) => this.cache.delete(url));

    if (expiredUrls.length > 0) {
      console.log(
        `🧹 Cleaned up ${expiredUrls.length} expired video cache entries`
      );
    }
  }
}

// Export singleton instance (smaller cache than images, 1 hour TTL)
export const videoCache = new VideoCache(20, 1);

// Run cleanup every 10 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    videoCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Helper function: Get cached video or fetch from API
 */
export async function getCachedVideo(
  taskId: string,
  fetcher: () => Promise<{ videoUrl: string; model: "payperwork-v1" | "payperwork-v2"; duration?: string; aspectRatio?: string }>
): Promise<string> {
  // Check cache first (by task ID)
  const cached = videoCache.get(taskId);
  if (cached) {
    console.log("✅ Video cache HIT:", taskId);
    return cached.videoUrl;
  }

  // Cache miss - fetch and store
  console.log("❌ Video cache MISS:", taskId);
  const data = await fetcher();

  videoCache.set({
    videoUrl: data.videoUrl,
    taskId,
    model: data.model,
    duration: data.duration,
    aspectRatio: data.aspectRatio,
  });

  return data.videoUrl;
}
