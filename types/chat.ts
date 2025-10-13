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
  // C1-specific properties
  isC1Streaming?: boolean; // Indicates C1 response is still being buffered
  wasGeneratedWithC1?: boolean; // True if this message was created with Super Chat enabled
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
}

export interface ChatError {
  message: string;
  code?: string;
  retryable?: boolean;
}
