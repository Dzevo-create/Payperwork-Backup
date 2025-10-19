"use client";

import { Suspense } from "react";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

/**
 * Chat Page
 *
 * Main chat interface supporting:
 * - Text chat with OpenAI GPT-4o
 * - Image generation (Gemini Pro Vision)
 * - Video generation (Payperwork Move v1 & v2)
 * - Multi-modal inputs (images, PDFs, voice)
 * - Slides workflow (when ?workflow=slides)
 */

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <ChatLayout />
      </Suspense>
    </ErrorBoundary>
  );
}
