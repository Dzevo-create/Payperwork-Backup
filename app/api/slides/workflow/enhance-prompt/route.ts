import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, format, theme } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🔧 Enhancing prompt:', prompt);

    const systemPrompt = `Du bist ein Experte für Präsentationserstellung. Deine Aufgabe ist es, einfache Benutzer-Prompts in detaillierte, professionelle Prompts umzuwandeln.

Der verbesserte Prompt sollte:
1. Das Originalthema beibehalten
2. Format und Theme einbeziehen (${format}, ${theme})
3. Professionelle Struktur vorgeben
4. Relevante Design-Hinweise hinzufügen
5. CI/Brand-Farben analysieren und vorschlagen (basierend auf Thema/Firma)

WICHTIG: Antworte NUR mit dem verbesserten Prompt, keine Erklärungen.`;

    const userPrompt = `Verbessere diesen Präsentations-Prompt:

Original: "${prompt}"

Format: ${format}
Theme: ${theme}

Erstelle einen detaillierten, professionellen Prompt (2-3 Sätze) der:
- Das Thema klar definiert
- Format und Theme erwähnt
- CI/Firmen-Farben vorschlägt (falls erkennbar)
- Design-Vorgaben einbezieht

Beispiel:
Input: "Präsentation zu Tesla"
Output: "Erstelle eine professionelle Präsentation über Tesla Inc. mit Fokus auf Innovation, Elektromobilität und nachhaltige Energie. Verwende die Tesla-Markenfarben (Rot #E31937, Schwarz, Silber) für ein modernes, technologisches Design. Format: ${format}, Theme: ${theme}."`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 200,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    const enhancedPrompt = textContent.text.trim();

    console.log('✅ Enhanced prompt:', enhancedPrompt);

    return NextResponse.json({
      success: true,
      enhancedPrompt,
    });
  } catch (error) {
    console.error('❌ Error enhancing prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
