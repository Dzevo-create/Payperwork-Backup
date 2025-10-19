/**
 * Claude API Service for Slides Generation
 *
 * Replaces Manus API with direct Claude API integration.
 * Provides topics generation and slides generation with streaming.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Safe Socket.IO imports (optional - won't crash if not available)
let emitThinkingMessage: Function | undefined;
let emitTopicsGenerated: Function | undefined;
let emitSlidePreviewUpdate: Function | undefined;
let emitGenerationCompleted: Function | undefined;
let emitGenerationError: Function | undefined;

try {
  const socketServer = require('@/lib/socket/server');
  emitThinkingMessage = socketServer.emitThinkingMessage;
  emitTopicsGenerated = socketServer.emitTopicsGenerated;
  emitSlidePreviewUpdate = socketServer.emitSlidePreviewUpdate;
  emitGenerationCompleted = socketServer.emitGenerationCompleted;
  emitGenerationError = socketServer.emitGenerationError;
} catch (error) {
  console.warn('Socket.IO server functions not available (this is OK for development)');
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Initialize Supabase client (admin)
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

export interface GenerateTopicsOptions {
  prompt: string;
  userId: string;
  format?: string;
  theme?: string;
}

export interface GenerateSlidesOptions {
  prompt: string;
  topics: Array<{
    order: number;
    title: string;
    description: string;
  }>;
  userId: string;
  presentationId: string;
  format?: string;
  theme?: string;
}

/**
 * Generate AI acknowledgment message using Claude
 * Returns a friendly, contextual response based on user prompt
 */
export async function generateAcknowledgment(prompt: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 100,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `Du bist ein freundlicher AI-Assistent. Der User möchte eine Präsentation erstellen mit folgendem Thema:

"${prompt}"

Schreibe eine kurze, freundliche Bestätigung (1 Satz), dass du die Anfrage verstanden hast und jetzt die Präsentation vorbereitest. Sei natürlich und professionell.

Beispiele:
- "Perfekt! Ich erstelle dir eine professionelle Präsentation über [Thema]."
- "Verstanden! Ich recherchiere die wichtigsten Aspekte zu [Thema] und bereite dir die Folien vor."
- "Alles klar! Ich stelle dir eine informative Präsentation zu [Thema] zusammen."

Antworte NUR mit der Bestätigung, ohne zusätzliche Erklärungen.`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      return textContent.text.trim();
    }

    return 'Okay, ich erstelle dir einen Vorschlag für die Präsentation.';
  } catch (error) {
    console.error('Error generating acknowledgment:', error);
    return 'Okay, ich erstelle dir einen Vorschlag für die Präsentation.';
  }
}

/**
 * Generate 10 slide topics using Claude API
 */
