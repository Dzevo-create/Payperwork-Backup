/**
 * Rate Limit Tests
 * Tests rate limiting functionality for API protection
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock rate limiter implementation
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  check(clientId: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const clientRequests = this.requests.get(clientId) || [];
    const recentRequests = clientRequests.filter((time) => time > windowStart);

    if (recentRequests.length >= this.config.maxRequests) {
      const oldestRequest = recentRequests[0] || now;
      const reset = oldestRequest + this.config.windowMs;

      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset,
      };
    }

    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - recentRequests.length,
      reset: now + this.config.windowMs,
    };
  }

  reset(clientId: string): void {
    this.requests.delete(clientId);
  }

  clear(): void {
    this.requests.clear();
  }
}

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 60000, // 1 minute
    });
  });

  describe('Basic rate limiting', () => {
    it('should allow requests within limit', () => {
      const clientId = 'client-1';

      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.check(clientId);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(5 - i - 1);
      }
    });

    it('should block requests exceeding limit', () => {
      const clientId = 'client-1';

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(clientId);
      }

      // 6th request should be blocked
      const result = rateLimiter.check(clientId);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reset).toBeDefined();
    });

    it('should track limits per client separately', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';

      // Client 1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(client1);
      }

      // Client 2 should still be able to make requests
      const result = rateLimiter.check(client2);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('Rate limit metadata', () => {
    it('should return correct limit and remaining count', () => {
      const clientId = 'client-1';

      const result1 = rateLimiter.check(clientId);
      expect(result1.limit).toBe(5);
      expect(result1.remaining).toBe(4);

      const result2 = rateLimiter.check(clientId);
      expect(result2.limit).toBe(5);
      expect(result2.remaining).toBe(3);
    });

    it('should return reset timestamp', () => {
      const clientId = 'client-1';
      const before = Date.now();

      const result = rateLimiter.check(clientId);

      expect(result.reset).toBeDefined();
      expect(result.reset!).toBeGreaterThan(before);
    });

    it('should calculate reset time correctly when blocked', () => {
      const clientId = 'client-1';
      const startTime = Date.now();

      // Max out requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(clientId);
      }

      const blockedResult = rateLimiter.check(clientId);

      expect(blockedResult.reset).toBeDefined();
      expect(blockedResult.reset!).toBeGreaterThan(startTime);
      expect(blockedResult.reset!).toBeLessThanOrEqual(startTime + 60000);
    });
  });

  describe('Window sliding', () => {
    it('should allow requests after window expires', () => {
      jest.useFakeTimers();
      const clientId = 'client-1';

      // Max out requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(clientId);
      }

      // Should be blocked
      let result = rateLimiter.check(clientId);
      expect(result.success).toBe(false);

      // Advance time beyond window
      jest.advanceTimersByTime(60001);

      // Should be allowed again
      result = rateLimiter.check(clientId);
      expect(result.success).toBe(true);

      jest.useRealTimers();
    });

    it('should only count requests within window', () => {
      jest.useFakeTimers();
      const clientId = 'client-1';

      // Make 3 requests
      rateLimiter.check(clientId);
      rateLimiter.check(clientId);
      rateLimiter.check(clientId);

      // Advance time to expire these requests
      jest.advanceTimersByTime(60001);

      // Should have full quota again
      const result = rateLimiter.check(clientId);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);

      jest.useRealTimers();
    });
  });

  describe('Reset functionality', () => {
    it('should reset client rate limit', () => {
      const clientId = 'client-1';

      // Max out requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.check(clientId);
      }

      // Should be blocked
      let result = rateLimiter.check(clientId);
      expect(result.success).toBe(false);

      // Reset
      rateLimiter.reset(clientId);

      // Should be allowed again
      result = rateLimiter.check(clientId);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should only reset specific client', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';

      // Both clients make requests
      rateLimiter.check(client1);
      rateLimiter.check(client2);

      // Reset client 1
      rateLimiter.reset(client1);

      // Client 1 should have full quota
      const result1 = rateLimiter.check(client1);
      expect(result1.remaining).toBe(4);

      // Client 2 should still have used quota
      const result2 = rateLimiter.check(client2);
      expect(result2.remaining).toBe(3);
    });

    it('should clear all clients', () => {
      rateLimiter.check('client-1');
      rateLimiter.check('client-2');
      rateLimiter.check('client-3');

      rateLimiter.clear();

      // All clients should have full quota
      expect(rateLimiter.check('client-1').remaining).toBe(4);
      expect(rateLimiter.check('client-2').remaining).toBe(4);
      expect(rateLimiter.check('client-3').remaining).toBe(4);
    });
  });

  describe('Different configurations', () => {
    it('should work with low limit', () => {
      const strictLimiter = new RateLimiter({
        maxRequests: 1,
        windowMs: 60000,
      });

      const result1 = strictLimiter.check('client');
      expect(result1.success).toBe(true);

      const result2 = strictLimiter.check('client');
      expect(result2.success).toBe(false);
    });

    it('should work with high limit', () => {
      const generousLimiter = new RateLimiter({
        maxRequests: 100,
        windowMs: 60000,
      });

      for (let i = 0; i < 100; i++) {
        const result = generousLimiter.check('client');
        expect(result.success).toBe(true);
      }

      const result = generousLimiter.check('client');
      expect(result.success).toBe(false);
    });

    it('should work with short window', () => {
      jest.useFakeTimers();
      const shortWindowLimiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 1000, // 1 second
      });

      // Max out requests
      for (let i = 0; i < 3; i++) {
        shortWindowLimiter.check('client');
      }

      // Blocked
      let result = shortWindowLimiter.check('client');
      expect(result.success).toBe(false);

      // Wait for window to expire
      jest.advanceTimersByTime(1001);

      // Should be allowed
      result = shortWindowLimiter.check('client');
      expect(result.success).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty client ID', () => {
      const result = rateLimiter.check('');
      expect(result.success).toBe(true);
    });

    it('should handle very long client IDs', () => {
      const longId = 'a'.repeat(1000);
      const result = rateLimiter.check(longId);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in client ID', () => {
      const specialIds = [
        'client@domain.com',
        'client/with/slashes',
        'client-with-dashes',
        'client_with_underscores',
      ];

      specialIds.forEach((id) => {
        const result = rateLimiter.check(id);
        expect(result.success).toBe(true);
      });
    });

    it('should handle rapid consecutive requests', () => {
      const clientId = 'rapid-client';
      const results = [];

      for (let i = 0; i < 10; i++) {
        results.push(rateLimiter.check(clientId));
      }

      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBe(5);
    });
  });
});

describe('Multiple RateLimiters', () => {
  it('should maintain separate limits', () => {
    const limiter1 = new RateLimiter({ maxRequests: 3, windowMs: 60000 });
    const limiter2 = new RateLimiter({ maxRequests: 5, windowMs: 60000 });

    const clientId = 'client-1';

    // Max out first limiter
    for (let i = 0; i < 3; i++) {
      limiter1.check(clientId);
    }

    // First limiter blocked
    expect(limiter1.check(clientId).success).toBe(false);

    // Second limiter still allows
    expect(limiter2.check(clientId).success).toBe(true);
  });
});
