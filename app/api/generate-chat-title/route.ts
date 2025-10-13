import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { apiRateLimiter, getClientId } from "@/lib/rate-limit";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation
    const keyValidation = validateApiKeys(['openai']);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new Error('Content-Type must be application/json'),
        'generate-chat-title-api'
      );
    }

    // Rate limiting
    const rateLimitResult = apiRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid prompt provided" },
        { status: 400 }
      );
    }

    // Use OpenAI to generate a professional title from the prompt
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use mini for speed
      messages: [
        {
          role: "system",
          content: `Du bist ein Experte für das Erstellen von prägnanten, professionellen Überschriften.

Deine Aufgabe:
- Erstelle aus dem User-Prompt eine kurze, aussagekräftige Überschrift (max. 5 Wörter)
- Die Überschrift soll beschreiben WAS der User möchte, nicht den exakten Prompt wiederholen
- Verwende die gleiche Sprache wie der User-Prompt
- Sei präzise und professionell

Beispiele:
- Prompt: "erstelle ein bild von zürich" → Überschrift: "Bilderstellung von Zürich"
- Prompt: "write a python script to sort files" → Überschrift: "Python Datei-Sortierung"
- Prompt: "erkläre mir quantenphysik" → Überschrift: "Quantenphysik Erklärung"
- Prompt: "create a video of a sunset" → Überschrift: "Sonnenuntergang Video"
- Prompt: "hilf mir beim debuggen" → Überschrift: "Code Debugging"

Antworte NUR mit der Überschrift, keine Erklärungen oder Anführungszeichen.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 20,
    });

    let title = response.choices[0]?.message?.content?.trim() || "Neuer Chat";

    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, "");

    // Limit to 50 characters
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }

    console.log("✅ Generated chat title:", title, "from prompt:", prompt.substring(0, 50));

    return NextResponse.json({ title });
  } catch (error) {
    return handleApiError(error, 'generate-chat-title-api');
  }
}
