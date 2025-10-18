import { NextRequest, NextResponse } from "next/server";
import { getRecentGenerations } from "@/lib/supabase-style-transfer";
import { apiLogger } from '@/lib/logger';

/**
 * API Route to get recent style-transfer generations
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
  } catch (error) {
    apiLogger.error('[GetGenerations API] Error:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || "Failed to fetch generations" },
      { status: 500 }
    );
  }
}
