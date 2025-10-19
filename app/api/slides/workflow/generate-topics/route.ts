/**
 * API Route: Generate Slide Topics
 *
 * Generates 10 slide topics based on user prompt using OpenAI.
 * Emits topics via WebSocket when ready.
 *
 * @route POST /api/slides/workflow/generate-topics
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, format, theme } = await request.json();

    // Validate
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Generating topics for user:', user.id);
    console.log('Prompt:', prompt);
    console.log('Format:', format, 'Theme:', theme);

    // Generate topics using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional presentation expert. Generate exactly 10 slide topics for a presentation.

Rules:
- Return ONLY a JSON array of exactly 10 strings
- Each string is a concise slide topic (max 60 characters)
- Topics should be logical and well-structured
- Start with introduction, end with conclusion
- Cover key aspects of the topic comprehensively

Example format:
["Introduction to Topic", "Background & History", "Key Concepts", ..., "Conclusion & Next Steps"]`
        },
        {
          role: 'user',
          content: `Create 10 slide topics for a presentation about: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '[]';

    // Parse topics from response
    let topics: string[];
    try {
      topics = JSON.parse(responseText);

      // Validate that we got exactly 10 topics
      if (!Array.isArray(topics) || topics.length !== 10) {
        throw new Error('Invalid topics format');
      }
    } catch (parseError) {
      console.error('Failed to parse topics:', parseError);

      // Fallback to generic topics
      topics = [
        '1. Introduction',
        '2. Background',
        '3. Key Concepts',
        '4. Main Features',
        '5. Use Cases',
        '6. Benefits',
        '7. Challenges',
        '8. Best Practices',
        '9. Future Outlook',
        '10. Conclusion',
      ];
    }

    console.log('Generated topics:', topics);

    // Emit via WebSocket
    try {
      const { emitTopicsGenerated } = await import('@/lib/socket/server');
      emitTopicsGenerated(user.id, { topics, messageId: `msg-${Date.now()}-topics` });
      console.log('✅ Topics emitted via WebSocket');
    } catch (wsError) {
      console.error('WebSocket error (non-fatal):', wsError);
      // Continue anyway - topics will still be returned in response
    }

    return NextResponse.json({
      success: true,
      data: { topics }
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
