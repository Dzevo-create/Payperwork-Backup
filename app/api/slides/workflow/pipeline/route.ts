/**
 * API Route: Complete Presentation Pipeline
 *
 * Unified endpoint for generating complete presentations using the refactored
 * modular pipeline. Supports research, topic generation, content generation,
 * and quality checks.
 *
 * @route POST /api/slides/workflow/pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { PresentationPipeline } from '@/lib/api/slides/agents/pipeline';
import type { PresentationPipelineInput } from '@/lib/api/slides/agents/pipeline';
import { createClient } from '@supabase/supabase-js';
import {
  emitThinkingMessage,
  emitTopicsGenerated,
  emitSlidePreviewUpdate,
  emitGenerationCompleted,
  emitGenerationError,
} from '@/lib/socket/server';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      userId,
      format = '16:9',
      theme = 'default',
      slideCount = 10,
      enableResearch = false,
      researchDepth = 'medium',
    } = body;

    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting presentation pipeline for user:', userId);
    console.log('Prompt:', prompt);
    console.log('Settings:', { format, theme, slideCount, enableResearch, researchDepth });

    // Step 1: Create presentation in DB
    const { data: presentation, error: createError } = await supabaseAdmin
      .from('presentations')
      .insert({
        user_id: userId,
        title: prompt.substring(0, 100),
        prompt,
        format,
        theme,
        status: 'generating',
      })
      .select()
      .single();

    if (createError || !presentation) {
      console.error('Error creating presentation:', createError);
      throw new Error('Failed to create presentation in database');
    }

    const presentationId = presentation.id;
    console.log('✅ Created presentation:', presentationId);

    // Step 2: Initialize pipeline with progress callbacks
    const pipeline = new PresentationPipeline((event) => {
      const { type, data } = event;

      // Optional: Try to emit WebSocket events, but don't fail if they don't work
      try {
        if (type === 'agent:progress' && data.phase) {
          const phase = data.phase as string;

          // Just log progress - WebSocket events are optional
          console.log(`[Pipeline Progress] ${phase}:`, data);

          // Try to emit if functions are available
          if (typeof emitThinkingMessage === 'function') {
            if (phase === 'pipeline:started') {
              emitThinkingMessage(userId, {
                content: 'Pipeline gestartet: Analysiere dein Thema...',
                messageId: `pipeline-start-${Date.now()}`,
              });
            } else if (phase === 'research' && data.status === 'completed') {
              emitThinkingMessage(userId, {
                content: `Research abgeschlossen: ${data.sourceCount} Quellen gefunden, ${data.findingCount} wichtige Erkenntnisse`,
                messageId: `research-complete-${Date.now()}`,
              });
            } else if (phase === 'topic_generation' && data.status === 'completed') {
              emitThinkingMessage(userId, {
                content: `${data.topicCount} Themen generiert`,
                messageId: `topics-complete-${Date.now()}`,
              });
            } else if (phase === 'content_generation' && data.status === 'in_progress') {
              const progress = data.progress || 0;
              emitThinkingMessage(userId, {
                content: `Erstelle Folien: ${data.slideNumber}/${data.totalSlides} (${Math.round(progress)}%)`,
                messageId: `slides-progress-${data.slideNumber}`,
              });
            } else if (phase === 'pre_production' && data.status === 'completed') {
              emitThinkingMessage(userId, {
                content: `Qualitätsprüfung: ${data.qualityScore}/100 (${data.qualityLevel})`,
                messageId: `quality-check-${Date.now()}`,
              });
            }
          }
        }
      } catch (error) {
        // WebSocket events failed, but that's OK - just log and continue
        console.warn('[Pipeline] WebSocket emit failed (non-critical):', error);
      }
    });

    // Step 3: Prepare pipeline input
    const pipelineInput: PresentationPipelineInput = {
      topic: prompt,
      slideCount,
      format,
      theme,
      enableResearch,
      researchDepth: researchDepth as 'quick' | 'medium' | 'deep',
    };

    // Step 4: Execute pipeline
    const result = await pipeline.execute(pipelineInput, {
      userId,
      presentationId,
    });

    console.log('✅ Pipeline completed successfully');
    console.log('Topics:', result.topics.length);
    console.log('Slides:', result.slides.length);
    console.log('Quality Score:', result.metadata.qualityScore);
    console.log('Total Time:', result.metadata.totalTime, 'ms');

    // Step 5: Emit topics via WebSocket (optional)
    try {
      if (typeof emitTopicsGenerated === 'function') {
        emitTopicsGenerated(userId, {
          topics: result.topics.map((t) => ({
            order: t.order,
            title: t.title,
            description: t.description,
          })),
          messageId: `topics-${presentationId}`,
        });
      }
    } catch (error) {
      console.warn('[Pipeline] emitTopicsGenerated failed (non-critical):', error);
    }

    // Step 6: Save slides to database
    const slidesData = result.slides.map((slide, index) => ({
      presentation_id: presentationId,
      order_index: index + 1,
      title: slide.title,
      content: slide.content,
      layout: 'title_content',
      notes: slide.notes || null,
    }));

    const { error: slidesError } = await supabaseAdmin
      .from('slides')
      .insert(slidesData);

    if (slidesError) {
      console.error('Error saving slides:', slidesError);
      // Continue anyway - we have the data
    } else {
      console.log('✅ Saved', slidesData.length, 'slides to database');
    }

    // Step 7: Update presentation with topics and metadata
    const { error: updateError } = await supabaseAdmin
      .from('presentations')
      .update({
        topics: result.topics,
        status: 'ready',
        slide_count: result.slides.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', presentationId);

    if (updateError) {
      console.error('Error updating presentation:', updateError);
    }

    // Step 8: Emit completion (optional)
    try {
      if (typeof emitGenerationCompleted === 'function') {
        emitGenerationCompleted(userId, presentationId, result.slides.length);
      }
    } catch (error) {
      console.warn('[Pipeline] emitGenerationCompleted failed (non-critical):', error);
    }

    // Step 9: Return response
    return NextResponse.json({
      success: true,
      presentationId,
      topics: result.topics,
      slideCount: result.slides.length,
      qualityScore: result.metadata.qualityScore,
      metadata: {
        totalTime: result.metadata.totalTime,
        phaseTimes: result.metadata.phaseTimes,
        hasResearch: !!result.research,
      },
    });

  } catch (error) {
    console.error('Pipeline error:', error);

    // Try to get userId from body for error emission
    try {
      const body = await request.json();
      if (body.userId && typeof emitGenerationError === 'function') {
        emitGenerationError(
          body.userId,
          '',
          error instanceof Error ? error.message : 'Pipeline error'
        );
      }
    } catch {}

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
