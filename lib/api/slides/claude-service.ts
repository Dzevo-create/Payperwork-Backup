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
    if (!content || content.type !== 'text') {
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
 * Valid layout types for slides (from database schema)
 */
const VALID_LAYOUTS = ['title_slide', 'content', 'two_column', 'image', 'quote'] as const;
type SlideLayout = typeof VALID_LAYOUTS[number];

/**
 * Maps Claude's suggested layouts to valid database layouts
 */
function normalizeLayout(layout: string | undefined): SlideLayout {
  if (!layout) return 'content';

  const normalized = layout.toLowerCase().trim();

  // Direct matches
  if (VALID_LAYOUTS.includes(normalized as SlideLayout)) {
    return normalized as SlideLayout;
  }

  // Map common variations to valid layouts
  const layoutMap: Record<string, SlideLayout> = {
    'title_only': 'title_slide',
    'title_content': 'content',
    'title_and_content': 'content',
    'image_text': 'image',
    'two_columns': 'two_column',
    'two_col': 'two_column',
  };

  // Check if there's a mapping
  if (layoutMap[normalized]) {
    return layoutMap[normalized];
  }

  // Check for partial matches (e.g., "title_" -> "title_slide")
  if (normalized.startsWith('title_') || normalized.startsWith('title')) {
    return 'title_slide';
  }
  if (normalized.includes('two') || normalized.includes('column')) {
    return 'two_column';
  }
  if (normalized.includes('image')) {
    return 'image';
  }
  if (normalized.includes('quote')) {
    return 'quote';
  }

  // Default fallback
  console.warn(`Unknown layout "${layout}", defaulting to "content"`);
  return 'content';
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
- Layout (title_slide, content, two_column, image, quote)

Ausgabeformat:
Für jede Folie, gib aus:
[SLIDE_START]
{
  "order": 1,
  "title": "...",
  "content": "...",
  "layout": "content"
}
[SLIDE_END]

Regeln:
- Erstelle genau ${topics.length} Folien
- Verwende die Themen in der Reihenfolge
- Inhalt sollte informativ und ansprechend sein
- Verwende NUR diese Layouts: title_slide, content, two_column, image, quote
- Ausgabe eine Folie nach der anderen mit [SLIDE_START] und [SLIDE_END] Markern
- Alle Inhalte auf Deutsch
- WICHTIG: Gib NUR das JSON aus, keine zusätzlichen Kommentare oder Text`
      }],
    });

    let currentSlide = '';
    let slideCount = 0;
    const slides: any[] = [];

    // Step 3: Process stream
    stream.on('text', (text) => {
      currentSlide += text;

      // Check if slide is complete
      if (currentSlide.includes('[SLIDE_END]')) {
        // Log the full slide content BEFORE processing
        console.log('========================================');
        console.log('FULL SLIDE CONTENT FROM STREAM:');
        console.log(currentSlide);
        console.log('========================================');

        // Extract content between markers
        const startMarker = '[SLIDE_START]';
        const endMarker = '[SLIDE_END]';

        const startIndex = currentSlide.indexOf(startMarker);
        const endIndex = currentSlide.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1) {
          console.error('Error: Could not find SLIDE_START or SLIDE_END markers');
          console.error('Start marker found:', startIndex !== -1);
          console.error('End marker found:', endIndex !== -1);
          currentSlide = '';
          return;
        }

        // Extract content BETWEEN the markers (not including the markers themselves)
        const rawContent = currentSlide
          .substring(startIndex + startMarker.length, endIndex)
          .trim();

        // CRITICAL: Preserve any content AFTER the [SLIDE_END] marker for next slide
        const remainingContent = currentSlide.substring(endIndex + endMarker.length);

        console.log('EXTRACTED RAW CONTENT:');
        console.log(rawContent);
        console.log('First 50 chars:', rawContent.substring(0, 50));
        console.log('Last 50 chars:', rawContent.substring(Math.max(0, rawContent.length - 50)));
        console.log('Remaining content for next slide:', remainingContent.substring(0, 100));

        try {
          // Extract only the JSON object (from first { to matching closing })
          let firstBrace = rawContent.indexOf('{');

          // CRITICAL FIX: If no opening brace found, the stream might have been cut off
          if (firstBrace === -1) {
            console.error('CRITICAL ERROR: No opening brace found in rawContent');
            console.error('This suggests the stream splitting cut off the JSON start');
            console.error('Attempting to prepend { to fix...');

            // Try prepending the opening brace as a fallback
            const fixedContent = '{' + rawContent;
            firstBrace = 0;

            // Try to parse with the fix
            try {
              const testParse = JSON.parse(fixedContent);
              console.log('SUCCESS: Prepending { fixed the JSON');
              // Continue with fixed content
              const slide = testParse;
              slideCount++;

              // Normalize layout
              slide.layout = normalizeLayout(slide.layout);

              slides.push(slide);
              console.log(`✅ Generated slide ${slideCount}/${topics.length}: ${slide.title} (layout: ${slide.layout})`);

              // Emit slide preview via WebSocket with normalized layout
              emitSlidePreviewUpdate?.(userId, presentationId, {
                id: `slide-temp-${slideCount}`,
                order_index: slide.order || slideCount,
                title: slide.title,
                content: slide.content,
                layout: slide.layout,
              });

              // Reset currentSlide to remaining content (not empty string)
              currentSlide = remainingContent;
              return;
            } catch (fixError) {
              throw new Error('No JSON object found in slide content. Prepending { did not fix it.');
            }
          }

          // Find the matching closing brace
          let braceCount = 0;
          let lastBrace = -1;
          for (let i = firstBrace; i < rawContent.length; i++) {
            if (rawContent[i] === '{') {
              braceCount++;
            } else if (rawContent[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastBrace = i;
                break;
              }
            }
          }

          if (lastBrace === -1) {
            throw new Error('No matching closing brace found in slide content. The JSON might be incomplete.');
          }

          // Extract the clean JSON string
          const slideJson = rawContent.substring(firstBrace, lastBrace + 1);
          console.log('EXTRACTED JSON:');
          console.log(slideJson);

          const slide = JSON.parse(slideJson);
          slideCount++;

          // Normalize layout before saving
          const originalLayout = slide.layout;
          slide.layout = normalizeLayout(slide.layout);

          if (originalLayout !== slide.layout) {
            console.log(`Layout normalized: "${originalLayout}" -> "${slide.layout}"`);
          }

          slides.push(slide);

          console.log(`✅ Generated slide ${slideCount}/${topics.length}: ${slide.title} (layout: ${slide.layout})`);

          // Emit slide preview via WebSocket with normalized layout
          emitSlidePreviewUpdate?.(userId, presentationId, {
            id: `slide-temp-${slideCount}`,
            order_index: slide.order || slideCount,
            title: slide.title,
            content: slide.content,
            layout: slide.layout,
          });

          // Reset currentSlide to remaining content (not empty string)
          currentSlide = remainingContent;
        } catch (error) {
          console.error('========================================');
          console.error('ERROR PARSING SLIDE JSON');
          console.error('========================================');
          console.error('Error:', error);
          console.error('Raw content length:', rawContent.length);
          console.error('Raw content:', rawContent);
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
          console.error('========================================');

          // Reset currentSlide to remaining content to avoid losing next slide data
          currentSlide = remainingContent;
        }
      }
    });

    // Wait for stream to finish
    await stream.finalMessage();

    console.log('✅ Slides generation completed. Generated', slideCount, 'slides');

    // Step 4: Save slides to database
    if (slides.length > 0) {
      const slidesData = slides.map((slide, index) => {
        // Ensure layout is normalized (should already be from processing above)
        const layout = normalizeLayout(slide.layout);

        return {
          presentation_id: presentationId,
          order_index: slide.order || index + 1,
          title: slide.title,
          content: slide.content,
          layout: layout,
        };
      });

      console.log('Preparing to save slides to database:');
      slidesData.forEach((slide, index) => {
        console.log(`  Slide ${index + 1}: layout="${slide.layout}", title="${slide.title}"`);
      });

      const { error: slidesError } = await supabaseAdmin
        .from('slides')
        .insert(slidesData);

      if (slidesError) {
        console.error('========================================');
        console.error('ERROR SAVING SLIDES TO DATABASE');
        console.error('========================================');
        console.error('Supabase error:', slidesError);
        console.error('Error message:', slidesError.message);
        console.error('Error details:', slidesError.details);
        console.error('Error hint:', slidesError.hint);
        console.error('Failed slides data:', JSON.stringify(slidesData, null, 2));
        console.error('========================================');
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
