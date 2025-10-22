/**
 * Rate Limiting Middleware for API Routes
 *
 * Supports two modes:
 * 1. In-memory (development) - Simple Map-based rate limiting
 * 2. Upstash Redis (production) - Distributed rate limiting across serverless functions
 *
 * Environment Variables:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token
 *
 * Usage:
 * ```typescript
 * import { rateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimit(request, {
 *     limit: 10,
 *     window: '1m',
 *   });
 *
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.error;
 *   }
 *
 *   // Continue with API logic...
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { apiLogger } from "@/lib/logger";

// ============================================
// Configuration
// ============================================

const isProduction = process.env.NODE_ENV === "production";
const hasUpstashConfig = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// ============================================
// In-Memory Rate Limiter (Development)
// ============================================

interface InMemoryStore {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, InMemoryStore>();

// Clean up expired entries every 5 minutes
if (typeof window === "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, value] of inMemoryStore.entries()) {
        if (now > value.resetTime) {
          inMemoryStore.delete(key);
        }
      }
    },
    5 * 60 * 1000
  );
}

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid window format: ${window}`);
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit as keyof typeof multipliers];
}

async function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
}> {
  const now = Date.now();
  const entry = inMemoryStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Create new entry
    inMemoryStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      success: true,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  // Increment count
  entry.count++;
  inMemoryStore.set(identifier, entry);

  const success = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  return {
    success,
    remaining,
    reset: entry.resetTime,
  };
}

// ============================================
// Upstash Rate Limiter (Production)
// ============================================

let upstashRateLimiter: Ratelimit | null = null;

if (hasUpstashConfig && typeof window === "undefined") {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    upstashRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1m"), // Default, overridden per request
      analytics: true,
      prefix: "payperwork:ratelimit",
    });

    apiLogger.info("Upstash Rate Limiter initialized");
  } catch (error) {
    apiLogger.error("Failed to initialize Upstash Rate Limiter", error);
    upstashRateLimiter = null;
  }
}

// ============================================
// Rate Limiting Options
// ============================================

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the window
   * @default 60
   */
  limit?: number;

  /**
   * Time window for rate limiting
   * Format: number + unit (s = seconds, m = minutes, h = hours, d = days)
   * Examples: '1m', '60s', '1h', '1d'
   * @default '1m'
   */
  window?: string;

  /**
   * Custom identifier (overrides IP-based identification)
   */
  identifier?: string;

  /**
   * Skip rate limiting for this request
   * @default false
   */
  skip?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  error?: NextResponse;
  remaining?: number;
  reset?: number;
}

// ============================================
// Main Rate Limit Function
// ============================================

/**
 * Rate limit a request based on IP address or custom identifier
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { limit = 60, window = "1m", identifier: customIdentifier, skip = false } = options;

  // Skip rate limiting if requested
  if (skip) {
    return { success: true };
  }

  try {
    // Get identifier (IP address or custom)
    const identifier =
      customIdentifier ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    // Use Upstash in production if configured, otherwise in-memory
    if (hasUpstashConfig && upstashRateLimiter && isProduction) {
      // Upstash rate limiting
      const result = await upstashRateLimiter.limit(identifier);

      if (!result.success) {
        apiLogger.warn("Rate limit exceeded", {
          identifier,
          limit,
          window,
          remaining: result.remaining,
          reset: result.reset,
        });

        return {
          success: false,
          error: NextResponse.json(
            {
              error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Too many requests. Please try again later.",
                retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
              },
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": result.remaining.toString(),
                "X-RateLimit-Reset": result.reset.toString(),
                "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
              },
            }
          ),
        };
      }

      return {
        success: true,
        remaining: result.remaining,
        reset: result.reset,
      };
    } else {
      // In-memory rate limiting
      const windowMs = parseWindow(window);
      const result = await inMemoryRateLimit(identifier, limit, windowMs);

      if (!result.success) {
        apiLogger.warn("Rate limit exceeded (in-memory)", {
          identifier,
          limit,
          window,
          remaining: result.remaining,
          reset: result.reset,
        });

        return {
          success: false,
          error: NextResponse.json(
            {
              error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Too many requests. Please try again later.",
                retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
              },
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": result.remaining.toString(),
                "X-RateLimit-Reset": result.reset.toString(),
                "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
              },
            }
          ),
        };
      }

      return {
        success: true,
        remaining: result.remaining,
        reset: result.reset,
      };
    }
  } catch (error) {
    // On error, allow the request (fail open)
    apiLogger.error("Rate limiting error", error, {
      action: "rateLimit",
    });

    return { success: true };
  }
}

// ============================================
// Preset Rate Limits
// ============================================

/**
 * Preset rate limits for common API endpoints
 */
export const RateLimitPresets = {
  /** Chat API: 60 requests/minute */
  chat: { limit: 60, window: "1m" },

  /** Image Generation: 30 requests/minute */
  imageGeneration: { limit: 30, window: "1m" },

  /** Video Generation: 10 requests/minute */
  videoGeneration: { limit: 10, window: "1m" },

  /** Slides Generation: 20 requests/minute */
  slidesGeneration: { limit: 20, window: "1m" },

  /** Auth endpoints: 10 requests/minute */
  auth: { limit: 10, window: "1m" },

  /** Library/CRUD operations: 100 requests/minute */
  library: { limit: 100, window: "1m" },

  /** Public endpoints: 120 requests/minute */
  public: { limit: 120, window: "1m" },

  /** Strict limit: 5 requests/minute */
  strict: { limit: 5, window: "1m" },
};

/**
 * Convenience wrapper for common rate limit presets
 */
export async function rateLimitWithPreset(
  request: NextRequest,
  preset: keyof typeof RateLimitPresets,
  identifier?: string
): Promise<RateLimitResult> {
  return rateLimit(request, { ...RateLimitPresets[preset], identifier });
}
