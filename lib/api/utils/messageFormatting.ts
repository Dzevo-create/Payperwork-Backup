/**
 * Message formatting utilities for chat API
 * Handles attachments (images and PDFs) and message structure
 */

export interface Attachment {
  type: "image" | "pdf";
  name?: string;
  base64?: string;
  structuredText?: string;
  metadata?: {
    totalPages?: number;
  };
  pages?: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
}

/**
 * Formats PDF text with ChatGPT-style formatting
 */
export function formatPdfText(attachments: Attachment[]): string {
  return attachments
    .filter((att) => att.type === "pdf" && att.structuredText)
    .map((att) => {
      const pages = att.metadata?.totalPages || att.pages;
      const header = `\n\n📄 Dokument: ${att.name} (${pages} Seiten)\n${"=".repeat(60)}\n`;
      return header + att.structuredText;
    })
    .join("\n\n");
}

/**
 * Formats image URLs for OpenAI Vision API
 */
export function formatImageUrls(attachments: Attachment[]): Array<{ type: string; image_url: { url: string } }> {
  return attachments
    .filter((att) => att.type === "image" && att.base64)
    .map((att) => ({
      type: "image_url",
      image_url: {
        url: att.base64!,
      },
    }));
}

/**
 * Processes messages with attachments for OpenAI API
 */
export function processMessagesWithAttachments(messages: ChatMessage[]): any[] {
  return messages.map((msg) => {
    if (msg.attachments && msg.attachments.length > 0) {
      // Collect PDF text with ChatGPT-style formatting
      const pdfTexts = formatPdfText(msg.attachments);

      // Combine user message with PDF text
      const fullText = msg.content + pdfTexts;

      // Only include images for user messages (OpenAI restriction)
      if (msg.role === "user") {
        const imageUrls = formatImageUrls(msg.attachments);

        return {
          role: msg.role,
          content: [{ type: "text", text: fullText }, ...imageUrls],
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
}
