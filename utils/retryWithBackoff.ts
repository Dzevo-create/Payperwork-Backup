/**
 * Retry Utility with Exponential Backoff
 * Provides configurable retry logic for API calls that may fail intermittently
 */

import { logger } from '@/lib/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 4,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: Error & { status?: number }) => {
    // Default: Retry on network errors, timeouts, and 5xx errors
    if (error.name === 'AbortError') return false; // Don't retry user cancellations
    if (error.message?.includes('timeout')) return true;
    if (error.status && error.status >= 500) return true;
    if (error.message?.includes('network')) return true;
    return false;
  },
  onRetry: () => {}, // No-op by default
};

/**
 * Calculate exponential backoff delay with jitter
 * Jitter helps prevent thundering herd problem
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  const clampedDelay = Math.min(exponentialDelay, maxDelay);
  // Add jitter: randomize between 50% and 100% of calculated delay
  const jitter = clampedDelay * (0.5 + Math.random() * 0.5);
  return Math.floor(jitter);
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - Async function to retry
 * @param options - Retry configuration
 * @returns Promise that resolves with the operation result or rejects after all retries
 *
 * @example
 * ```ts
 * const result = await retryWithBackoff(
 *   async () => fetch('/api/generate-image'),
 *   {
 *     maxRetries: 4,
 *     initialDelay: 1000,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      const shouldRetry = config.shouldRetry(error, attempt);
      const isLastAttempt = attempt === config.maxRetries;

      if (!shouldRetry || isLastAttempt) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      // Notify about retry
      config.onRetry(error, attempt + 1, delay);

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Specific retry configuration for image generation
 * Handles Google Gemini API intermittent failures
 */
export const imageGenerationRetryConfig: RetryOptions = {
  maxRetries: 4, // User reported it works on 5th try (0-4 retries = 5 attempts)
  initialDelay: 2000, // 2 seconds initial delay
  maxDelay: 15000, // 15 seconds max delay
  backoffMultiplier: 2,
  shouldRetry: (error: Error & { status?: number }, _attempt: number) => {
    // Don't retry user cancellations
    if (error.name === 'AbortError') return false;

    // Don't retry validation errors (400)
    if (error.status === 400) {
      // EXCEPT for "No image data in response" - this is intermittent
      if (error.message?.includes('No image data')) return true;
      if (error.message?.includes('Image URL is invalid')) return true;
      return false;
    }

    // Don't retry rate limiting errors (429) - wait for cooldown
    if (error.status === 429) return false;

    // Retry all other errors (network, 500, etc.)
    return true;
  },
  onRetry: (error: Error & { status?: number }, attempt: number, delay: number) => {
    logger.info(`Image generation retry ${attempt}/4 after ${delay}ms`, {
      error: error.message,
      status: error.status,
      attempt,
      delay
    });
  },
};

/**
 * Fetch with retry for API calls
 * Wraps fetch with automatic retry logic
 */
export async function fetchWithRetryBackoff(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options);

    // Create error with status code for retry logic
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        status: number;
        response: Response;
      };
      error.status = response.status;
      error.response = response;
      throw error;
    }

    return response;
  }, retryOptions);
}
