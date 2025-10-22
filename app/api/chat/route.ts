import { NextRequest, NextResponse } from "next/server";
import { chatRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { textValidation, fileValidation, ValidationError } from "@/lib/validation";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { createChatStream } from "@/lib/api/providers/openai";
import { processMessagesWithAttachments } from "@/lib/api/utils/messageFormatting";
import { createStreamingResponse } from "@/lib/api/utils/streaming";
import { requireAuth } from "@/lib/auth-api";

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // Authentication check
    let user;
    try {
      user = await requireAuth(req);
      apiLogger.info("Authenticated chat request", { userId: user.id });
    } catch (authError) {
      apiLogger.warn("Unauthorized chat request", { clientId });
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    // API Key validation
    const keyValidation = validateApiKeys(["openai"]);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new ValidationError("Content-Type must be application/json"),
        "chat-api"
      );
    }

    // Rate limiting
    const rateLimitResult = chatRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      apiLogger.warn("Rate limit exceeded for chat", { clientId });
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    // Parse JSON with error handling
    let messages,
      attachments,
      gptModel: "gpt-4o" | "gpt-5" = "gpt-4o";
    try {
      const body = await req.json();
      messages = body.messages;
      attachments = body.attachments;
      gptModel = body.gptModel || "gpt-4o"; // Default to GPT-4o for speed
    } catch (parseError) {
      apiLogger.error(
        "Failed to parse request body",
        parseError instanceof Error ? parseError : undefined,
        { clientId }
      );
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Validate messages
    for (const msg of messages) {
      if (msg.content && typeof msg.content === "string") {
        try {
          textValidation.validateMessage(msg.content);
        } catch (error) {
          if (error instanceof ValidationError) {
            apiLogger.warn("Invalid message content", { error: error.message });
            return NextResponse.json({ error: error.message }, { status: 400 });
          }
          throw error;
        }
      }
    }

    // Validate attachments if present
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.type === "image" && att.base64) {
          try {
            fileValidation.validateBase64Image(att.base64);
          } catch (error) {
            if (error instanceof ValidationError) {
              apiLogger.warn("Invalid image attachment", { error: error.message });
              return NextResponse.json({ error: error.message }, { status: 400 });
            }
            throw error;
          }
        }
      }
    }

    // Process messages with attachments (images and PDFs)
    const processedMessages = processMessagesWithAttachments(messages);

    // Log model selection
    apiLogger.info(`Using GPT model: ${gptModel}`, { clientId });

    // Create streaming response with retry logic and selected model
    const stream = await createChatStream(processedMessages, gptModel);

    return createStreamingResponse(stream);
  } catch (error) {
    apiLogger.error("OpenAI API Error", error instanceof Error ? error : undefined, { clientId });

    // Handle specific OpenAI errors
    if (error && typeof error === "object" && "status" in error) {
      const statusError = error as { status: number; message?: string };

      if (statusError.status === 429) {
        return NextResponse.json(
          {
            error: "Zu viele Anfragen. Bitte versuche es in einem Moment erneut.",
            retryable: true,
          },
          { status: 429 }
        );
      }

      if (statusError.status === 401) {
        apiLogger.error("OpenAI authentication failed");
        return NextResponse.json(
          { error: "API Authentifizierung fehlgeschlagen", retryable: false },
          { status: 500 }
        );
      }

      if (statusError.status === 400) {
        return NextResponse.json(
          { error: statusError.message || "Ungültige Anfrage", retryable: false },
          { status: 400 }
        );
      }

      if (statusError.status >= 500) {
        return NextResponse.json(
          {
            error: "OpenAI Service vorübergehend nicht verfügbar. Bitte versuche es erneut.",
            retryable: true,
          },
          { status: 503 }
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
    return NextResponse.json({ error: errorMessage, retryable: true }, { status: 500 });
  }
}
