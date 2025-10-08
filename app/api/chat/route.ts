import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, attachments } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Process messages with attachments (images and PDFs)
    const processedMessages = messages.map((msg: any) => {
      if (msg.attachments && msg.attachments.length > 0) {
        // Collect images for Vision API (use base64 for local images)
        const imageUrls = msg.attachments
          .filter((att: any) => att.type === "image")
          .map((att: any) => ({
            type: "image_url",
            image_url: {
              url: att.base64 || att.url, // Use base64 if available, fallback to URL
            },
          }));

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

        return {
          role: msg.role,
          content: [
            { type: "text", text: fullText },
            ...imageUrls,
          ],
        };
      }

      return {
        role: msg.role,
        content: msg.content,
      };
    });

    // Use processed messages directly - let OpenAI respond freely
    const messagesWithSystem = processedMessages;

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o", // Same model as ChatGPT for better, more natural responses
      messages: messagesWithSystem,
      stream: true,
      temperature: 1, // Higher for more creative, natural responses
      top_p: 1, // Full token consideration
      frequency_penalty: 0.5, // Stronger reduction of repetition
      presence_penalty: 0.2, // More topic diversity
      // No max_tokens - let it respond fully, charged via user credits
    });

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
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat request" },
      { status: 500 }
    );
  }
}
