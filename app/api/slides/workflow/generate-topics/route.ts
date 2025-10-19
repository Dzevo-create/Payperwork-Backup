/**
 * API Route: Generate Slide Topics
 *
 * Generates 10 slide topics based on user prompt using Manus API.
 * Topics will be delivered via webhook with real-time updates.
 *
 * @route POST /api/slides/workflow/generate-topics
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getManusClient } from '@/lib/api/slides/manus-client';
import { startPolling } from '@/lib/api/slides/polling-service';

export async function POST(request: NextRequest) {
  try {
    const { prompt, format, theme, userId } = await request.json();

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

    // Verify user exists (optional security check)
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error verifying user:', userError);
    }

    console.log('📝 Creating Manus topics task for user:', userId);
    console.log('Prompt:', prompt);
    console.log('Format:', format, 'Theme:', theme);

    // Create Manus task for topics generation
    const manusClient = getManusClient();
    const taskId = await manusClient.createTopicsTask(prompt, userId);

    console.log('✅ Manus task created:', taskId);

    // Store task ID in database
    await supabaseAdmin
      .from('manus_tasks')
      .insert({
        task_id: taskId,
        user_id: userId,
        task_type: 'generate_topics',
        status: 'running',
        metadata: { prompt, format, theme },
      });

    console.log('💾 Task stored in database');

    // Start polling for real-time updates (instead of relying on webhooks)
    startPolling({
      taskId,
      userId,
      taskType: 'topics',
      interval: 2000, // Poll every 2 seconds
    });
    console.log('🔄 Started polling for task updates');

    // Emit generation status via WebSocket
    try {
      const { emitGenerationStatus } = await import('@/lib/socket/server');
      emitGenerationStatus(userId, {
        status: 'thinking',
        message: 'Analysiere dein Thema...'
      });
      console.log('✅ Status emitted via WebSocket');
    } catch (wsError) {
      console.error('WebSocket error (non-fatal):', wsError);
    }

    // Return task ID immediately (topics will come via webhook)
    return NextResponse.json({
      success: true,
      data: { taskId }
    });

  } catch (error) {
    console.error('Error generating topics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
