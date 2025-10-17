import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { chatRateLimiter, addRateLimitHeaders, getClientId } from "@/lib/rate-limit";
import { textValidation } from "@/lib/validation";
import { apiLogger } from "@/lib/logger";
import { validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";

/**
 * C1 Chat API Route (ACTIVE ✅)
 *
 * Uses Thesys C1 API for Generative UI responses.
 * Returns interactive UI components instead of plain text.
 */

const c1Client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation - C1 uses Thesys API which needs OpenAI SDK
    // But check for THESYS_API_KEY specifically
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

    apiLogger.info("C1 chat request received", {
      clientId,
      messageCount: messages.length,
    });

    // Call C1 API with Generative UI model
    const llmStream = await c1Client.chat.completions.create({
      model: "c1-latest", // C1 Generative UI model - always uses the latest version
      messages: messages,
      stream: true,
    });

    apiLogger.info("C1 chat streaming started", { clientId });

    // Stream C1 response directly without transformation
    // C1 API returns JSON wrapped in <content> tags - we keep it as-is
    const encoder = new TextEncoder();

    const customStream = new ReadableStream({
      async start(controller) {
        let isClosed = false;

        try {
          for await (const chunk of llmStream) {
            // Check if controller is still open before enqueueing
            if (isClosed) {
              apiLogger.warn("C1 stream closed early, stopping iteration", { clientId });
              break;
            }

            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              try {
                // Send raw C1 content (including <content> tags - C1Component will parse it)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              } catch (enqueueError: any) {
                // Controller closed (client disconnected), stop streaming
                if (enqueueError.message?.includes("Controller is already closed")) {
                  apiLogger.info("Client disconnected from C1 stream", { clientId });
                  isClosed = true;
                  break;
                }
                throw enqueueError; // Re-throw other errors
              }
            }
          }

          // Only enqueue [DONE] if controller is still open
          if (!isClosed) {
            try {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (closeError: any) {
              // Ignore if already closed
              if (!closeError.message?.includes("Controller is already closed")) {
                throw closeError;
              }
            }
          }
        } catch (error: any) {
          apiLogger.error("C1 stream error", error, { clientId });
          // Only call controller.error if not already closed
          if (!isClosed) {
            try {
              controller.error(error);
            } catch {
              // Ignore if controller is already closed
            }
          }
        }
      },
    });

    return new Response(customStream, {
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
