/**
 * LRU Cache Tests
 *
 * Comprehensive test suite for the LRU Cache implementation.
 * Tests core functionality, edge cases, and performance characteristics.
 */

import { LRUCache, createCacheKey, createObjectCacheKey } from '@/lib/cache/lruCache';

describe('LRUCache', () => {
  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      const cache = new LRUCache<string>(10, 60000);

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      const cache = new LRUCache<string>(10, 60000);

      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should handle different value types', () => {
      const cache = new LRUCache<unknown>(10, 60000);

      cache.set('string', 'text');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('object', { key: 'value' });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('text');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('object')).toEqual({ key: 'value' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should update existing values', () => {
      const cache = new LRUCache<string>(10, 60000);

      cache.set('key1', 'value1');
      cache.set('key1', 'value2');

      expect(cache.get('key1')).toBe('value2');
      expect(cache.size()).toBe(1);
    });

    it('should check if key exists', () => {
      const cache = new LRUCache<string>(10, 60000);

      cache.set('key1', 'value1');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete specific keys', () => {
      const cache = new LRUCache<string>(10, 60000);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.size()).toBe(1);
    });

    it('should clear all entries', () => {
      const cache = new LRUCache<string>(10, 60000);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
    });

    it('should return correct size', () => {
      const cache = new LRUCache<string>(10, 60000);

      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entry when at capacity', () => {
      const cache = new LRUCache<string>(3, 60000);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Cache is full, adding key4 should evict key1 (least recently used)
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
      expect(cache.size()).toBe(3);
    });

    it('should update LRU order on get access', () => {
      const cache = new LRUCache<string>(3, 60000);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add key4, should evict key2 (now least recently used)
      cache.set('key4', 'value4');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should not evict when updating existing key', () => {
      const cache = new LRUCache<string>(3, 60000);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Update existing key should not evict
      cache.set('key2', 'updated');

      expect(cache.size()).toBe(3);
      expect(cache.get('key2')).toBe('updated');
    });
  });

  describe('TTL Expiration', () => {
    it('should return null for expired entries', async () => {
      const cache = new LRUCache<string>(10, 100); // 100ms TTL

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.get('key1')).toBeNull();
    });

    it('should remove expired entries from cache', async () => {
      const cache = new LRUCache<string>(10, 100);

      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      await new Promise(resolve => setTimeout(resolve, 150));

      // Accessing expired entry should remove it
      cache.get('key1');
      expect(cache.size()).toBe(0);
    });

    it('should return false for has() on expired entries', async () => {
      const cache = new LRUCache<string>(10, 100);

      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.has('key1')).toBe(false);
    });

    it('should cleanup expired entries', async () => {
      const cache = new LRUCache<string>(10, 100);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      await new Promise(resolve => setTimeout(resolve, 150));

      const removed = cache.cleanup();

      expect(removed).toBe(3);
      expect(cache.size()).toBe(0);
    });
  });

  describe('Access Tracking', () => {
    it('should track access count', () => {
      const cache = new LRUCache<string>(10, 60000);

      cache.set('key1', 'value1');

      // Access multiple times
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');

      const stats = cache.getStats();
      const entry = stats.entries.find(e => e.key === 'key1');

      expect(entry?.accessCount).toBe(3);
    });
  });

  describe('Statistics', () => {
    it('should provide cache statistics', () => {
      const cache = new LRUCache<string>(10, 60000);

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(10);
      expect(stats.ttl).toBe(60000);
      expect(stats.entries).toHaveLength(2);
    });

    it('should track entry age', async () => {
      const cache = new LRUCache<string>(10, 60000);

      cache.set('key1', 'value1');

      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = cache.getStats();
      const entry = stats.entries.find(e => e.key === 'key1');

      expect(entry?.age).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle cache with size 1', () => {
      const cache = new LRUCache<string>(1, 60000);

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      cache.set('key2', 'value2');
      expect(cache.has('key1')).toBe(false);
      expect(cache.get('key2')).toBe('value2');
    });

    it('should handle empty string keys and values', () => {
      const cache = new LRUCache<string>(10, 60000);

      cache.set('', '');
      expect(cache.get('')).toBe('');
    });

    it('should handle null values', () => {
      const cache = new LRUCache<string | null>(10, 60000);

      cache.set('key1', null);
      expect(cache.get('key1')).toBeNull();
      expect(cache.has('key1')).toBe(true); // Key exists, value is null
    });
  });
});

describe('Cache Key Helpers', () => {
  describe('createCacheKey', () => {
    it('should create key from multiple parts', () => {
      const key = createCacheKey('user', 123, 'profile');
      expect(key).toBe('user:123:profile');
    });

    it('should handle null and undefined', () => {
      const key = createCacheKey('user', null, undefined, 'data');
      expect(key).toBe('user:null:null:data');
    });

    it('should convert to lowercase', () => {
      const key = createCacheKey('USER', 'PROFILE');
      expect(key).toBe('user:profile');
    });

    it('should replace spaces with hyphens', () => {
      const key = createCacheKey('user profile', 'data set');
      expect(key).toBe('user-profile:data-set');
    });
  });

  describe('createObjectCacheKey', () => {
    it('should create key from object', () => {
      const key = createObjectCacheKey({
        userId: 123,
        type: 'profile',
        active: true
      });

      expect(key).toContain('userId=123');
      expect(key).toContain('type="profile"');
      expect(key).toContain('active=true');
    });

    it('should sort keys for consistent hashing', () => {
      const key1 = createObjectCacheKey({ a: 1, b: 2 });
      const key2 = createObjectCacheKey({ b: 2, a: 1 });

      expect(key1).toBe(key2);
    });

    it('should handle complex values', () => {
      const key = createObjectCacheKey({
        obj: { nested: 'value' },
        arr: [1, 2, 3],
        str: 'text'
      });

      expect(key).toBeTruthy();
      expect(typeof key).toBe('string');
    });
  });
});
