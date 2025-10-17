/**
 * Request Queue Manager
 *
 * Manages multiple concurrent AI requests across different conversations.
 * Allows switching conversations without aborting active requests.
 */

import { chatLogger } from './logger';

export type RequestStatus = 'pending' | 'streaming' | 'completed' | 'failed' | 'aborted';

export interface QueuedRequest {
  id: string;
  conversationId: string;
  abortController: AbortController;
  status: RequestStatus;
  createdAt: Date;
  messageId: string; // The assistant message ID being updated
  metadata?: {
    mode?: 'chat' | 'image' | 'video';
    model?: string;
  };
}

class RequestQueueManager {
  private requests: Map<string, QueuedRequest> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Start tracking a new request
   */
  startRequest(params: {
    id: string;
    conversationId: string;
    messageId: string;
    abortController: AbortController;
    metadata?: QueuedRequest['metadata'];
  }): QueuedRequest {
    const request: QueuedRequest = {
      id: params.id,
      conversationId: params.conversationId,
      messageId: params.messageId,
      abortController: params.abortController,
      status: 'pending',
      createdAt: new Date(),
      metadata: params.metadata,
    };

    this.requests.set(params.id, request);
    chatLogger.info(`Request started: ${params.id} for conversation ${params.conversationId}`);
    this.notifyListeners();

    return request;
  }

  /**
   * Update request status
   */
  updateStatus(requestId: string, status: RequestStatus): void {
    const request = this.requests.get(requestId);
    if (!request) {
      chatLogger.warn(`Attempt to update non-existent request: ${requestId}`);
      return;
    }

    request.status = status;
    chatLogger.debug(`Request ${requestId} status updated to: ${status}`);

    // Auto-cleanup completed/failed/aborted requests after a delay
    if (status === 'completed' || status === 'failed' || status === 'aborted') {
      setTimeout(() => {
        this.removeRequest(requestId);
      }, 5000); // Keep for 5 seconds for UI feedback
    }

    this.notifyListeners();
  }

  /**
   * Abort all requests for a specific conversation
   */
  abortConversationRequests(conversationId: string): void {
    const conversationRequests = Array.from(this.requests.values()).filter(
      (req) => req.conversationId === conversationId
    );

    if (conversationRequests.length === 0) {
      chatLogger.debug(`No active requests to abort for conversation: ${conversationId}`);
      return;
    }

    chatLogger.info(`Aborting ${conversationRequests.length} requests for conversation: ${conversationId}`);

    conversationRequests.forEach((request) => {
      if (request.status === 'pending' || request.status === 'streaming') {
        request.abortController.abort();
        request.status = 'aborted';
        chatLogger.debug(`Aborted request: ${request.id}`);
      }
    });

    this.notifyListeners();
  }

  /**
   * Abort a specific request
   */
  abortRequest(requestId: string): void {
    const request = this.requests.get(requestId);
    if (!request) {
      chatLogger.warn(`Attempt to abort non-existent request: ${requestId}`);
      return;
    }

    if (request.status === 'pending' || request.status === 'streaming') {
      request.abortController.abort();
      request.status = 'aborted';
      chatLogger.info(`Request aborted: ${requestId}`);
      this.notifyListeners();
    }
  }

  /**
   * Get a specific request
   */
  getRequest(requestId: string): QueuedRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get all active requests (pending or streaming)
   */
  getActiveRequests(): QueuedRequest[] {
    return Array.from(this.requests.values()).filter(
      (req) => req.status === 'pending' || req.status === 'streaming'
    );
  }

  /**
   * Get active requests for a specific conversation
   */
  getActiveRequestsForConversation(conversationId: string): QueuedRequest[] {
    return this.getActiveRequests().filter(
      (req) => req.conversationId === conversationId
    );
  }

  /**
   * Get active background requests (not in current conversation)
   */
  getBackgroundRequests(currentConversationId: string | null): QueuedRequest[] {
    return this.getActiveRequests().filter(
      (req) => req.conversationId !== currentConversationId
    );
  }

  /**
   * Remove a request from the queue
   */
  removeRequest(requestId: string): void {
    const removed = this.requests.delete(requestId);
    if (removed) {
      chatLogger.debug(`Request removed from queue: ${requestId}`);
      this.notifyListeners();
    }
  }

  /**
   * Cleanup old requests (completed, failed, aborted) older than specified time
   */
  cleanup(olderThanMs: number = 60000): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.requests.forEach((request, id) => {
      const age = now - request.createdAt.getTime();
      const isFinished = ['completed', 'failed', 'aborted'].includes(request.status);

      if (isFinished && age >= olderThanMs) {
        toRemove.push(id);
      }
    });

    toRemove.forEach((id) => this.removeRequest(id));

    if (toRemove.length > 0) {
      chatLogger.info(`Cleaned up ${toRemove.length} old requests`);
    }
  }

  /**
   * Subscribe to request queue changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Unsubscribe from request queue changes
   */
  unsubscribe(listener: () => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all subscribers of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Reset the queue (for testing purposes)
   * Clears all requests and listeners
   */
  reset(): void {
    this.requests.clear();
    this.listeners.clear();
    chatLogger.debug('Request queue reset');
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const all = Array.from(this.requests.values());
    return {
      total: all.length,
      pending: all.filter((r) => r.status === 'pending').length,
      streaming: all.filter((r) => r.status === 'streaming').length,
      completed: all.filter((r) => r.status === 'completed').length,
      failed: all.filter((r) => r.status === 'failed').length,
      aborted: all.filter((r) => r.status === 'aborted').length,
    };
  }
}

// Singleton instance
export const requestQueue = new RequestQueueManager();
