import { NextRequest, NextResponse } from "next/server";
import { deleteGeneration } from "@/lib/supabase-style-transfer";
import { apiLogger } from '@/lib/logger';

/**
 * Handler for deleting a style-transfer generation
 */
async function handleDelete(req: NextRequest) {
  try {
    const body = await req.json();
    // Support both 'generationId' and 'id' for compatibility
    const generationId = body.generationId || body.id;
    const userId = body.userId;

    if (!generationId) {
      apiLogger.error('[Delete Generation API] Missing ID in request:', body);
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      apiLogger.error('[Delete Generation API] Missing userId in request:', body);
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    apiLogger.info('[Delete Generation API] Deleting generation:', generationId);

    // Delete generation from database using style-transfer database functions
    const success = await deleteGeneration(userId, generationId);

    if (!success) {
      apiLogger.error('[Delete Generation API] Failed to delete generation:', generationId);
      return NextResponse.json(
        { error: "Failed to delete generation" },
        { status: 500 }
      );
    }

    apiLogger.info('[Delete Generation API] Successfully deleted:', generationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('[Delete Generation API] Unexpected error:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || "Failed to delete generation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/style-transfer/delete-generation
 * Deletes a style-transfer generation from the database
 */
export async function DELETE(req: NextRequest) {
  return handleDelete(req);
}

/**
 * POST /api/style-transfer/delete-generation
 * Alternative method for deleting (for compatibility)
 */
export async function POST(req: NextRequest) {
  return handleDelete(req);
}
