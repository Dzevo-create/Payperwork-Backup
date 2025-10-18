/**
 * Performance Monitoring API
 *
 * Provides access to performance metrics and statistics for monitoring
 * application performance and identifying bottlenecks.
 *
 * Endpoints:
 * - GET /api/performance - Get performance summary and statistics
 * - GET /api/performance?operation=<name> - Get stats for specific operation
 * - DELETE /api/performance - Clear all metrics (admin only)
 *
 * @endpoint GET/DELETE /api/performance
 */

import { NextRequest, NextResponse } from "next/server";
import { perfMonitor } from "@/lib/performance/monitor";
import { apiLogger } from "@/lib/logger";

/**
 * GET /api/performance
 *
 * Retrieve performance metrics and statistics
 * Query params:
 * - operation: Optional operation name to filter by
 * - limit: Number of recent metrics to include (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const operation = searchParams.get('operation');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // If operation specified, return stats for that operation only
    if (operation) {
      const stats = perfMonitor.getStats(operation, limit);

      if (!stats) {
        return NextResponse.json(
          { error: `No metrics found for operation: ${operation}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        operation,
        stats,
        timestamp: new Date().toISOString()
      });
    }

    // Otherwise return overall summary and stats for all operations
    const summary = perfMonitor.getSummary();
    const allStats = perfMonitor.getAllStats();
    const slowOperations = perfMonitor.getSlowOperations(20);
    const failedOperations = perfMonitor.getFailedOperations(20);

    // Convert Map to Object for JSON serialization
    const statsObject: Record<string, unknown> = {};
    allStats.forEach((value, key) => {
      statsObject[key] = value;
    });

    return NextResponse.json({
      summary,
      operations: statsObject,
      slowOperations,
      failedOperations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    apiLogger.error("Performance API: Failed to retrieve metrics", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to retrieve performance metrics" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/performance
 *
 * Clear all performance metrics
 * Note: In production, this should be protected with admin authentication
 */
export async function DELETE() {
  try {
    const previousSize = perfMonitor.size();
    perfMonitor.clear();

    apiLogger.info("Performance API: Metrics cleared", {
      previousMetricCount: previousSize
    });

    return NextResponse.json({
      success: true,
      message: `Cleared ${previousSize} metrics`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    apiLogger.error("Performance API: Failed to clear metrics", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to clear performance metrics" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance/config
 *
 * Update performance monitoring configuration
 * Body: { slowOperationThreshold: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slowOperationThreshold } = body;

    if (typeof slowOperationThreshold === 'number' && slowOperationThreshold > 0) {
      perfMonitor.setSlowOperationThreshold(slowOperationThreshold);

      apiLogger.info("Performance API: Configuration updated", {
        slowOperationThreshold
      });

      return NextResponse.json({
        success: true,
        config: {
          slowOperationThreshold
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: "Invalid configuration parameters" },
      { status: 400 }
    );

  } catch (error) {
    apiLogger.error("Performance API: Failed to update configuration", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to update performance configuration" },
      { status: 500 }
    );
  }
}