export async function generateTopics(options: GenerateTopicsOptions) {
  const { prompt, userId, format = '16:9', theme = 'default' } = options;

  try {
    console.log('📝 Generating topics with Claude for user:', userId);
    console.log('Prompt:', prompt);

    // Step 1: Emit thinking step
    emitThinkingMessage?.(userId, {
      content: 'Analysiere dein Thema und plane die Präsentationsstruktur...',
      messageId: `thinking-topics-${Date.now()}`,
    });

    // Step 2: Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: `Du bist ein Präsentations-Experte. Erstelle genau 10 Folienthemen für eine Präsentation über: "${prompt}"

Ausgabe NUR ein JSON-Array mit diesem exakten Format:
[
  {
    "order": 1,
    "title": "Einleitung",
    "description": "Kurze Übersicht über das Thema"
  },
  {
    "order": 2,
    "title": "...",
    "description": "..."
  },
  ...
]

Regeln:
- Genau 10 Themen
- Erstes Thema muss "Einleitung" oder "Introduction" sein
- Letztes Thema muss "Fazit", "Zusammenfassung" oder "Conclusion" sein
- Themen müssen logisch und gut strukturiert sein
- Ausgabe NUR das JSON-Array, kein anderer Text
- Alle Titel und Beschreibungen auf Deutsch`
      }],
    });

    // Step 3: Parse response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Invalid response from Claude');
    }

    const topicsText = content.text.trim();
    console.log('Raw Claude response:', topicsText);

    // Try to extract JSON if there's extra text
    let topics;
    try {
      topics = JSON.parse(topicsText);
    } catch (parseError) {
      // Try to find JSON array in the text
      const jsonMatch = topicsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        topics = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse topics from Claude response');
      }
    }

    // Validate topics
    if (!Array.isArray(topics) || topics.length !== 10) {
      throw new Error(`Expected 10 topics, got ${Array.isArray(topics) ? topics.length : 0}`);
    }

    console.log('✅ Generated', topics.length, 'topics');

    // Step 4: Emit topics via WebSocket
    emitTopicsGenerated?.(userId, {
      topics,
      messageId: `topics-${Date.now()}`,
    });

    return topics;

  } catch (error) {
    console.error('Error generating topics:', error);
    emitGenerationError?.(userId, '', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Generate slides using Claude API with streaming
 */
export async function generateSlides(options: GenerateSlidesOptions) {
  const {
    prompt,
    topics,
    userId,
    presentationId,
    format = '16:9',
    theme = 'default',
  } = options;

  try {
    console.log('📝 Generating slides with Claude for user:', userId);
    console.log('Presentation ID:', presentationId);
    console.log('Topics:', topics.length);

    // Step 1: Emit thinking step
    emitThinkingMessage?.(userId, {
      content: 'Erstelle detaillierte Inhalte für jede Folie...',
      messageId: `thinking-slides-${Date.now()}`,
    });

    // Step 2: Call Claude API with streaming
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: `Du bist ein Präsentations-Experte. Erstelle eine vollständige Präsentation über: "${prompt}"

Verwende diese Themen:
${JSON.stringify(topics, null, 2)}

Für jedes Thema, erstelle eine Folie mit:
- Titel
- Inhalt (Stichpunkte oder Absätze)
- Layout (title_only, title_content, two_column, image_text)

Ausgabeformat:
Für jede Folie, gib aus:
[SLIDE_START]
{
  "order": 1,
  "title": "...",
  "content": "...",
  "layout": "title_content"
}
[SLIDE_END]

Regeln:
- Erstelle genau ${topics.length} Folien
- Verwende die Themen in der Reihenfolge
- Inhalt sollte informativ und ansprechend sein
- Verwende passende Layouts
- Ausgabe eine Folie nach der anderen mit [SLIDE_START] und [SLIDE_END] Markern
- Alle Inhalte auf Deutsch`
      }],
    });

    let currentSlide = '';
    let slideCount = 0;
    const slides: any[] = [];

    // Step 3: Process stream
    stream.on('text', (text, snapshot) => {
      currentSlide += text;

      // Check if slide is complete
      if (currentSlide.includes('[SLIDE_END]')) {
        const slideJson = currentSlide
          .replace('[SLIDE_START]', '')
          .replace('[SLIDE_END]', '')
          .trim();

        try {
          const slide = JSON.parse(slideJson);
          slideCount++;
          slides.push(slide);

          console.log(`✅ Generated slide ${slideCount}/${topics.length}: ${slide.title}`);

          // Emit slide preview via WebSocket
          emitSlidePreviewUpdate?.(userId, presentationId, slide);

          currentSlide = '';
        } catch (error) {
          console.error('Error parsing slide JSON:', error);
          console.error('Slide JSON:', slideJson);
        }
      }
    });

    // Wait for stream to finish
    await stream.finalMessage();

    console.log('✅ Slides generation completed. Generated', slideCount, 'slides');

    // Step 4: Save slides to database
    if (slides.length > 0) {
      const slidesData = slides.map((slide, index) => ({
        presentation_id: presentationId,
        order_index: slide.order || index + 1,
        title: slide.title,
        content: slide.content,
        layout: slide.layout || 'title_content',
      }));

      const { error: slidesError } = await supabaseAdmin
        .from('slides')
        .insert(slidesData);

      if (slidesError) {
        console.error('Error saving slides to database:', slidesError);
        // Don't throw - slides were generated successfully, just log the error
      } else {
        console.log('✅ Saved', slides.length, 'slides to database');
      }

      // Update presentation status and slide_count
      const { error: updateError } = await supabaseAdmin
        .from('presentations')
        .update({
          status: 'ready',
          slide_count: slideCount,
        })
        .eq('id', presentationId);

      if (updateError) {
        console.error('Error updating presentation status:', updateError);
      } else {
        console.log('✅ Updated presentation status to ready');
      }
    }

    // Step 5: Emit completion
    emitGenerationCompleted?.(userId, presentationId, slideCount);

    return slides;

  } catch (error) {
    console.error('Error generating slides:', error);
    emitGenerationError?.(
      userId,
      presentationId,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}
