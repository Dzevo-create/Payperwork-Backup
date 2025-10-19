/**
 * API Route: Full Presentation Pipeline
 *
 * Executes the complete presentation generation pipeline:
 * 1. Research - Multi-source information gathering
 * 2. Topic Generation - Structured outline creation
 * 3. Content Generation - Detailed slide content
 * 4. Pre-Production - Quality checks and finalization
 *
 * @route POST /api/slides/workflow/pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { PresentationPipelineService } from '@/lib/api/slides/agents';
import type {
  PresentationPipelineInput,
  AgentServiceContext,
  AgentProgressEvent,
} from '@/lib/api/slides/agents';
import { createClient } from '@supabase/supabase-js';
import { emitThinkingMessage, emitTopicsGenerated, emitSlidePreviewUpdate, emitGenerationCompleted, emitGenerationError } from '@/lib/socket/server';

// Initialize Supabase client (admin)
const supabase = createClient(
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
      slideCount = 10,
      format = '16:9',
      theme = 'default',
      userId,
      enableResearch = true,
      researchDepth = 'medium',
      audience,
    } = body;

    // Validate
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
    console.log('Slide count:', slideCount);
    console.log('Research enabled:', enableResearch);

    // Step 1: Create presentation in DB
    const { data: presentation, error: createError } = await supabase
      .from('presentations')
      .insert({
        user_id: userId,
        title: prompt.substring(0, 100),
        prompt,
        format,
        theme,
        status: 'processing',
      })
      .select()
      .single();

    if (createError || !presentation) {
      console.error('Error creating presentation:', createError);
      throw new Error('Failed to create presentation in database');
    }

    console.log('✅ Created presentation:', presentation.id);

    // Step 2: Prepare pipeline input
    const pipelineInput: PresentationPipelineInput = {
      topic: prompt,
      slideCount,
      audience,
      format,
      theme,
      enableResearch,
      researchDepth: researchDepth as 'quick' | 'medium' | 'deep',
    };

    const context: AgentServiceContext = {
      userId,
      sessionId: `session-${Date.now()}`,
      presentationId: presentation.id,
    };

    // Step 3: Execute pipeline with progress callbacks
    const pipelineService = new PresentationPipelineService();

    const result = await pipelineService.execute(
      pipelineInput,
      context,
      (event: AgentProgressEvent) => {
        handleProgressEvent(event, userId, presentation.id);
      }
    );

    console.log('✅ Pipeline completed:', {
      presentationId: result.presentationId,
      slideCount: result.slides.length,
      topicCount: result.topics.length,
      totalTime: result.metadata.totalTime,
      qualityScore: result.metadata.qualityScore,
    });

    // Step 4: Save results to database
    await saveResultsToDatabase(presentation.id, result);

    // Step 5: Emit completion event
    emitGenerationCompleted(userId, presentation.id, result.slides.length);

    // Step 6: Return results
    return NextResponse.json({
      success: true,
      presentationId: presentation.id,
      topics: result.topics,
      slideCount: result.slides.length,
      metadata: result.metadata,
      research: enableResearch ? {
        summary: result.research?.summary,
        sourceCount: result.research?.sources.length,
        findingCount: result.research?.keyFindings.length,
      } : undefined,
    });

  } catch (error) {
    console.error('Error in presentation pipeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle progress events and emit to WebSocket
 */
function handleProgressEvent(
  event: AgentProgressEvent,
  userId: string,
  presentationId: string
) {
  console.log('📊 Progress:', event.type, event.data);

  switch (event.type) {
    case 'research:started':
      emitThinkingMessage(userId, {
        content: 'Recherchiere Informationen aus mehreren Quellen...',
        messageId: `research-${Date.now()}`,
      });
      break;

    case 'research:completed':
      emitThinkingMessage(userId, {
        content: `Research abgeschlossen: ${event.data.sourceCount} Quellen, ${event.data.findingCount} Erkenntnisse`,
        messageId: `research-done-${Date.now()}`,
      });
      break;

    case 'content:started':
      emitThinkingMessage(userId, {
        content: 'Generiere Folieninhalte...',
        messageId: `content-${Date.now()}`,
      });
      break;

    case 'agent:progress':
      if (event.data.phase === 'topic_generation' && event.data.status === 'completed') {
        // Topics generated
        emitThinkingMessage(userId, {
          content: `${event.data.topicCount} Themen erstellt`,
          messageId: `topics-${Date.now()}`,
        });
      } else if (event.data.phase === 'content_generation' && event.data.slideNumber) {
        // Slide progress
        emitThinkingMessage(userId, {
          content: `Folie ${event.data.slideNumber}/${event.data.totalSlides} erstellt`,
          messageId: `slide-${event.data.slideNumber}`,
        });
      } else if (event.data.phase === 'pre_production' && event.data.status === 'completed') {
        emitThinkingMessage(userId, {
          content: `Qualitätsprüfung abgeschlossen (Score: ${event.data.qualityScore}/100)`,
          messageId: `quality-${Date.now()}`,
        });
      }
      break;

    case 'agent:error':
      emitGenerationError(userId, presentationId, event.data.error);
      break;
  }
}

/**
 * Save pipeline results to database
 */
async function saveResultsToDatabase(
  presentationId: string,
  result: any
) {
  try {
    // Save topics
    const { error: topicsError } = await supabase
      .from('presentations')
      .update({
        topics: result.topics,
        status: 'topics_generated',
      })
      .eq('id', presentationId);

    if (topicsError) {
      console.error('Error saving topics:', topicsError);
    }

    // Save slides
    const slidesData = result.slides.map((slide: any, index: number) => ({
      presentation_id: presentationId,
      order_index: index + 1,
      title: slide.title,
      content: slide.content,
      layout: 'title_content',
      speaker_notes: slide.notes,
    }));

    const { error: slidesError } = await supabase
      .from('slides')
      .insert(slidesData);

    if (slidesError) {
      console.error('Error saving slides:', slidesError);
      throw slidesError;
    }

    // Save research data (if available)
    if (result.research) {
      const { error: researchError } = await supabase
        .from('presentations')
        .update({
          research_data: {
            summary: result.research.summary,
            keyFindings: result.research.keyFindings,
            sources: result.research.sources,
          },
        })
        .eq('id', presentationId);

      if (researchError) {
        console.error('Error saving research data:', researchError);
      }
    }

    // Update final status
    const { error: updateError } = await supabase
      .from('presentations')
      .update({
        status: 'ready',
        slide_count: result.slides.length,
        metadata: result.metadata,
      })
      .eq('id', presentationId);

    if (updateError) {
      console.error('Error updating presentation status:', updateError);
    }

    console.log('✅ Results saved to database');
  } catch (error) {
    console.error('Error saving results to database:', error);
    throw error;
  }
}

