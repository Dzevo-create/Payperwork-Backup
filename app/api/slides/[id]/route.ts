// ============================================
// API Route: Get, Update, Delete Presentation
// GET/PATCH/DELETE /api/slides/[id]
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type {
  GetPresentationResponse,
  UpdatePresentationRequest,
  UpdatePresentationResponse,
  DeletePresentationResponse,
} from "@/types/slides";

/**
 * GET /api/slides/[id]
 *
 * Get a single presentation with all its slides
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "presentation": {...},
 *     "slides": [...]
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Get presentation
    const { data: presentation, error: presentationError } = await supabase
      .from("presentations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (presentationError || !presentation) {
      return NextResponse.json(
        {
          success: false,
          error: "Presentation not found",
        },
        { status: 404 }
      );
    }

    // Get slides
    const { data: slides, error: slidesError } = await supabase
      .from("slides")
      .select("*")
      .eq("presentation_id", id)
      .order("order_index", { ascending: true });

    if (slidesError) {
      console.error("Error fetching slides:", slidesError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch slides",
        },
        { status: 500 }
      );
    }

    // Return response
    const response: GetPresentationResponse = {
      success: true,
      data: {
        presentation,
        slides: slides || [],
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in get presentation endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/slides/[id]
 *
 * Update a presentation
 *
 * Body:
 * {
 *   "title"?: string,
 *   "format"?: "16:9" | "4:3" | "A4",
 *   "theme"?: "default" | "red" | "rose" | "orange" | "green" | "blue" | "yellow" | "violet"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "presentation": {...}
 *   }
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Parse request body
    const body: UpdatePresentationRequest = await request.json();
    const { title, format, theme } = body;

    // Validate at least one field is provided
    if (!title && !format && !theme) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one field must be provided",
        },
        { status: 400 }
      );
    }

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

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (format !== undefined) updateData.format = format;
    if (theme !== undefined) updateData.theme = theme;

    // Update presentation
    const { data: presentation, error: updateError } = await supabase
      .from("presentations")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !presentation) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update presentation",
        },
        { status: 404 }
      );
    }

    // Return response
    const response: UpdatePresentationResponse = {
      success: true,
      data: {
        presentation,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in update presentation endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/slides/[id]
 *
 * Delete a presentation (and all its slides via CASCADE)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Presentation deleted successfully"
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Delete presentation (CASCADE will delete slides and manus_tasks)
    const { error: deleteError } = await supabase
      .from("presentations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting presentation:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete presentation",
        },
        { status: 404 }
      );
    }

    // Return response
    const response: DeletePresentationResponse = {
      success: true,
      message: "Presentation deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in delete presentation endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
