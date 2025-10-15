/**
 * Streaming utilities for Server-Sent Events (SSE)
 * Handles streaming responses from OpenAI and other providers
 */

import { apiLogger } from "@/lib/logger";

/**
 * Creates a streaming response for OpenAI chat completions
 */
export function createStreamingResponse(stream: AsyncIterable<any>): Response {
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
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * SSE headers for streaming responses
 */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;
