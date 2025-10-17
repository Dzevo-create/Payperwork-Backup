import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { apiLogger } from '@/lib/logger';

/**
 * DELETE /api/branding/delete-generation
 * Deletes a branding generation from the database
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { generationId } = body;

    if (!generationId) {
      return NextResponse.json(
        { error: "Generation ID is required" },
        { status: 400 }
      );
    }

    // Delete generation from database
    const { error } = await supabaseAdmin
      .from("sketch_to_render")
      .delete()
      .eq("id", generationId);

    if (error) {
      apiLogger.error('[Delete Generation API] Error:', error);
      return NextResponse.json(
        { error: "Failed to delete generation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    apiLogger.error('[Delete Generation API] Error:', error);
    return NextResponse.json(
      { error: error.message || "Failed to delete generation" },
      { status: 500 }
    );
  }
}
