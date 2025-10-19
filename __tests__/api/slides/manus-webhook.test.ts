/**
 * Manus Webhook Tests - Phase 2
 * Tests POST /api/slides/manus-webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/slides/manus-webhook/route';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import * as socketServer from '@/lib/socket/server';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/socket/server', () => ({
  emitGenerationStatus: jest.fn(),
  emitGenerationProgress: jest.fn(),
  emitGenerationCompleted: jest.fn(),
  emitGenerationError: jest.fn(),
  emitThinkingStepUpdate: jest.fn(),
  emitThinkingActionAdd: jest.fn(),
  emitSlidePreviewUpdate: jest.fn(),
  emitPresentationReady: jest.fn(),
  emitPresentationError: jest.fn(),
}));

jest.mock('@/lib/api/slides/slides-parser', () => ({
  parseManusSlidesResponse: jest.fn((webhookData) => {
    return Promise.resolve([
      {
        title: 'Slide 1',
        content: 'Content 1',
        layout: 'title_slide',
        order_index: 0,
      },
      {
        title: 'Slide 2',
        content: 'Content 2',
        layout: 'content',
        order_index: 1,
      },
    ]);
  }),
}));

describe('POST /api/slides/manus-webhook', () => {
  let mockSupabase: any;
  let originalWebhookSecret: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    // Store and clear webhook secret for most tests
    originalWebhookSecret = process.env.MANUS_WEBHOOK_SECRET;
    delete process.env.MANUS_WEBHOOK_SECRET;

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    // Restore webhook secret
    if (originalWebhookSecret) {
      process.env.MANUS_WEBHOOK_SECRET = originalWebhookSecret;
    }
  });

  describe('Webhook Signature Verification', () => {
    beforeEach(() => {
      process.env.MANUS_WEBHOOK_SECRET = 'test-webhook-secret';
    });

    it('should reject requests without signature when secret is configured', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_started',
      };

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Missing signature',
      });
    });

    it('should reject requests with invalid signature', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_started',
      };

      const request = {
        headers: {
          get: jest.fn(() => 'invalid-signature'),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Invalid signature',
      });
    });

    it('should accept requests with valid signature', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_started',
      };

      const body = JSON.stringify(webhookData);
      const validSignature = crypto
        .createHmac('sha256', 'test-webhook-secret')
        .update(body)
        .digest('hex');

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockManusTasksUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return {
            select: mockManusTasksSelect,
            update: mockManusTasksUpdate,
          };
        }
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => validSignature),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Validation', () => {
    it('should return 400 when task_id is missing', async () => {
      const webhookData = {
        event_type: 'task_started',
      };

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Missing task_id',
      });
    });

    it('should return 404 when manus task is not found', async () => {
      const webhookData = {
        task_id: 'non-existent-task',
        event_type: 'task_started',
      };

      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return { select: mockManusTasksSelect };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Task not found',
      });
    });

    it('should return 404 when presentation is not found', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_started',
      };

      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return { select: mockManusTasksSelect };
        }
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Presentation not found',
      });
    });
  });

  describe('Event: task_started', () => {
    it('should handle task_started event correctly', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_started',
      };

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockManusTasksUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return {
            select: mockManusTasksSelect,
            update: mockManusTasksUpdate,
          };
        }
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message: 'Task started event processed',
      });

      // Verify database updates
      expect(mockManusTasksUpdate).toHaveBeenCalledWith({
        status: 'running',
        webhook_data: webhookData,
      });

      // Verify socket emissions
      expect(socketServer.emitGenerationStatus).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        'thinking',
        'AI is analyzing your request...'
      );

      expect(socketServer.emitThinkingStepUpdate).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          id: 'step-init',
          title: 'Initializing presentation generation',
          status: 'running',
        })
      );
    });
  });

  describe('Event: task_updated', () => {
    it('should handle task_updated event with thinking steps', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_updated',
        thinking_steps: [
          {
            id: 'step-1',
            title: 'Analyzing requirements',
            status: 'running',
            actions: [],
          },
        ],
      };

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockManusTasksUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return {
            select: mockManusTasksSelect,
            update: mockManusTasksUpdate,
          };
        }
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify thinking step update emission
      expect(socketServer.emitThinkingStepUpdate).toHaveBeenCalledWith(
        'user-123',
        webhookData.thinking_steps[0]
      );
    });

    it('should handle task_updated event with thinking action', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_updated',
        thinking_action: {
          step_id: 'step-1',
          id: 'action-1',
          type: 'search',
          text: 'Searching for templates...',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockManusTasksUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return {
            select: mockManusTasksSelect,
            update: mockManusTasksUpdate,
          };
        }
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify thinking action emission
      expect(socketServer.emitThinkingActionAdd).toHaveBeenCalledWith(
        'user-123',
        'step-1',
        {
          id: 'action-1',
          type: 'search',
          text: 'Searching for templates...',
          timestamp: '2024-01-01T00:00:00Z',
        }
      );
    });

    it('should handle task_updated event with slide preview', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_updated',
        slide_preview: {
          order_index: 1,
          title: 'Introduction',
          content: '# Welcome',
          layout: 'title_slide',
        },
      };

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockManusTasksUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return {
            select: mockManusTasksSelect,
            update: mockManusTasksUpdate,
          };
        }
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify slide preview emission
      expect(socketServer.emitSlidePreviewUpdate).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        {
          order_index: 1,
          title: 'Introduction',
          content: '# Welcome',
          layout: 'title_slide',
        }
      );
    });

    it('should handle task_updated event with progress', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_updated',
        progress: 50,
        current_step: 'Generating slides...',
      };

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockManusTasksUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return {
            select: mockManusTasksSelect,
            update: mockManusTasksUpdate,
          };
        }
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify progress emission
      expect(socketServer.emitGenerationProgress).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        50,
        'Generating slides...'
      );
    });
  });

  describe('Event: task_stopped (Success)', () => {
    it('should handle successful task completion', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_stopped',
        stop_reason: 'finish',
        result: {
          slides: [],
        },
      };

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockManusTasksUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockPresentationsUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockSlidesInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return {
            select: mockManusTasksSelect,
            update: mockManusTasksUpdate,
          };
        }
        if (table === 'presentations') {
          return {
            select: mockPresentationsSelect,
            update: mockPresentationsUpdate,
          };
        }
        if (table === 'slides') {
          return {
            insert: mockSlidesInsert,
          };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message: 'Webhook processed successfully',
        data: { slides_count: 2 },
      });

      // Verify database updates
      expect(mockManusTasksUpdate).toHaveBeenCalledWith({
        status: 'completed',
        webhook_data: webhookData,
      });

      expect(mockPresentationsUpdate).toHaveBeenCalledWith({
        status: 'ready',
      });

      // Verify socket emissions
      expect(socketServer.emitGenerationStatus).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        'completed',
        'Presentation ready!'
      );

      expect(socketServer.emitGenerationProgress).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        100,
        'Completed'
      );

      expect(socketServer.emitGenerationCompleted).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        2
      );

      expect(socketServer.emitPresentationReady).toHaveBeenCalledWith(
        'user-123',
        'presentation-id'
      );
    });
  });

  describe('Event: task_stopped (Failure)', () => {
    it('should handle task failure', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_stopped',
        stop_reason: 'error',
      };

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockManusTasksUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockPresentationsUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return {
            select: mockManusTasksSelect,
            update: mockManusTasksUpdate,
          };
        }
        if (table === 'presentations') {
          return {
            select: mockPresentationsSelect,
            update: mockPresentationsUpdate,
          };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message: 'Task failure recorded',
      });

      // Verify database updates
      expect(mockManusTasksUpdate).toHaveBeenCalledWith({
        status: 'failed',
        webhook_data: webhookData,
      });

      expect(mockPresentationsUpdate).toHaveBeenCalledWith({
        status: 'error',
      });

      // Verify error emissions
      expect(socketServer.emitGenerationStatus).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        'error',
        'Generation failed'
      );

      expect(socketServer.emitGenerationError).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        'error'
      );

      expect(socketServer.emitPresentationError).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        'error'
      );
    });

    it('should handle parsing errors during task completion', async () => {
      const { parseManusSlidesResponse } = require('@/lib/api/slides/slides-parser');
      parseManusSlidesResponse.mockRejectedValueOnce(new Error('Parsing failed'));

      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'task_stopped',
        stop_reason: 'finish',
      };

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockManusTasksUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockPresentationsUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return {
            select: mockManusTasksSelect,
            update: mockManusTasksUpdate,
          };
        }
        if (table === 'presentations') {
          return {
            select: mockPresentationsSelect,
            update: mockPresentationsUpdate,
          };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Failed to parse slides: Parsing failed',
      });

      // Verify presentation status updated to error
      expect(mockPresentationsUpdate).toHaveBeenCalledWith({
        status: 'error',
      });

      // Verify error emission
      expect(socketServer.emitGenerationError).toHaveBeenCalledWith(
        'user-123',
        'presentation-id',
        'Parsing failed',
        'parsing'
      );
    });
  });

  describe('Unknown Event Types', () => {
    it('should acknowledge unknown event types', async () => {
      const webhookData = {
        task_id: 'test-task-id',
        event_type: 'unknown_event',
      };

      // Mock database responses
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { presentation_id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { user_id: 'user-123', id: 'presentation-id' },
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'manus_tasks') {
          return { select: mockManusTasksSelect };
        }
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const request = {
        headers: {
          get: jest.fn(() => null),
        },
        json: jest.fn().mockResolvedValue(webhookData),
      } as unknown as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message: 'Event acknowledged',
      });
    });
  });
});
