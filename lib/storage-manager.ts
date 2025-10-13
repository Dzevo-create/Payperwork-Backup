/**
 * localStorage Quota Manager
 *
 * Prevents app crashes from QuotaExceededError
 * Implements automatic cleanup strategies
 */

import { apiLogger } from "./logger";

const STORAGE_KEY_PREFIX = "payperwork_";
const MAX_STORAGE_MB = 5; // Conservative limit (browsers typically allow 5-10MB)
const CLEANUP_THRESHOLD = 0.9; // Trigger cleanup at 90% capacity

/**
 * Estimate storage usage in bytes
 */
function estimateStorageSize(): number {
  let totalSize = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  return totalSize;
}

/**
 * Check if storage is near quota
 */
export function isStorageNearQuota(): boolean {
  const currentSize = estimateStorageSize();
  const maxSizeBytes = MAX_STORAGE_MB * 1024 * 1024;
  return currentSize / maxSizeBytes > CLEANUP_THRESHOLD;
}

/**
 * Get all keys with their sizes, sorted by age (oldest first)
 */
function getKeysWithSizes(): Array<{ key: string; size: number; timestamp: number }> {
  const keys: Array<{ key: string; size: number; timestamp: number }> = [];

  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith(STORAGE_KEY_PREFIX)) {
      const value = localStorage[key];
      const size = value.length + key.length;

      // Try to extract timestamp from value (if it's JSON with timestamp)
      let timestamp = 0;
      try {
        const parsed = JSON.parse(value);
        timestamp = parsed.timestamp || parsed.updatedAt || parsed.createdAt || 0;
      } catch {
        // Not JSON or no timestamp, use 0
      }

      keys.push({ key, size, timestamp });
    }
  }

  // Sort by timestamp (oldest first)
  return keys.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Remove oldest items until we're below threshold
 */
export function cleanupOldStorage(targetSizeMB: number = MAX_STORAGE_MB * 0.7): void {
  const keysWithSizes = getKeysWithSizes();
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  let currentSize = estimateStorageSize();

  let removedCount = 0;
  let removedSize = 0;

  for (const item of keysWithSizes) {
    if (currentSize <= targetSizeBytes) break;

    try {
      localStorage.removeItem(item.key);
      currentSize -= item.size;
      removedSize += item.size;
      removedCount++;

      apiLogger.info("Storage cleanup: removed item", {
        key: item.key,
        size: item.size,
      });
    } catch (error) {
      apiLogger.error("Failed to remove storage item during cleanup", error as Error, {
        key: item.key,
      });
    }
  }

  if (removedCount > 0) {
    apiLogger.warn("Storage cleanup completed", {
      removedCount,
      removedSizeMB: (removedSize / (1024 * 1024)).toFixed(2),
      remainingSizeMB: (currentSize / (1024 * 1024)).toFixed(2),
    });
  }
}

/**
 * Safe setItem with automatic quota management
 */
export function safeSetItem(key: string, value: string): boolean {
  const fullKey = key.startsWith(STORAGE_KEY_PREFIX) ? key : `${STORAGE_KEY_PREFIX}${key}`;

  try {
    // Check if we're near quota before writing
    if (isStorageNearQuota()) {
      apiLogger.warn("Storage near quota, triggering cleanup");
      cleanupOldStorage();
    }

    localStorage.setItem(fullKey, value);
    return true;
  } catch (error: any) {
    if (error.name === "QuotaExceededError") {
      apiLogger.error("QuotaExceededError: Attempting emergency cleanup", error);

      // Emergency cleanup: remove more aggressively
      cleanupOldStorage(MAX_STORAGE_MB * 0.5);

      // Retry once after cleanup
      try {
        localStorage.setItem(fullKey, value);
        return true;
      } catch (retryError) {
        apiLogger.error("Failed to store item even after cleanup", retryError as Error, {
          key: fullKey,
          valueSize: value.length,
        });
        return false;
      }
    } else {
      apiLogger.error("localStorage.setItem failed", error, { key: fullKey });
      return false;
    }
  }
}

/**
 * Safe getItem
 */
export function safeGetItem(key: string): string | null {
  const fullKey = key.startsWith(STORAGE_KEY_PREFIX) ? key : `${STORAGE_KEY_PREFIX}${key}`;

  try {
    return localStorage.getItem(fullKey);
  } catch (error) {
    apiLogger.error("localStorage.getItem failed", error as Error, { key: fullKey });
    return null;
  }
}

/**
 * Safe removeItem
 */
export function safeRemoveItem(key: string): boolean {
  const fullKey = key.startsWith(STORAGE_KEY_PREFIX) ? key : `${STORAGE_KEY_PREFIX}${key}`;

  try {
    localStorage.removeItem(fullKey);
    return true;
  } catch (error) {
    apiLogger.error("localStorage.removeItem failed", error as Error, { key: fullKey });
    return false;
  }
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  usedMB: number;
  maxMB: number;
  percentUsed: number;
  itemCount: number;
} {
  const usedBytes = estimateStorageSize();
  const maxBytes = MAX_STORAGE_MB * 1024 * 1024;
  const itemCount = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX)).length;

  return {
    usedMB: usedBytes / (1024 * 1024),
    maxMB: MAX_STORAGE_MB,
    percentUsed: (usedBytes / maxBytes) * 100,
    itemCount,
  };
}
