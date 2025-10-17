import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { apiLogger } from '@/lib/logger';

/**
 * Handler for deleting a sketch-to-render generation
 */
async function handleDelete(req: NextRequest) {
  try {
    const body = await req.json();
    // Support both 'generationId' and 'id' for compatibility
    const generationId = body.generationId || body.id;

    if (!generationId) {
      apiLogger.error('[Delete Generation API] Missing ID in request:', body);
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    apiLogger.info('[Delete Generation API] Deleting generation:', generationId);

    // Delete generation from database
    const { error } = await supabaseAdmin
      .from("sketch_to_render")
      .delete()
      .eq("id", generationId);

    if (error) {
      apiLogger.error('[Delete Generation API] Database error:', error);
      return NextResponse.json(
        { error: "Failed to delete generation" },
        { status: 500 }
      );
    }

    apiLogger.info('[Delete Generation API] Successfully deleted:', generationId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    apiLogger.error('[Delete Generation API] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to delete generation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sketch-to-render/delete-generation
 * Deletes a sketch-to-render generation from the database
 */
export async function DELETE(req: NextRequest) {
  return handleDelete(req);
}

/**
 * POST /api/sketch-to-render/delete-generation
 * Alternative method for deleting (for compatibility)
 */
export async function POST(req: NextRequest) {
  return handleDelete(req);
}
