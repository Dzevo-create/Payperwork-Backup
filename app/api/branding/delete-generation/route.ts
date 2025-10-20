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
    let generationId = body.generationId || body.id;
    const userId = body.userId;

    // Defensive: Log raw values for debugging
    apiLogger.info('[Delete Branding API] Raw request:', {
      bodyKeys: Object.keys(body),
      generationIdType: typeof generationId,
      generationIdValue: generationId,
      isArray: Array.isArray(generationId),
      userId,
    });

    if (!generationId) {
      apiLogger.error('[Delete Branding API] Missing ID in request:', body);
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    // Defensive: Ensure generationId is a proper string
    // Handle case where ID might be passed as an array or array-like object
    if (Array.isArray(generationId)) {
      apiLogger.warn('[Delete Branding API] ID received as array, converting to string:', generationId);
      generationId = generationId.join('');
    } else if (typeof generationId === 'object' && generationId !== null) {
      // Handle array-like objects (with numeric keys)
      apiLogger.warn('[Delete Branding API] ID received as object, converting to string:', generationId);
      const keys = Object.keys(generationId).sort((a, b) => Number(a) - Number(b));
      generationId = keys.map(key => generationId[key]).join('');
    } else if (typeof generationId !== 'string') {
      // Convert any other type to string
      apiLogger.warn('[Delete Branding API] ID not a string, converting:', {
        type: typeof generationId,
        value: generationId,
      });
      generationId = String(generationId);
    }

    if (!userId) {
      apiLogger.error('[Delete Branding API] Missing userId in request:', body);
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    apiLogger.info('[Delete Branding API] Deleting generation:', {
      generationId,
      type: typeof generationId,
      length: generationId.length,
    });

    // Delete generation from database using branding database functions
    const success = await deleteGeneration(userId, generationId);

    if (!success) {
      apiLogger.error('[Delete Branding API] Failed to delete generation:', {
        generationId,
        userId,
        type: typeof generationId,
        length: generationId.length,
      });
      return NextResponse.json(
        { error: "Failed to delete generation" },
        { status: 500 }
      );
    }

    apiLogger.info('[Delete Branding API] Successfully deleted:', {
      generationId,
      userId,
    });
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
