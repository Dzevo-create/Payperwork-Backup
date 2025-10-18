/**
 * Image Cache Tests
 * Tests image caching functionality for workflow optimizations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock image cache implementation
class ImageCache {
  private cache: Map<string, string> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  set(key: string, value: string): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

describe('ImageCache', () => {
  let cache: ImageCache;

  beforeEach(() => {
    cache = new ImageCache();
  });

  describe('Basic operations', () => {
    it('should store and retrieve images', () => {
      const key = 'test-image-1';
      const value = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg';

      cache.set(key, value);

      expect(cache.get(key)).toBe(value);
      expect(cache.has(key)).toBe(true);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeUndefined();
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should delete cached images', () => {
      const key = 'test-image';
      cache.set(key, 'data:image/png;base64,test');

      expect(cache.has(key)).toBe(true);

      const deleted = cache.delete(key);

      expect(deleted).toBe(true);
      expect(cache.has(key)).toBe(false);
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cache.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should clear all cached images', () => {
      cache.set('image1', 'data1');
      cache.set('image2', 'data2');
      cache.set('image3', 'data3');

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.has('image1')).toBe(false);
      expect(cache.has('image2')).toBe(false);
      expect(cache.has('image3')).toBe(false);
    });
  });

  describe('Size management', () => {
    it('should track cache size correctly', () => {
      expect(cache.size()).toBe(0);

      cache.set('image1', 'data1');
      expect(cache.size()).toBe(1);

      cache.set('image2', 'data2');
      expect(cache.size()).toBe(2);

      cache.delete('image1');
      expect(cache.size()).toBe(1);
    });

    it('should respect max size limit', () => {
      const smallCache = new ImageCache(3);

      smallCache.set('image1', 'data1');
      smallCache.set('image2', 'data2');
      smallCache.set('image3', 'data3');

      expect(smallCache.size()).toBe(3);

      smallCache.set('image4', 'data4');

      expect(smallCache.size()).toBe(3);
      expect(smallCache.has('image1')).toBe(false);
      expect(smallCache.has('image4')).toBe(true);
    });

    it('should evict oldest entry when exceeding max size', () => {
      const cache = new ImageCache(2);

      cache.set('first', 'data1');
      cache.set('second', 'data2');
      cache.set('third', 'data3');

      expect(cache.has('first')).toBe(false);
      expect(cache.has('second')).toBe(true);
      expect(cache.has('third')).toBe(true);
    });
  });

  describe('Multiple images', () => {
    it('should handle multiple different images', () => {
      const images = [
        { key: 'avatar-1', data: 'data:image/jpeg;base64,avatar1' },
        { key: 'avatar-2', data: 'data:image/jpeg;base64,avatar2' },
        { key: 'photo-1', data: 'data:image/png;base64,photo1' },
      ];

      images.forEach(({ key, data }) => {
        cache.set(key, data);
      });

      images.forEach(({ key, data }) => {
        expect(cache.get(key)).toBe(data);
      });
    });

    it('should overwrite existing keys', () => {
      const key = 'test-image';

      cache.set(key, 'old-data');
      expect(cache.get(key)).toBe('old-data');

      cache.set(key, 'new-data');
      expect(cache.get(key)).toBe('new-data');
      expect(cache.size()).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string keys', () => {
      cache.set('', 'empty-key-data');
      expect(cache.get('')).toBe('empty-key-data');
    });

    it('should handle empty string values', () => {
      cache.set('test', '');
      expect(cache.get('test')).toBe('');
    });

    it('should handle special characters in keys', () => {
      const specialKeys = [
        'image/with/slashes',
        'image-with-dashes',
        'image_with_underscores',
        'image.with.dots',
        'image@with@at',
      ];

      specialKeys.forEach((key) => {
        cache.set(key, `data-for-${key}`);
        expect(cache.get(key)).toBe(`data-for-${key}`);
      });
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      cache.set(longKey, 'long-key-data');
      expect(cache.get(longKey)).toBe('long-key-data');
    });

    it('should handle very long values', () => {
      const longValue = 'data:image/png;base64,' + 'a'.repeat(10000);
      cache.set('large-image', longValue);
      expect(cache.get('large-image')).toBe(longValue);
    });
  });

  describe('Cache with custom max size', () => {
    it('should initialize with custom max size', () => {
      const customCache = new ImageCache(100);

      for (let i = 0; i < 100; i++) {
        customCache.set(`image-${i}`, `data-${i}`);
      }

      expect(customCache.size()).toBe(100);

      customCache.set('image-101', 'data-101');
      expect(customCache.size()).toBe(100);
    });

    it('should work with max size of 1', () => {
      const singleCache = new ImageCache(1);

      singleCache.set('first', 'data1');
      expect(singleCache.size()).toBe(1);

      singleCache.set('second', 'data2');
      expect(singleCache.size()).toBe(1);
      expect(singleCache.has('first')).toBe(false);
      expect(singleCache.has('second')).toBe(true);
    });
  });
});
