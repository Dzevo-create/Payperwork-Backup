/**
 * Performance Monitor Tests
 *
 * Comprehensive test suite for the Performance Monitoring system.
 * Tests metric recording, statistical analysis, and monitoring features.
 */

import { PerformanceMonitor, withMonitoring } from '@/lib/performance/monitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('Basic Metric Recording', () => {
    it('should record a successful operation', () => {
      const startTime = monitor.startTimer();
      monitor.recordMetric('test-operation', startTime, true);

      const metrics = monitor.getMetrics('test-operation');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]?.operation).toBe('test-operation');
      expect(metrics[0]?.success).toBe(true);
      expect(metrics[0]?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should record a failed operation', () => {
      const startTime = monitor.startTimer();
      monitor.recordMetric('test-operation', startTime, false, { error: 'Test error' });

      const metrics = monitor.getMetrics('test-operation');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]?.success).toBe(false);
      expect(metrics[0]?.metadata?.error).toBe('Test error');
    });

    it('should record multiple operations', () => {
      for (let i = 0; i < 5; i++) {
        const startTime = monitor.startTimer();
        monitor.recordMetric('test-operation', startTime, true);
      }

      const metrics = monitor.getMetrics('test-operation');
      expect(metrics).toHaveLength(5);
    });

    it('should record different operation types', () => {
      const ops = ['image-generation', 'prompt-generation', 'database-query'];

      ops.forEach(op => {
        const startTime = monitor.startTimer();
        monitor.recordMetric(op, startTime, true);
      });

      expect(monitor.getMetrics('image-generation')).toHaveLength(1);
      expect(monitor.getMetrics('prompt-generation')).toHaveLength(1);
      expect(monitor.getMetrics('database-query')).toHaveLength(1);
    });

    it('should track metadata', () => {
      const startTime = monitor.startTimer();
      monitor.recordMetric('test-operation', startTime, true, {
        userId: 123,
        type: 'test',
        size: 'large'
      });

      const metrics = monitor.getMetrics('test-operation');
      expect(metrics[0]?.metadata).toEqual({
        userId: 123,
        type: 'test',
        size: 'large'
      });
    });
  });

  describe('Timer Functionality', () => {
    it('should return a valid start time', () => {
      const startTime = monitor.startTimer();
      expect(typeof startTime).toBe('number');
      expect(startTime).toBeGreaterThan(0);
    });

    it('should measure elapsed time correctly', async () => {
      const startTime = monitor.startTimer();
      await new Promise(resolve => setTimeout(resolve, 50));
      monitor.recordMetric('test', startTime, true);

      const metrics = monitor.getMetrics('test');
      expect(metrics[0]?.duration).toBeGreaterThanOrEqual(45); // Allow for slight timing variance
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Record 10 operations with varying durations
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now() - (100 + i * 10);
        monitor.recordMetric('test-operation', startTime, i < 8, { iteration: i });
      }
    });

    it('should calculate basic statistics', () => {
      const stats = monitor.getStats('test-operation');

      expect(stats).toBeTruthy();
      expect(stats!.count).toBe(10);
      expect(stats!.successRate).toBe(80); // 8 out of 10 succeeded
      expect(stats!.avgDuration).toBeGreaterThan(0);
      expect(stats!.minDuration).toBeLessThanOrEqual(stats!.maxDuration);
    });

    it('should calculate percentiles', () => {
      const stats = monitor.getStats('test-operation');

      expect(stats).toBeTruthy();
      expect(stats!.p50Duration).toBeGreaterThan(0);
      expect(stats!.p95Duration).toBeGreaterThan(0);
      expect(stats!.p99Duration).toBeGreaterThan(0);
      expect(stats!.p95Duration).toBeGreaterThanOrEqual(stats!.p50Duration);
    });

    it('should include recent metrics', () => {
      const stats = monitor.getStats('test-operation', 5);

      expect(stats).toBeTruthy();
      expect(stats!.recentMetrics).toHaveLength(5);
    });

    it('should return null for non-existent operation', () => {
      const stats = monitor.getStats('nonexistent');
      expect(stats).toBeNull();
    });
  });

  describe('All Stats', () => {
    beforeEach(() => {
      ['op1', 'op2', 'op3'].forEach(op => {
        const startTime = monitor.startTimer();
        monitor.recordMetric(op, startTime, true);
      });
    });

    it('should return stats for all operations', () => {
      const allStats = monitor.getAllStats();

      expect(allStats.size).toBe(3);
      expect(allStats.has('op1')).toBe(true);
      expect(allStats.has('op2')).toBe(true);
      expect(allStats.has('op3')).toBe(true);
    });

    it('should provide valid stats for each operation', () => {
      const allStats = monitor.getAllStats();

      allStats.forEach((stats) => {
        expect(stats.count).toBeGreaterThan(0);
        expect(stats.avgDuration).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Slow Operations', () => {
    it('should identify slow operations', () => {
      monitor.setSlowOperationThreshold(100);

      // Fast operation
      const fast = performance.now() - 50;
      monitor.recordMetric('fast-op', fast, true);

      // Slow operation
      const slow = performance.now() - 200;
      monitor.recordMetric('slow-op', slow, true);

      const slowOps = monitor.getSlowOperations();

      expect(slowOps).toHaveLength(1);
      expect(slowOps[0]?.operation).toBe('slow-op');
      expect(slowOps[0]?.duration).toBeGreaterThanOrEqual(100);
    });

    it('should limit slow operations results', () => {
      monitor.setSlowOperationThreshold(10);

      // Record 30 slow operations
      for (let i = 0; i < 30; i++) {
        const startTime = performance.now() - 100;
        monitor.recordMetric(`slow-op-${i}`, startTime, true);
      }

      const slowOps = monitor.getSlowOperations(10);
      expect(slowOps).toHaveLength(10);
    });

    it('should sort slow operations by duration', () => {
      monitor.setSlowOperationThreshold(10);

      const durations = [100, 200, 150, 250, 120];
      durations.forEach((duration, i) => {
        const startTime = performance.now() - duration;
        monitor.recordMetric(`op-${i}`, startTime, true);
      });

      const slowOps = monitor.getSlowOperations();

      // Should be sorted in descending order
      for (let i = 1; i < slowOps.length; i++) {
        expect(slowOps[i - 1]?.duration).toBeGreaterThanOrEqual(slowOps[i]?.duration ?? 0);
      }
    });
  });

  describe('Failed Operations', () => {
    it('should track failed operations', () => {
      const startTime = monitor.startTimer();
      monitor.recordMetric('test', startTime, false, { error: 'Test failure' });

      const failed = monitor.getFailedOperations();

      expect(failed).toHaveLength(1);
      expect(failed[0]?.success).toBe(false);
      expect(failed[0]?.metadata?.error).toBe('Test failure');
    });

    it('should limit failed operations results', () => {
      for (let i = 0; i < 30; i++) {
        const startTime = monitor.startTimer();
        monitor.recordMetric('test', startTime, false);
      }

      const failed = monitor.getFailedOperations(10);
      expect(failed).toHaveLength(10);
    });

    it('should sort failed operations by timestamp', () => {
      for (let i = 0; i < 5; i++) {
        const startTime = monitor.startTimer();
        monitor.recordMetric('test', startTime, false);
      }

      const failed = monitor.getFailedOperations();

      // Should be sorted in descending order (most recent first)
      for (let i = 1; i < failed.length; i++) {
        expect(failed[i - 1]?.timestamp).toBeGreaterThanOrEqual(failed[i]?.timestamp ?? 0);
      }
    });
  });

  describe('Summary', () => {
    beforeEach(() => {
      // Record varied operations
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now() - (i < 5 ? 50 : 150); // 5 fast, 5 slow
        monitor.recordMetric(`op-${i % 3}`, startTime, i < 8, { iteration: i });
      }
    });

    it('should provide overall summary', () => {
      const summary = monitor.getSummary();

      expect(summary.totalOperations).toBe(10);
      expect(summary.uniqueOperations).toBeGreaterThan(0);
      expect(summary.overallSuccessRate).toBe(80);
      expect(summary.failedOperationCount).toBe(2);
    });

    it('should include top operations', () => {
      const summary = monitor.getSummary();

      expect(summary.topOperations).toBeTruthy();
      expect(Array.isArray(summary.topOperations)).toBe(true);
      expect(summary.topOperations.length).toBeGreaterThan(0);
    });

    it('should sort top operations by count', () => {
      const summary = monitor.getSummary();

      for (let i = 1; i < summary.topOperations.length; i++) {
        expect(summary.topOperations[i - 1]?.count ?? 0).toBeGreaterThanOrEqual(
          summary.topOperations[i]?.count ?? 0
        );
      }
    });

    it('should calculate average duration for top operations', () => {
      const summary = monitor.getSummary();

      summary.topOperations.forEach(op => {
        expect(op.avgDuration).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Metric Management', () => {
    it('should clear all metrics', () => {
      const startTime = monitor.startTimer();
      monitor.recordMetric('test', startTime, true);

      expect(monitor.size()).toBe(1);

      monitor.clear();

      expect(monitor.size()).toBe(0);
      expect(monitor.getMetrics('test')).toHaveLength(0);
    });

    it('should return current size', () => {
      expect(monitor.size()).toBe(0);

      for (let i = 0; i < 5; i++) {
        const startTime = monitor.startTimer();
        monitor.recordMetric('test', startTime, true);
      }

      expect(monitor.size()).toBe(5);
    });

    it('should limit stored metrics', () => {
      // Record more than max metrics (default 1000)
      for (let i = 0; i < 1100; i++) {
        const startTime = monitor.startTimer();
        monitor.recordMetric('test', startTime, true);
      }

      expect(monitor.size()).toBeLessThanOrEqual(1000);
    });
  });

  describe('Configuration', () => {
    it('should update slow operation threshold', () => {
      monitor.setSlowOperationThreshold(500);

      const startTime = performance.now() - 200;
      monitor.recordMetric('test', startTime, true);

      const slowOps = monitor.getSlowOperations();
      expect(slowOps).toHaveLength(0); // 200ms < 500ms threshold
    });
  });

  describe('Filter by Operation', () => {
    beforeEach(() => {
      ['op1', 'op2', 'op3'].forEach(op => {
        for (let i = 0; i < 3; i++) {
          const startTime = monitor.startTimer();
          monitor.recordMetric(op, startTime, true);
        }
      });
    });

    it('should filter metrics by operation', () => {
      const op1Metrics = monitor.getMetrics('op1');
      const op2Metrics = monitor.getMetrics('op2');

      expect(op1Metrics).toHaveLength(3);
      expect(op2Metrics).toHaveLength(3);
      expect(op1Metrics.every(m => m.operation === 'op1')).toBe(true);
    });

    it('should return all metrics when no filter provided', () => {
      const allMetrics = monitor.getMetrics();
      expect(allMetrics).toHaveLength(9); // 3 ops × 3 metrics each
    });
  });
});

describe('withMonitoring wrapper', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Access the global monitor instance
    const { perfMonitor } = require('@/lib/performance/monitor');
    monitor = perfMonitor;
    monitor.clear();
  });

  it('should monitor successful async operations', async () => {
    const testFn = async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return 'success';
    };

    const result = await withMonitoring('test-operation', testFn);

    expect(result).toBe('success');

    const metrics = monitor.getMetrics('test-operation');
    expect(metrics).toHaveLength(1);
    expect(metrics[0]?.success).toBe(true);
    expect(metrics[0]?.duration).toBeGreaterThanOrEqual(50);
  });

  it('should monitor failed async operations', async () => {
    const testFn = async () => {
      throw new Error('Test error');
    };

    await expect(withMonitoring('test-operation', testFn)).rejects.toThrow('Test error');

    const metrics = monitor.getMetrics('test-operation');
    expect(metrics).toHaveLength(1);
    expect(metrics[0]?.success).toBe(false);
    expect(metrics[0]?.metadata?.error).toBe('Test error');
  });

  it('should include custom metadata', async () => {
    const testFn = async () => 'success';

    await withMonitoring('test-operation', testFn, { userId: 123 });

    const metrics = monitor.getMetrics('test-operation');
    expect(metrics[0]?.metadata?.userId).toBe(123);
  });
});
