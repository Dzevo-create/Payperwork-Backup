// ============================================
// Slides Workflow - Save Endpoint (Phase 2)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { slidesLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * POST /api/slides/workflow/save
 *
 * Saves the final presentation after generation is complete
 *
 * Request Body:
 * {
 *   presentationId: string;
 *   userId: string;
 *   slides: Slide[];
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   presentationId: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    slidesLogger.info('Saving slides workflow presentation');

    // Parse request body
    const body = await req.json();
    const { presentationId, userId, slides } = body;

    // Validation
    if (!presentationId || typeof presentationId !== 'string') {
      return NextResponse.json(
        { error: 'Presentation ID is required and must be a string' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required and must be a string' },
        { status: 400 }
      );
    }

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Slides array is required' },
        { status: 400 }
      );
    }

    slidesLogger.debug('Request validated', {
      presentationId,
      userId,
      slidesCount: slides.length,
    });

    // ============================================
    // Step 1: Verify Presentation Ownership
    // ============================================

    const { data: presentation, error: fetchError } = await supabaseAdmin
      .from('presentations')
      .select('id, user_id, status')
      .eq('id', presentationId)
      .single();

    if (fetchError || !presentation) {
      slidesLogger.error('Presentation not found', fetchError);
      return NextResponse.json(
        { error: 'Presentation not found' },
        { status: 404 }
      );
    }

    if (presentation.user_id !== userId) {
      slidesLogger.warn('Unauthorized save attempt', {
        presentationId,
        userId,
        ownerId: presentation.user_id,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ============================================
    // Step 2: Delete Existing Slides
    // ============================================

    slidesLogger.debug('Deleting existing slides');

    const { error: deleteError } = await supabaseAdmin
      .from('slides')
      .delete()
      .eq('presentation_id', presentationId);

    if (deleteError) {
      slidesLogger.error('Failed to delete existing slides', deleteError);
      return NextResponse.json(
        { error: 'Failed to save slides' },
        { status: 500 }
      );
    }

    // ============================================
    // Step 3: Insert New Slides
    // ============================================

    slidesLogger.debug('Inserting new slides');

    const slidesToInsert = slides.map((slide: any, index: number) => ({
      id: slide.id,
      presentation_id: presentationId,
      title: slide.title,
      content: slide.content,
      layout: slide.layout || 'content',
      speaker_notes: slide.speaker_notes || null,
      position: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseAdmin
      .from('slides')
      .insert(slidesToInsert);

    if (insertError) {
      slidesLogger.error('Failed to insert slides', insertError);
      return NextResponse.json(
        { error: 'Failed to save slides' },
        { status: 500 }
      );
    }

    // ============================================
    // Step 4: Update Presentation Status
    // ============================================

    slidesLogger.debug('Updating presentation status to completed');

    const { error: updateError } = await supabaseAdmin
      .from('presentations')
      .update({
        status: 'completed',
        slides_count: slides.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', presentationId);

    if (updateError) {
      slidesLogger.error('Failed to update presentation status', updateError);
      return NextResponse.json(
        { error: 'Failed to update presentation' },
        { status: 500 }
      );
    }

    slidesLogger.info('Presentation saved successfully', {
      presentationId,
      slidesCount: slides.length,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        presentationId,
        slidesCount: slides.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return handleApiError(error, 'slides/workflow/save');
  }
}
