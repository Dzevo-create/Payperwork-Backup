// Central type definitions for the chat application

export interface Attachment {
  type: "image" | "pdf" | "video";
  url: string;
  name: string;
  base64?: string;
  pdfText?: string;
  structuredText?: string;
  metadata?: {
    totalPages?: number;
  };
  pages?: number;
  // Video-specific properties
  thumbnail?: string;
  duration?: string;
  // Image cropping/editing properties
  originalUrl?: string;
  originalBase64?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  replyTo?: {
    messageId: string;
    content: string;
    // Note: attachments are NOT stored here to avoid localStorage overflow
    // Use messageId to find the original message if you need attachments
  };
  // Generation type indicator for UI rendering
  generationType?: "image" | "video" | "text";
  generationAttempt?: number; // For retry indicator (1, 2, 3...)
  generationMaxAttempts?: number; // Total attempts (e.g., 3)
  // GPT model version used to generate this message
  gptModel?: "gpt-4o" | "gpt-5";
  // SuperChat (C1) mode indicator - tracks which mode created this message
  isSuperChatMode?: boolean; // If true, render with C1Component instead of ReactMarkdown
  // C1 generation flags - for tracking messages generated with Claude C1
  wasGeneratedWithC1?: boolean; // True if this message was generated using C1
  isC1Streaming?: boolean; // True if C1 is currently streaming this message
  // Video generation metadata
  videoTask?: {
    taskId: string;
    status: "processing" | "succeed" | "failed";
    model: "payperwork-v1" | "payperwork-v2";
    type: "text2video" | "image2video";
    duration: string;
    aspectRatio: string;
    progress?: number; // 0-100
    estimatedTimeRemaining?: number; // in seconds
    thumbnailUrl?: string; // For image2video
    error?: string;
  };
  // Image generation metadata
  imageTask?: {
    aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9";
    quality?: "standard" | "high" | "ultra";
    style?: string;
    lighting?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  isSuperChatEnabled?: boolean; // Per-conversation SuperChat mode toggle
}

export interface ChatError {
  message: string;
  code?: string;
  retryable?: boolean;
}
