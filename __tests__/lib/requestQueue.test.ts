/**
 * Request Queue Manager Tests
 *
 * Tests the multi-conversation request queue functionality
 */

import { requestQueue, RequestStatus } from '@/lib/requestQueue';

describe('RequestQueueManager', () => {
  beforeEach(() => {
    // Reset queue state before each test for proper isolation
    requestQueue.reset();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('startRequest', () => {
    it('should create and track a new request', () => {
      const abortController = new AbortController();
      const request = requestQueue.startRequest({
        id: 'test-request-1',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        abortController,
        metadata: { mode: 'chat', model: 'gpt-4o' },
      });

      expect(request.id).toBe('test-request-1');
      expect(request.conversationId).toBe('conv-1');
      expect(request.messageId).toBe('msg-1');
      expect(request.status).toBe('pending');
      expect(request.metadata?.mode).toBe('chat');
    });
  });

  describe('updateStatus', () => {
    it('should update request status', () => {
      const abortController = new AbortController();
      requestQueue.startRequest({
        id: 'test-request-2',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        abortController,
      });

      requestQueue.updateStatus('test-request-2', 'streaming');
      const request = requestQueue.getRequest('test-request-2');
      expect(request?.status).toBe('streaming');
    });

    it('should auto-cleanup completed requests after delay', (done) => {
      const abortController = new AbortController();
      requestQueue.startRequest({
        id: 'test-request-3',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        abortController,
      });

      requestQueue.updateStatus('test-request-3', 'completed');

      // Should still exist immediately
      expect(requestQueue.getRequest('test-request-3')).toBeDefined();

      // Should be removed after 5 seconds
      setTimeout(() => {
        expect(requestQueue.getRequest('test-request-3')).toBeUndefined();
        done();
      }, 6000);
    }, 10000);
  });

  describe('getActiveRequests', () => {
    it('should return only active requests', () => {
      const ac1 = new AbortController();
      const ac2 = new AbortController();
      const ac3 = new AbortController();

      requestQueue.startRequest({
        id: 'req-1',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        abortController: ac1,
      });

      requestQueue.startRequest({
        id: 'req-2',
        conversationId: 'conv-2',
        messageId: 'msg-2',
        abortController: ac2,
      });

      requestQueue.startRequest({
        id: 'req-3',
        conversationId: 'conv-1',
        messageId: 'msg-3',
        abortController: ac3,
      });

      requestQueue.updateStatus('req-2', 'streaming');
      requestQueue.updateStatus('req-3', 'completed');

      const activeRequests = requestQueue.getActiveRequests();
      expect(activeRequests.length).toBe(2); // req-1 (pending) and req-2 (streaming)
      expect(activeRequests.map((r) => r.id)).toContain('req-1');
      expect(activeRequests.map((r) => r.id)).toContain('req-2');
      expect(activeRequests.map((r) => r.id)).not.toContain('req-3');
    });
  });

  describe('getBackgroundRequests', () => {
    it('should return requests from other conversations', () => {
      const ac1 = new AbortController();
      const ac2 = new AbortController();
      const ac3 = new AbortController();

      requestQueue.startRequest({
        id: 'req-1',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        abortController: ac1,
      });

      requestQueue.startRequest({
        id: 'req-2',
        conversationId: 'conv-2',
        messageId: 'msg-2',
        abortController: ac2,
      });

      requestQueue.startRequest({
        id: 'req-3',
        conversationId: 'conv-3',
        messageId: 'msg-3',
        abortController: ac3,
      });

      requestQueue.updateStatus('req-2', 'streaming');

      const bgRequests = requestQueue.getBackgroundRequests('conv-1');
      expect(bgRequests.length).toBe(2); // req-2 and req-3
      expect(bgRequests.map((r) => r.conversationId)).not.toContain('conv-1');
    });
  });

  describe('abortConversationRequests', () => {
    it('should abort all requests for a conversation', () => {
      const ac1 = new AbortController();
      const ac2 = new AbortController();
      const ac3 = new AbortController();

      requestQueue.startRequest({
        id: 'req-1',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        abortController: ac1,
      });

      requestQueue.startRequest({
        id: 'req-2',
        conversationId: 'conv-1',
        messageId: 'msg-2',
        abortController: ac2,
      });

      requestQueue.startRequest({
        id: 'req-3',
        conversationId: 'conv-2',
        messageId: 'msg-3',
        abortController: ac3,
      });

      requestQueue.updateStatus('req-1', 'streaming');
      requestQueue.updateStatus('req-2', 'pending');
      requestQueue.updateStatus('req-3', 'streaming');

      requestQueue.abortConversationRequests('conv-1');

      // Check abort signals
      expect(ac1.signal.aborted).toBe(true);
      expect(ac2.signal.aborted).toBe(true);
      expect(ac3.signal.aborted).toBe(false); // Different conversation

      // Check statuses
      expect(requestQueue.getRequest('req-1')?.status).toBe('aborted');
      expect(requestQueue.getRequest('req-2')?.status).toBe('aborted');
      expect(requestQueue.getRequest('req-3')?.status).toBe('streaming');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const ac1 = new AbortController();
      const ac2 = new AbortController();
      const ac3 = new AbortController();

      requestQueue.startRequest({
        id: 'req-1',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        abortController: ac1,
      });

      requestQueue.startRequest({
        id: 'req-2',
        conversationId: 'conv-1',
        messageId: 'msg-2',
        abortController: ac2,
      });

      requestQueue.startRequest({
        id: 'req-3',
        conversationId: 'conv-2',
        messageId: 'msg-3',
        abortController: ac3,
      });

      requestQueue.updateStatus('req-1', 'streaming');
      requestQueue.updateStatus('req-2', 'completed');
      requestQueue.updateStatus('req-3', 'failed');

      const stats = requestQueue.getStats();
      expect(stats.pending).toBe(0);
      expect(stats.streaming).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.total).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('should remove old finished requests', () => {
      const ac1 = new AbortController();
      const ac2 = new AbortController();

      requestQueue.startRequest({
        id: 'req-1',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        abortController: ac1,
      });

      requestQueue.startRequest({
        id: 'req-2',
        conversationId: 'conv-1',
        messageId: 'msg-2',
        abortController: ac2,
      });

      requestQueue.updateStatus('req-1', 'completed');
      requestQueue.updateStatus('req-2', 'streaming');

      // Cleanup immediately (0ms threshold)
      requestQueue.cleanup(0);

      // Completed request should be removed
      expect(requestQueue.getRequest('req-1')).toBeUndefined();
      // Active request should remain
      expect(requestQueue.getRequest('req-2')).toBeDefined();
    });
  });

  describe('subscribe', () => {
    it('should notify listeners of changes', () => {
      const listener = jest.fn();
      const unsubscribe = requestQueue.subscribe(listener);

      const ac = new AbortController();
      requestQueue.startRequest({
        id: 'req-1',
        conversationId: 'conv-1',
        messageId: 'msg-1',
        abortController: ac,
      });

      expect(listener).toHaveBeenCalled();

      unsubscribe();
      listener.mockClear();

      requestQueue.updateStatus('req-1', 'streaming');
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
