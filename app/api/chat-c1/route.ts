import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { chatRateLimiter, addRateLimitHeaders, getClientId } from "@/lib/rate-limit";
import { textValidation } from "@/lib/validation";
import { apiLogger } from "@/lib/logger";
import { validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";

/**
 * C1 Chat API Route with Claude Sonnet 4 (SIMPLIFIED - WORKING VERSION ✅)
 *
 * Uses Thesys C1 API with Claude Sonnet 4 for Generative UI responses.
 * Returns interactive UI components instead of plain text.
 *
 * This is a MINIMAL working version without domains/tools.
 */

// Minimal system prompt for C1
const SIMPLE_SYSTEM_PROMPT = `You are a professional AI assistant powered by Claude Sonnet 4.
You provide accurate, well-structured, and visually rich responses using interactive UI components.

OUTPUT RULES:
1. Use structured UI components (cards, charts, tables, lists) when appropriate
2. Keep responses clear, concise, and professional
3. Cite sources when providing factual information
4. End with 2-3 relevant follow-up questions

COMPLIANCE:
- Maintain a neutral, helpful, professional tone
- Clearly state data limitations when applicable
- Include appropriate disclaimers for advice`;

const c1Client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed/",
});

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation
    if (!process.env.THESYS_API_KEY) {
      return handleApiError(
        new Error('Thesys API key not configured'),
        'c1-chat-api'
      );
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new Error('Content-Type must be application/json'),
        'c1-chat-api'
      );
    }

    // Rate limiting
    const rateLimitResult = chatRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      apiLogger.warn("Rate limit exceeded for C1 chat", { clientId });
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const { messages } = await req.json();

    // Validate messages
    for (const msg of messages) {
      if (msg.content && typeof msg.content === "string") {
        textValidation.validateMessage(msg.content);
      }
    }

    // Inject system prompt at the beginning
    const enhancedMessages = [
      { role: "system", content: SIMPLE_SYSTEM_PROMPT },
      ...messages
    ];

    apiLogger.info("C1 chat request received", {
      clientId,
      messageCount: messages.length,
      model: "claude-sonnet-4",
    });

    // Call C1 API with Claude Sonnet 4 (NO TOOLS - SIMPLE VERSION)
    const completion = await c1Client.chat.completions.create({
      model: "c1/anthropic/claude-sonnet-4/v-20250930",
      temperature: 0.7,
      messages: enhancedMessages,
      stream: true,
    });

    apiLogger.info("C1 chat streaming started", { clientId });

    // Transform C1 stream to SSE format that frontend expects
    // Frontend expects: data: {"content": "..."}\n\n
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;
            const content = delta?.content;

            if (content) {
              // Format as SSE: data: {"content": "..."}\n\n
              const sseData = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          }

          // Send done marker
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    const responseStream = stream;

    return new Response(responseStream as unknown as ReadableStream, {
      headers: addRateLimitHeaders(
        new Headers({
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        }),
        rateLimitResult
      ),
    });
  } catch (error: any) {
    apiLogger.error("C1 API Error", error, { clientId });

    if (error.status === 401) {
      return NextResponse.json(
        { error: "C1 API-Schlüssel ungültig oder fehlend" },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: "C1 API-Rate-Limit erreicht. Bitte später erneut versuchen." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten beim C1 Chat" },
      { status: 500 }
    );
  }
}
