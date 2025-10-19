// ============================================
// API Route: List Presentations
// GET /api/slides
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { GetPresentationsResponse } from "@/types/slides";

/**
 * GET /api/slides
 *
 * Get all presentations for the authenticated user
 *
 * Query params:
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 * - status: "generating" | "ready" | "error" (optional filter)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "presentations": [...]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status");

    // Build query
    let query = supabase
      .from("presentations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add status filter if provided
    if (status && ["generating", "ready", "error"].includes(status)) {
      query = query.eq("status", status);
    }

    // Execute query
    const { data: presentations, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch presentations",
        },
        { status: 500 }
      );
    }

    // Return response
    const response: GetPresentationsResponse = {
      success: true,
      data: {
        presentations: presentations || [],
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in list endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
