/**
 * Streaming response helpers
 * Utilities for handling SSE streaming from chat APIs
 */

import { STREAMING_CONFIG } from "@/config/chatArea/constants";

export interface StreamingState {
  accumulatedContent: string;
}

/**
 * Initialize streaming state
 */
export function initializeStreamingState(): StreamingState {
  return {
    accumulatedContent: "",
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
