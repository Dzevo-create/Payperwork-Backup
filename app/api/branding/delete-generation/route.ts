import { NextRequest, NextResponse } from "next/server";
import { deleteGeneration } from "@/lib/supabase-branding";
import { apiLogger } from '@/lib/logger';

/**
 * Handler for deleting a branding generation
 */
async function handleDelete(req: NextRequest) {
  try {
    const body = await req.json();
    // Support both 'generationId' and 'id' for compatibility
    const generationId = body.generationId || body.id;
    const userId = body.userId;

    if (!generationId) {
      apiLogger.error('[Delete Branding API] Missing ID in request:', body);
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      apiLogger.error('[Delete Branding API] Missing userId in request:', body);
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    apiLogger.info('[Delete Branding API] Deleting generation:', generationId);

    // Delete generation from database using branding database functions
    const success = await deleteGeneration(userId, generationId);

    if (!success) {
      apiLogger.error('[Delete Branding API] Failed to delete generation:', generationId);
      return NextResponse.json(
        { error: "Failed to delete generation" },
        { status: 500 }
      );
    }

    apiLogger.info('[Delete Branding API] Successfully deleted:', generationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('[Delete Branding API] Unexpected error:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || "Failed to delete generation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/branding/delete-generation
 * Deletes a branding generation from the database
 */
export async function DELETE(req: NextRequest) {
  return handleDelete(req);
}

/**
 * POST /api/branding/delete-generation
 * Alternative method for deleting (for compatibility)
 */
export async function POST(req: NextRequest) {
  return handleDelete(req);
}
