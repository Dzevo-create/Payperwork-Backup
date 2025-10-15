/**
 * Streaming response helpers
 * Utilities for handling SSE streaming from chat APIs
 */

import { C1_CONSTANTS, STREAMING_CONFIG } from "@/config/chatArea/constants";

export interface StreamingState {
  accumulatedContent: string;
  c1Buffer: string;
  isInsideC1Content: boolean;
  hasC1CompleteContent: boolean;
}

/**
 * Initialize streaming state
 */
export function initializeStreamingState(): StreamingState {
  return {
    accumulatedContent: "",
    c1Buffer: "",
    isInsideC1Content: false,
    hasC1CompleteContent: false,
  };
}

/**
 * Process a chunk of streaming data for standard chat
 */
export function processStandardChunk(
  state: StreamingState,
  content: string
): { state: StreamingState; displayContent: string } {
  const newState = {
    ...state,
    accumulatedContent: state.accumulatedContent + content,
  };
  return {
    state: newState,
    displayContent: newState.accumulatedContent,
  };
}

/**
 * Unescape HTML entities
 */
function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Process a chunk of streaming data for C1 (Super Chat)
 */
export function processC1Chunk(
  state: StreamingState,
  content: string
): { state: StreamingState; displayContent: string; isStreaming: boolean } {
  const newState = { ...state };

  // CRITICAL FIX: Unescape HTML entities BEFORE processing
  const unescapedContent = unescapeHtml(content);
  newState.c1Buffer += unescapedContent;

  // Check if we're starting C1 content
  if (newState.c1Buffer.includes(C1_CONSTANTS.contentTag.open)) {
    newState.isInsideC1Content = true;
  }

  // Check if we have complete C1 response
  if (newState.isInsideC1Content && newState.c1Buffer.includes(C1_CONSTANTS.contentTag.close)) {
    // Extract clean content between tags
    const match = newState.c1Buffer.match(/<content>([\s\S]*?)<\/content>/);
    if (match) {
      const cleanC1Content = match[1].trim();
      newState.hasC1CompleteContent = true;
      newState.isInsideC1Content = false;
      newState.c1Buffer = ""; // Clear buffer

      return {
        state: newState,
        displayContent: cleanC1Content,
        isStreaming: false,
      };
    }
  }

  // Still buffering (either before <content> tag or inside it) - show loading message
  return {
    state: newState,
    displayContent: C1_CONSTANTS.loadingMessage,
    isStreaming: true,
  };
}

/**
 * Finalize C1 content after streaming completes
 * Returns content WITH <content> tags (required by C1Component)
 */
export function finalizeC1Content(state: StreamingState): string {
  if (state.hasC1CompleteContent) {
    return ""; // Already finalized during streaming
  }

  if (state.c1Buffer.length === 0) {
    return "";
  }

  // Extract content between tags (if complete)
  const match = state.c1Buffer.match(/<content>([\s\S]*?)<\/content>/);
  if (match) {
    const cleanContent = match[1].trim();
    // Return WITH <content> tags - C1Component expects them
    return `<content>${cleanContent}</content>`;
  }

  // Partial content - try to find opening tag
  const partialMatch = state.c1Buffer.match(/<content>([\s\S]*?)$/);
  if (partialMatch) {
    const partialContent = partialMatch[1].trim();
    // Return WITH <content> tags even if incomplete
    return `<content>${partialContent}</content>`;
  }

  // No tags found - wrap buffer content
  return `<content>${state.c1Buffer.trim()}</content>`;
}

/**
 * Parse SSE data line
 */
export function parseSSELine(line: string): { content: string } | null {
  if (!line.startsWith(STREAMING_CONFIG.dataPrefix)) {
    return null;
  }

  const data = line.slice(STREAMING_CONFIG.dataPrefix.length);
  if (data === STREAMING_CONFIG.doneMarker) {
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    return { content: parsed.content || "" };
  } catch {
    return null;
  }
}

/**
 * Create a batched update scheduler for smooth rendering
 */
export function createUpdateScheduler(
  onUpdate: (content: string) => void
): (content: string) => void {
  let updateScheduled = false;

  return (content: string) => {
    if (!updateScheduled) {
      updateScheduled = true;
      requestAnimationFrame(() => {
        onUpdate(content);
        updateScheduled = false;
      });
    }
  };
}
