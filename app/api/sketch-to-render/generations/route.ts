import { NextRequest, NextResponse } from "next/server";
import { getRecentGenerations } from "@/lib/supabase-sketch-to-render";
import { apiLogger } from '@/lib/logger';

/**
 * API Route to get recent sketch-to-render generations
 * Expects userId in query params (from client-side getUserId())
 */
export async function GET(req: NextRequest) {
  try {
    // Get userId and limit from query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId query parameter" },
        { status: 400 }
      );
    }

    // Fetch generations
    const generations = await getRecentGenerations(userId, limit);

    return NextResponse.json({
      success: true,
      generations,
    });
  } catch (error: any) {
    apiLogger.error('[GetGenerations API] Error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch generations" },
      { status: 500 }
    );
  }
}
