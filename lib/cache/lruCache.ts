/**
 * LRU Cache Implementation
 *
 * Least Recently Used (LRU) cache for storing API responses and computed values.
 * Automatically evicts oldest entries when capacity is reached and removes expired entries.
 *
 * Features:
 * - Configurable size limit
 * - Time-to-live (TTL) expiration
 * - Access tracking
 * - Automatic cleanup
 *
 * @example
 * const cache = new LRUCache<string>(100, 5 * 60 * 1000);
 * cache.set('key', 'value');
 * const value = cache.get('key');
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number; // Time to live in ms

  constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Retrieve a value from the cache
   * @param key - The cache key
   * @returns The cached value or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access (move to end for LRU)
    this.cache.delete(key);
    entry.accessCount++;
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Store a value in the cache
   * @param key - The cache key
   * @param value - The value to cache
   */
  set(key: string, value: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });
  }

  /**
   * Check if a key exists and is not expired
   * @param key - The cache key
   * @returns True if the key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key from the cache
   * @param key - The cache key to delete
   * @returns True if the key was deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current number of entries in the cache
   * @returns The cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics including size, hit rate, etc.
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    entries: Array<{ key: string; accessCount: number; age: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      age: now - entry.timestamp
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      entries
    };
  }

  /**
   * Remove expired entries from the cache
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

/**
 * Create a simple hash from a string for cache keys
 * @param str - The string to hash
 * @returns A hash string
 */
export function createCacheKey(...parts: (string | number | boolean | null | undefined)[]): string {
  return parts
    .map(p => String(p ?? 'null'))
    .join(':')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * Create a hash from an object for cache keys
 * @param obj - The object to hash
 * @returns A hash string
 */
export function createObjectCacheKey(obj: Record<string, unknown>): string {
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(key => `${key}=${JSON.stringify(obj[key])}`);
  return parts.join('&');
}
