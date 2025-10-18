/**
 * Performance Monitoring System
 *
 * Tracks performance metrics for key operations throughout the application.
 * Records duration, success rate, and metadata for analysis and optimization.
 *
 * Features:
 * - Operation timing
 * - Success/failure tracking
 * - Statistical analysis (avg, min, max, p95)
 * - Slow operation detection
 * - Automatic metric retention management
 *
 * @example
 * const startTime = perfMonitor.startTimer('image-generation');
 * try {
 *   const result = await generateImage();
 *   perfMonitor.recordMetric('image-generation', startTime, true);
 *   return result;
 * } catch (error) {
 *   perfMonitor.recordMetric('image-generation', startTime, false);
 *   throw error;
 * }
 */

import { logger } from '@/lib/logger';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export interface PerformanceStats {
  count: number;
  successRate: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  recentMetrics: PerformanceMetric[];
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private slowOperationThreshold = 2000; // 2 seconds

  /**
   * Start a timer for an operation
   * @param operation - The operation name
   * @returns The start time in milliseconds
   */
  startTimer(operation: string): number {
    return performance.now();
  }

  /**
   * Record a metric for an operation
   * @param operation - The operation name
   * @param startTime - The start time from startTimer()
   * @param success - Whether the operation succeeded
   * @param metadata - Optional metadata about the operation
   */
  recordMetric(
    operation: string,
    startTime: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const duration = performance.now() - startTime;

    this.metrics.push({
      operation,
      duration,
      timestamp: Date.now(),
      success,
      metadata
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (duration > this.slowOperationThreshold) {
      logger.warn('Slow operation detected', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        success,
        metadata
      });
    }

    // Log failed operations
    if (!success) {
      logger.error('Operation failed', {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        metadata
      });
    }
  }

  /**
   * Get all metrics for a specific operation or all operations
   * @param operation - Optional operation name to filter by
   * @returns Array of performance metrics
   */
  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return this.metrics;
  }

  /**
   * Get statistical analysis for an operation
   * @param operation - The operation name
   * @param limit - Maximum number of recent metrics to include (default: 10)
   * @returns Performance statistics or null if no metrics found
   */
  getStats(operation: string, limit = 10): PerformanceStats | null {
    const opMetrics = this.getMetrics(operation);
    if (opMetrics.length === 0) return null;

    const durations = opMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successCount = opMetrics.filter(m => m.success).length;

    return {
      count: opMetrics.length,
      successRate: (successCount / opMetrics.length) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50Duration: this.percentile(durations, 0.5),
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99),
      recentMetrics: opMetrics.slice(-limit)
    };
  }

  /**
   * Get statistics for all operations
   * @returns Map of operation names to their statistics
   */
  getAllStats(): Map<string, PerformanceStats> {
    const operations = new Set(this.metrics.map(m => m.operation));
    const statsMap = new Map<string, PerformanceStats>();

    for (const operation of operations) {
      const stats = this.getStats(operation);
      if (stats) {
        statsMap.set(operation, stats);
      }
    }

    return statsMap;
  }

  /**
   * Calculate percentile from sorted array
   * @param sortedValues - Sorted array of values
   * @param percentile - Percentile to calculate (0-1)
   * @returns The percentile value
   */
  private percentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Get slow operations (above threshold)
   * @param limit - Maximum number of results (default: 20)
   * @returns Array of slow operations
   */
  getSlowOperations(limit = 20): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration > this.slowOperationThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get failed operations
   * @param limit - Maximum number of results (default: 20)
   * @returns Array of failed operations
   */
  getFailedOperations(limit = 20): PerformanceMetric[] {
    return this.metrics
      .filter(m => !m.success)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get the total number of metrics stored
   * @returns The number of metrics
   */
  size(): number {
    return this.metrics.length;
  }

  /**
   * Set the slow operation threshold
   * @param milliseconds - Threshold in milliseconds
   */
  setSlowOperationThreshold(milliseconds: number): void {
    this.slowOperationThreshold = milliseconds;
  }

  /**
   * Get summary of all operations
   * @returns Summary statistics
   */
  getSummary(): {
    totalOperations: number;
    uniqueOperations: number;
    overallSuccessRate: number;
    slowOperationCount: number;
    failedOperationCount: number;
    topOperations: Array<{ operation: string; count: number; avgDuration: number }>;
  } {
    const operations = new Map<string, { count: number; totalDuration: number }>();
    let successCount = 0;
    let slowCount = 0;
    let failedCount = 0;

    for (const metric of this.metrics) {
      if (metric.success) successCount++;
      if (metric.duration > this.slowOperationThreshold) slowCount++;
      if (!metric.success) failedCount++;

      const current = operations.get(metric.operation) || { count: 0, totalDuration: 0 };
      operations.set(metric.operation, {
        count: current.count + 1,
        totalDuration: current.totalDuration + metric.duration
      });
    }

    const topOperations = Array.from(operations.entries())
      .map(([operation, data]) => ({
        operation,
        count: data.count,
        avgDuration: data.totalDuration / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalOperations: this.metrics.length,
      uniqueOperations: operations.size,
      overallSuccessRate: this.metrics.length > 0 ? (successCount / this.metrics.length) * 100 : 0,
      slowOperationCount: slowCount,
      failedOperationCount: failedCount,
      topOperations
    };
  }
}

// Global singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Decorator for automatic performance monitoring
 * @param operation - The operation name
 * @returns Decorator function
 */
export function monitored(operation: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const startTime = perfMonitor.startTimer(operation);

      try {
        const result = await originalMethod.apply(this, args);
        perfMonitor.recordMetric(operation, startTime, true);
        return result;
      } catch (error) {
        perfMonitor.recordMetric(operation, startTime, false, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Wrapper function for automatic performance monitoring
 * @param operation - The operation name
 * @param fn - The function to monitor
 * @param metadata - Optional metadata
 * @returns The wrapped function
 */
export async function withMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = perfMonitor.startTimer(operation);

  try {
    const result = await fn();
    perfMonitor.recordMetric(operation, startTime, true, metadata);
    return result;
  } catch (error) {
    perfMonitor.recordMetric(operation, startTime, false, {
      ...metadata,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
