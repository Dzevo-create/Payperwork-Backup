/**
 * Centralized Video Generation Configuration
 * All constants, timeouts, and limits in one place
 */

export const VIDEO_CONFIG = {
  // Polling Configuration
  polling: {
    intervalMs: 2000, // Check status every 2 seconds (optimized for faster status updates)
    maxAttempts: 300, // 10 minutes max (300 * 2s = 600s)
  },

  // Timeout Configuration
  timeouts: {
    apiCallMs: 30000, // 30 seconds for API calls
    jwtCacheMs: 1500000, // 25 minutes (30min - 5min buffer)
  },

  // Queue Configuration
  queue: {
    completedVisibilityMs: 30000, // Show completed videos for 30 seconds
    toastDurationMs: 5000, // Toast notification duration
    maxConcurrentRequests: 5, // Max parallel status checks
  },

  // Input Validation
  validation: {
    prompt: {
      minLength: 3,
      maxLength: 500,
    },
    image: {
      maxSizeMB: 10,
      allowedFormats: ['png', 'jpg', 'jpeg', 'webp'] as const,
    },
    requestBodySizeMB: 10,
  },

  // API URLs (can be overridden by env vars)
  api: {
    klingUrl: process.env.KLING_API_URL || "https://api-singapore.klingai.com",
  },
} as const;

/**
 * Provider-Specific Constraints
 */
export const PROVIDER_CONSTRAINTS = {
  kling: {
    durations: [5, 10] as const,
    aspectRatios: ["16:9", "9:16", "1:1"] as const,
    modes: ["std", "pro"] as const,
    cfgScale: { min: 0, max: 1 },
    defaults: {
      duration: "5",
      aspectRatio: "16:9",
      mode: "std",
      cfgScale: 0.5,
    },
  },
  fal: {
    durations: [4, 8, 12] as const,
    aspectRatios: ["16:9", "9:16", "auto"] as const,
    resolutions: ["720p", "auto"] as const,
    defaults: {
      duration: "4",
      aspectRatio: "16:9",
      resolution: "720p",
    },
  },
} as const;

/**
 * Retry Configuration
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000, // Start with 1 second
  maxDelayMs: 10000, // Cap at 10 seconds
  backoffMultiplier: 2, // Exponential: 1s, 2s, 4s, 8s
} as const;

/**
 * Environment Variables (validated)
 */
export const ENV = {
  kling: {
    apiUrl: process.env.KLING_API_URL || VIDEO_CONFIG.api.klingUrl,
    accessKey: process.env.KLING_ACCESS_KEY,
    secretKey: process.env.KLING_SECRET_KEY,
  },
  fal: {
    apiKey: process.env.FAL_KEY,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

/**
 * Helper to check if environment is properly configured
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!ENV.kling.accessKey) missing.push('KLING_ACCESS_KEY');
  if (!ENV.kling.secretKey) missing.push('KLING_SECRET_KEY');
  if (!ENV.fal.apiKey) missing.push('FAL_KEY');

  return {
    valid: missing.length === 0,
    missing,
  };
}
