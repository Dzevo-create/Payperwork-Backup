/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API routes.
 * For production, use Redis-based solution (Upstash, Vercel KV, etc.)
 */

interface RateLimitConfig {
  interval: number; // Time window in ms
  uniqueTokenPerInterval: number; // Max requests per interval
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private cache = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Clean up expired entries every minute
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.resetAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Check if request is allowed
   * @param identifier - User identifier (IP, userId, etc.)
   * @returns { success: boolean, limit: number, remaining: number, reset: number }
   */
  check(identifier: string): {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  } {
    const now = Date.now();
    const entry = this.cache.get(identifier);

    // No entry or expired - create new
    if (!entry || entry.resetAt < now) {
      const resetAt = now + this.config.interval;
      this.cache.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        limit: this.config.uniqueTokenPerInterval,
        remaining: this.config.uniqueTokenPerInterval - 1,
        reset: resetAt,
      };
    }

    // Entry exists and not expired
    if (entry.count < this.config.uniqueTokenPerInterval) {
      entry.count++;
      return {
        success: true,
        limit: this.config.uniqueTokenPerInterval,
        remaining: this.config.uniqueTokenPerInterval - entry.count,
        reset: entry.resetAt,
      };
    }

    // Rate limit exceeded
    return {
      success: false,
      limit: this.config.uniqueTokenPerInterval,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.cache.delete(identifier);
  }
}

// Export pre-configured rate limiters
export const chatRateLimiter = new RateLimiter({
  interval: 60000, // 1 minute
  uniqueTokenPerInterval: 30, // 30 messages per minute
});

export const imageGenerationRateLimiter = new RateLimiter({
  interval: 60000, // 1 minute
  uniqueTokenPerInterval: 5, // 5 images per minute
});

export const videoGenerationRateLimiter = new RateLimiter({
  interval: 60000, // 1 minute
  uniqueTokenPerInterval: 2, // 2 videos per minute
});

export const imageEditRateLimiter = new RateLimiter({
  interval: 60000, // 1 minute
  uniqueTokenPerInterval: 50, // 50 edits per minute (very generous - editing is iterative)
});

export const apiRateLimiter = new RateLimiter({
  interval: 60000, // 1 minute
  uniqueTokenPerInterval: 60, // 60 requests per minute
});

/**
 * Get client identifier from request
 */
export function getClientId(request: Request): string {
  // Try to get IP from headers (works with Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

  // In production, you might want to combine with user ID if authenticated
  return ip;
}

/**
 * Helper to add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Headers,
  result: { limit: number; remaining: number; reset: number }
): Headers {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());
  return headers;
}
