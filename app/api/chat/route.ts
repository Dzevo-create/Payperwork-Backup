import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { chatRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { textValidation, fileValidation, ValidationError } from "@/lib/validation";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Last retry, throw error
      if (i === maxRetries - 1) {
        throw error;
      }

      // Wait with exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Retry failed");
}

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
        new ValidationError('Content-Type must be application/json'),
        'chat-api'
      );
    }

    // Rate limiting
    const rateLimitResult = chatRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      apiLogger.warn('Rate limit exceeded for chat', { clientId });
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    // Parse JSON with error handling
    let messages, attachments;
    try {
      const body = await req.json();
      messages = body.messages;
      attachments = body.attachments;
    } catch (parseError) {
      apiLogger.error('Failed to parse request body', parseError instanceof Error ? parseError : undefined, { clientId });
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Validate messages
    for (const msg of messages) {
      if (msg.content && typeof msg.content === 'string') {
        try {
          textValidation.validateMessage(msg.content);
        } catch (error) {
          if (error instanceof ValidationError) {
            apiLogger.warn('Invalid message content', { error: error.message });
            return NextResponse.json(
              { error: error.message },
              { status: 400 }
            );
          }
          throw error;
        }
      }
    }

    // Validate attachments if present
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.type === 'image' && att.base64) {
          try {
            fileValidation.validateBase64Image(att.base64);
          } catch (error) {
            if (error instanceof ValidationError) {
              apiLogger.warn('Invalid image attachment', { error: error.message });
              return NextResponse.json(
                { error: error.message },
                { status: 400 }
              );
            }
            throw error;
          }
        }
      }
    }

    // Process messages with attachments (images and PDFs)
    const processedMessages = messages.map((msg: any) => {
      if (msg.attachments && msg.attachments.length > 0) {
        // Collect PDF text with ChatGPT-style formatting
        const pdfTexts = msg.attachments
          .filter((att: any) => att.type === "pdf" && att.structuredText)
          .map((att: any) => {
            const header = `\n\n📄 Dokument: ${att.name} (${att.metadata?.totalPages || att.pages} Seiten)\n${"=".repeat(60)}\n`;
            return header + att.structuredText;
          })
          .join("\n\n");

        // Combine user message with PDF text (ChatGPT-style)
        const fullText = msg.content + pdfTexts;

        // Only include images for user messages (OpenAI restriction)
        if (msg.role === "user") {
          // Collect images for Vision API (use base64 for local images)
          const imageUrls = msg.attachments
            .filter((att: any) => att.type === "image")
            .filter((att: any) => att.base64) // Only include images with base64
            .map((att: any) => ({
              type: "image_url",
              image_url: {
                url: att.base64, // Always use base64, never local URL
              },
            }));

          return {
            role: msg.role,
            content: [
              { type: "text", text: fullText },
              ...imageUrls,
            ],
          };
        }

        // For assistant messages, only return text (no images allowed)
        return {
          role: msg.role,
          content: fullText,
        };
      }

      return {
        role: msg.role,
        content: msg.content,
      };
    });

    // Use processed messages directly - let OpenAI respond freely
    const messagesWithSystem = processedMessages;

    // Create streaming response with retry logic
    const stream = await retryWithBackoff(
      () =>
        openai.chat.completions.create({
          model: "gpt-4o", // Same model as ChatGPT for better, more natural responses
          messages: messagesWithSystem,
          stream: true,
          temperature: 1, // Higher for more creative, natural responses
          top_p: 1, // Full token consideration
          frequency_penalty: 0.5, // Stronger reduction of repetition
          presence_penalty: 0.2, // More topic diversity
          // No max_tokens - let it respond fully, charged via user credits
        }),
      3, // 3 retries
      1000 // 1 second base delay
    );

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error: unknown) {
          apiLogger.error("Stream error", error instanceof Error ? error : undefined);

          if (!controller.desiredSize) {
            // Controller already closed by client disconnect
            return;
          }

          controller.error(error instanceof Error ? error : new Error(String(error)));
        }
      },
      cancel() {
        // Client disconnected - cleanup
        apiLogger.info("Client disconnected from stream");
      }
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    apiLogger.error("OpenAI API Error", error, { clientId });

    // Handle specific OpenAI errors
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuche es in einem Moment erneut.", retryable: true },
        { status: 429 }
      );
    }

    if (error.status === 401) {
      apiLogger.error("OpenAI authentication failed");
      return NextResponse.json(
        { error: "API Authentifizierung fehlgeschlagen", retryable: false },
        { status: 500 }
      );
    }

    if (error.status === 400) {
      return NextResponse.json(
        { error: error.message || "Ungültige Anfrage", retryable: false },
        { status: 400 }
      );
    }

    if (error.status >= 500) {
      return NextResponse.json(
        { error: "OpenAI Service vorübergehend nicht verfügbar. Bitte versuche es erneut.", retryable: true },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Ein Fehler ist aufgetreten", retryable: true },
      { status: 500 }
    );
  }
}
