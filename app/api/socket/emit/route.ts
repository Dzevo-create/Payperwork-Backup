import { NextRequest, NextResponse } from "next/server";
import { getSocketServer } from "@/lib/socket/server";
import { apiLogger } from "@/lib/logger";

/**
 * POST /api/socket/emit
 *
 * Emit WebSocket events from API routes
 *
 * This endpoint allows serverless API routes to emit Socket.IO events
 * by providing an HTTP interface to the Socket.IO server.
 *
 * @route POST /api/socket/emit
 * @body { userId: string, event: string, data: any }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, event, data } = await request.json();

    if (!userId || !event || !data) {
      return NextResponse.json(
        { error: "Missing required fields: userId, event, data" },
        { status: 400 }
      );
    }

    // Get Socket.IO server instance
    const io = getSocketServer();

    if (!io) {
      console.warn("[Socket Emit] Socket.IO server not initialized");
      return NextResponse.json(
        { success: false, error: "Socket.IO server not initialized" },
        { status: 503 }
      );
    }

    // Emit event to user
    io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    apiLogger.info(`[Socket Emit] ✅ Emitted ${event} to user:${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Socket Emit] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
