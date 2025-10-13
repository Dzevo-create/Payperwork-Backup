/**
 * Fetch with timeout support
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 30000ms = 30s)
 * @returns Promise with fetch response
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    // Merge abort signals if one already exists
    const signal = options.signal
      ? mergeAbortSignals(options.signal, controller.signal)
      : controller.signal;

    const response = await fetch(url, {
      ...options,
      signal,
    });

    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);

    // Check if it was a timeout
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Merge multiple abort signals into one
 */
function mergeAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }

    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  return controller.signal;
}

/**
 * Fetch with retry logic and timeout
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param timeout - Timeout per attempt in ms (default: 30000)
 * @param retryDelay - Delay between retries in ms (default: 1000)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  timeout: number = 30000,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);

      // Only retry on 5xx errors or network errors
      if (response.ok || response.status < 500) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      lastError = error;

      // Don't retry if manually aborted by user
      if (error.name === 'AbortError' && options.signal?.aborted) {
        throw error;
      }
    }

    // Don't delay after last attempt
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  throw lastError || new Error('Request failed after retries');
}
