/**
 * Generate Optimized Prompt Endpoint
 *
 * Takes structured input (topic, design, brand colors, audience, etc.)
 * and generates an optimized prompt for presentation generation.
 *
 * @author Payperwork Team
 * @date 2025-10-20
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic,
      designGuidelines,
      targetAudience,
      brandColors,
      additionalNotes,
      format,
      theme,
      files,
    } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
        { status: 400 }
      );
    }

    console.log('🪄 Generating optimized prompt for:', topic);

    // Build structured prompt for Claude
    const systemPrompt = `Du bist ein Experte für Präsentationserstellung. Deine Aufgabe ist es, aus strukturierten Eingaben einen optimierten, detaillierten Prompt zu erstellen, der für die automatische Generierung von professionellen Präsentationen verwendet wird.

Der generierte Prompt sollte:
1. Klar und präzise das Thema beschreiben
2. Design-Vorgaben und CI/Brand-Farben einbeziehen
3. Die Zielgruppe berücksichtigen
4. Format und Theme-Einstellungen integrieren
5. Alle zusätzlichen Hinweise sinnvoll einbauen
6. Eine klare Struktur für die Präsentation vorgeben

Der Prompt sollte so formuliert sein, dass ein AI-System daraus direkt Topics, Outline und Slides generieren kann.`;

    const userPrompt = `Erstelle einen optimierten Prompt für eine Präsentationsgenerierung basierend auf folgenden Informationen:

**Thema:**
${topic}

${targetAudience ? `**Zielgruppe:**\n${targetAudience}\n` : ''}
${designGuidelines ? `**Design-Vorgaben:**\n${designGuidelines}\n` : ''}
${brandColors ? `**Firmen-CI / Brand-Farben:**\n${brandColors}\n` : ''}
${additionalNotes ? `**Weitere Hinweise:**\n${additionalNotes}\n` : ''}

**Technische Einstellungen:**
- Format: ${format}
- Theme: ${theme}

${files && files.length > 0 ? `**Hochgeladene Dateien:**\n${files.map((f: any) => `- ${f.name} (${f.type})`).join('\n')}\n` : ''}

Generiere einen klaren, strukturierten Prompt (2-4 Sätze), der alle wichtigen Informationen enthält und direkt für die Präsentationserstellung verwendet werden kann.

**WICHTIG:**
- Integriere die Brand-Farben explizit in den Prompt (z.B. "Verwende die Farben [Farben] für das Design")
- Erwähne das Format (${format}) und das Theme (${theme})
- Sei konkret und spezifisch

Antworte NUR mit dem generierten Prompt, ohne zusätzliche Erklärungen oder Formatierung.`;

    let generatedPrompt: string;

    try {
      // Try Claude API first
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      generatedPrompt = textContent.text.trim();

      console.log('✅ Generated optimized prompt:', generatedPrompt);
    } catch (claudeError) {
      // Fallback: Build prompt from settings
      const errorMessage = claudeError instanceof Error ? claudeError.message : String(claudeError);
      const isQuotaError = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate_limit');

      console.warn('⚠️ Claude API failed, using intelligent fallback', {
        error: errorMessage,
        isQuotaError,
      });

      // Build intelligent fallback prompt
      const parts: string[] = [];
      parts.push(`Create a professional presentation about: ${topic}`);

      if (targetAudience) {
        parts.push(`Tailored for ${targetAudience} audience.`);
      }

      if (designGuidelines) {
        parts.push(`Design guidelines: ${designGuidelines}`);
      }

      if (brandColors) {
        parts.push(`Use brand colors: ${brandColors}`);
      }

      if (additionalNotes) {
        parts.push(additionalNotes);
      }

      parts.push(`Format: ${format}, Theme: ${theme}`);
      parts.push('Include engaging visuals, clear structure, and professional layout.');

      generatedPrompt = parts.join(' ');

      console.log('✅ Generated fallback prompt:', generatedPrompt);
    }

    return NextResponse.json({
      success: true,
      generatedPrompt,
    });
  } catch (error) {
    console.error('❌ Error generating optimized prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
