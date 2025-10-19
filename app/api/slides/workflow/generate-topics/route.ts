/**
 * API Route: Generate Slide Topics
 *
 * Generates 10 slide topics based on user prompt using Claude API.
 * Topics will be delivered via WebSocket with real-time updates.
 *
 * @route POST /api/slides/workflow/generate-topics
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTopics } from '@/lib/api/slides/claude-service';

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

    console.log('📝 Generating topics for user:', userId);
    console.log('Prompt:', prompt);
    console.log('Format:', format, 'Theme:', theme);

    // Generate topics with Claude API
    const topics = await generateTopics({
      prompt,
      userId,
      format: format || '16:9',
      theme: theme || 'default',
    });

    return NextResponse.json({
      success: true,
      topics,
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
