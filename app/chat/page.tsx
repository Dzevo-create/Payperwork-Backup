"use client";

import { ChatLayout } from "@/components/chat/ChatLayout";

/**
 * Chat Page
 *
 * Main chat interface supporting:
 * - Text chat with OpenAI GPT-4o
 * - Image generation (Gemini Pro Vision)
 * - Video generation (Payperwork Move v1 & v2)
 * - Multi-modal inputs (images, PDFs, voice)
 */

export default function ChatPage() {
  return <ChatLayout />;
}
