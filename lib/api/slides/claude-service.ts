/**
 * Claude API Service for Slides Generation
 *
 * Replaces Manus API with direct Claude API integration.
 * Provides topics generation and slides generation with streaming.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  emitThinkingMessage,
  emitTopicsGenerated,
  emitSlidePreviewUpdate,
  emitGenerationCompleted,
  emitGenerationError,
} from '@/lib/socket/server';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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
 * Generate 10 slide topics using Claude API
 */
export async function generateTopics(options: GenerateTopicsOptions) {
  const { prompt, userId, format = '16:9', theme = 'default' } = options;

  try {
    console.log('📝 Generating topics with Claude for user:', userId);
    console.log('Prompt:', prompt);

    // Step 1: Emit thinking step
    emitThinkingMessage(userId, {
      content: 'Analysiere dein Thema und plane die Präsentationsstruktur...',
      messageId: `thinking-topics-${Date.now()}`,
    });

    // Step 2: Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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
    emitTopicsGenerated(userId, {
      topics,
      messageId: `topics-${Date.now()}`,
    });

    return topics;

  } catch (error) {
    console.error('Error generating topics:', error);
    emitGenerationError(userId, '', error instanceof Error ? error.message : 'Unknown error');
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
    emitThinkingMessage(userId, {
      content: 'Erstelle detaillierte Inhalte für jede Folie...',
      messageId: `thinking-slides-${Date.now()}`,
    });

    // Step 2: Call Claude API with streaming
    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
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
          emitSlidePreviewUpdate(userId, presentationId, slide);

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

    // Step 4: Emit completion
    emitGenerationCompleted(userId, presentationId, slideCount);

    return slides;

  } catch (error) {
    console.error('Error generating slides:', error);
    emitGenerationError(
      userId,
      presentationId,
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}
