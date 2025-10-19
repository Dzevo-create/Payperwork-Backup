// ============================================
// Slides Workflow - Generate Endpoint (Phase 2)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getManusClient } from '@/lib/api/slides/manus-client';
import {
  emitGenerationStatusUpdate,
  emitThinkingStepUpdate,
} from '@/lib/socket/server';
import { slidesLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * POST /api/slides/workflow/generate
 *
 * Starts a new presentation generation workflow
 *
 * Request Body:
 * {
 *   prompt: string;
 *   userId: string;
 *   title?: string;
 *   format?: string;
 *   theme?: string;
 * }
 *
 * Response:
 * {
 *   presentationId: string;
 *   status: "thinking" | "generating";
 * }
 */
export async function POST(req: NextRequest) {
  try {
    slidesLogger.info('Starting slides workflow generation');

    // Parse request body
    const body = await req.json();
    const { prompt, userId, title, format = '16:9', theme = 'default' } = body;

    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required and must be a string' },
        { status: 400 }
      );
    }

    if (prompt.length < 10) {
      return NextResponse.json(
        { error: 'Prompt must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: 'Prompt must be less than 1000 characters' },
        { status: 400 }
      );
    }

    slidesLogger.debug('Request validated', {
      userId,
      promptLength: prompt.length,
      format,
      theme,
    });

    // ============================================
    // Step 1: Create Presentation in Database
    // ============================================

    const presentationTitle = title || `Presentation - ${new Date().toLocaleDateString()}`;

    slidesLogger.debug('Creating presentation in database');

    const { data: presentation, error: dbError } = await supabaseAdmin
      .from('presentations')
      .insert({
        user_id: userId,
        title: presentationTitle,
        format,
        theme,
        status: 'generating',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError || !presentation) {
      slidesLogger.error('Failed to create presentation in database', dbError);
      return NextResponse.json(
        { error: 'Failed to create presentation' },
        { status: 500 }
      );
    }

    const presentationId = presentation.id;

    slidesLogger.info('Presentation created in database', {
      presentationId,
      title: presentationTitle,
    });

    // ============================================
    // Step 2: Update Generation Status to "thinking"
    // ============================================

    emitGenerationStatusUpdate(userId, presentationId, 'thinking');

    slidesLogger.debug('Emitted status update: thinking');

    // ============================================
    // Step 3: Emit First Thinking Step
    // ============================================

    const firstThinkingStep = {
      id: 'step-1',
      title: 'Analyzing your request',
      status: 'running' as const,
      description: 'Understanding the presentation requirements',
      actions: [
        {
          id: 'action-1',
          type: 'analyzing_content' as const,
          text: 'Analyzing presentation requirements...',
          timestamp: new Date().toISOString(),
        },
      ],
      startedAt: new Date().toISOString(),
    };

    emitThinkingStepUpdate(userId, presentationId, firstThinkingStep);

    slidesLogger.debug('Emitted first thinking step');

    // ============================================
    // Step 4: Start Manus Task (Async)
    // ============================================

    try {
      const manusClient = getManusClient();

      slidesLogger.debug('Creating Manus task');

      const taskId = await manusClient.createSlidesTask(prompt, presentationId);

      slidesLogger.info('Manus task created', { taskId, presentationId });

      // Update presentation with task ID
      await supabaseAdmin
        .from('presentations')
        .update({
          manus_task_id: taskId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', presentationId);

      slidesLogger.debug('Updated presentation with Manus task ID');

      // Update thinking step to completed
      const completedStep = {
        ...firstThinkingStep,
        status: 'completed' as const,
        result: 'Request analyzed successfully',
        completedAt: new Date().toISOString(),
      };

      emitThinkingStepUpdate(userId, presentationId, completedStep);

      // Emit second thinking step (AI is now working)
      const secondStep = {
        id: 'step-2',
        title: 'Generating presentation',
        status: 'running' as const,
        description: 'AI is creating your slides',
        actions: [
          {
            id: 'action-2',
            type: 'generating_slides' as const,
            text: 'Generating slide content and structure...',
            timestamp: new Date().toISOString(),
          },
        ],
        startedAt: new Date().toISOString(),
      };

      emitThinkingStepUpdate(userId, presentationId, secondStep);

      // Update status to "generating"
      emitGenerationStatusUpdate(userId, presentationId, 'generating');

      slidesLogger.info('Generation workflow started successfully', {
        presentationId,
        taskId,
      });

      // Return success response
      return NextResponse.json(
        {
          presentationId,
          status: 'generating',
          message: 'Presentation generation started',
        },
        { status: 200 }
      );
    } catch (manusError: any) {
      slidesLogger.error('Manus task creation failed', manusError);

      // Update presentation status to error
      await supabaseAdmin
        .from('presentations')
        .update({
          status: 'error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', presentationId);

      // Emit error to client
      emitGenerationStatusUpdate(userId, presentationId, 'error');

      return NextResponse.json(
        {
          error: 'Failed to start AI generation',
          details: manusError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return handleApiError(error, 'slides/workflow/generate');
  }
}
