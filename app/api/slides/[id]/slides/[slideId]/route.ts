// ============================================
// API Route: Update/Delete Individual Slides
// PATCH/DELETE /api/slides/[id]/slides/[slideId]
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type {
  UpdateSlideRequest,
  UpdateSlideResponse,
  DeleteSlideResponse,
} from "@/types/slides";

/**
 * PATCH /api/slides/[id]/slides/[slideId]
 *
 * Update a single slide
 *
 * Body:
 * {
 *   "title"?: string,
 *   "content"?: string,
 *   "layout"?: "title_slide" | "content" | "two_column" | "image" | "quote",
 *   "speaker_notes"?: string,
 *   "background_color"?: string,
 *   "background_image"?: string
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "slide": {...}
 *   }
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; slideId: string } }
) {
  try {
    const { id: presentationId, slideId } = params;

    // Parse request body
    const body: UpdateSlideRequest = await request.json();
    const {
      title,
      content,
      layout,
      speaker_notes,
      background_color,
      background_image,
    } = body;

    // Validate at least one field is provided
    if (
      !title &&
      !content &&
      !layout &&
      speaker_notes === undefined &&
      background_color === undefined &&
      background_image === undefined
    ) {
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

    // Verify presentation ownership
    const { data: presentation, error: presentationError } = await supabase
      .from("presentations")
      .select("id")
      .eq("id", presentationId)
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

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (layout !== undefined) updateData.layout = layout;
    if (speaker_notes !== undefined) updateData.speaker_notes = speaker_notes;
    if (background_color !== undefined)
      updateData.background_color = background_color;
    if (background_image !== undefined)
      updateData.background_image = background_image;

    // Update slide
    const { data: slide, error: updateError } = await supabase
      .from("slides")
      .update(updateData)
      .eq("id", slideId)
      .eq("presentation_id", presentationId)
      .select()
      .single();

    if (updateError || !slide) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update slide",
        },
        { status: 404 }
      );
    }

    // Return response
    const response: UpdateSlideResponse = {
      success: true,
      data: {
        slide,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in update slide endpoint:", error);
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
 * DELETE /api/slides/[id]/slides/[slideId]
 *
 * Delete a single slide
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Slide deleted successfully"
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; slideId: string } }
) {
  try {
    const { id: presentationId, slideId } = params;

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

    // Verify presentation ownership
    const { data: presentation, error: presentationError } = await supabase
      .from("presentations")
      .select("id")
      .eq("id", presentationId)
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

    // Get the slide to be deleted (to get order_index)
    const { data: slideToDelete, error: slideError } = await supabase
      .from("slides")
      .select("order_index")
      .eq("id", slideId)
      .eq("presentation_id", presentationId)
      .single();

    if (slideError || !slideToDelete) {
      return NextResponse.json(
        {
          success: false,
          error: "Slide not found",
        },
        { status: 404 }
      );
    }

    // Delete slide
    const { error: deleteError } = await supabase
      .from("slides")
      .delete()
      .eq("id", slideId)
      .eq("presentation_id", presentationId);

    if (deleteError) {
      console.error("Error deleting slide:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete slide",
        },
        { status: 500 }
      );
    }

    // Reorder remaining slides (decrement order_index for slides after deleted one)
    const { data: remainingSlides } = await supabase
      .from("slides")
      .select("id, order_index")
      .eq("presentation_id", presentationId)
      .gt("order_index", slideToDelete.order_index)
      .order("order_index", { ascending: true });

    if (remainingSlides && remainingSlides.length > 0) {
      // Update order indices
      for (const slide of remainingSlides) {
        await supabase
          .from("slides")
          .update({ order_index: slide.order_index - 1 })
          .eq("id", slide.id);
      }
    }

    // Return response
    const response: DeleteSlideResponse = {
      success: true,
      message: "Slide deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in delete slide endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
