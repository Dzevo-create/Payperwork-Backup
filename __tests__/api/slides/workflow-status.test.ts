/**
 * Workflow Status API Tests - Phase 2
 * Tests GET /api/slides/workflow/[presentationId]
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/slides/workflow/[presentationId]/route';
import { createClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/api-error-handler', () => ({
  handleApiError: jest.fn((error: Error, context: string) => {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

describe('GET /api/slides/workflow/[presentationId]', () => {
  let mockSupabase: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock NextRequest
    mockRequest = {
      headers: {
        get: jest.fn((key: string) => {
          if (key === 'Authorization') return 'Bearer test-token';
          return null;
        }),
      },
    } as unknown as NextRequest;
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'test-presentation-id' },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should pass Authorization header to Supabase client', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      await GET(mockRequest, {
        params: { presentationId: 'test-presentation-id' },
      });

      expect(createClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: 'Bearer test-token',
            },
          },
        }
      );
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return workflow status for generating presentation', async () => {
      const mockPresentation = {
        id: 'presentation-456',
        user_id: 'user-123',
        status: 'generating',
        task_id: 'task-789',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
      };

      const mockManusTask = {
        task_id: 'task-789',
        presentation_id: 'presentation-456',
        webhook_data: {
          progress: 45,
          current_step: 'Creating slide content...',
        },
      };

      // Mock presentations query
      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPresentation,
              error: null,
            }),
          }),
        }),
      });

      // Mock manus_tasks query
      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockManusTask,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
        if (table === 'manus_tasks') {
          return { select: mockManusTasksSelect };
        }
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'presentation-456' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: {
          presentationId: 'presentation-456',
          status: 'generating',
          progress: 45,
          currentStep: 'Creating slide content...',
          taskId: 'task-789',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:05:00Z',
        },
      });
    });

    it('should return workflow status for ready presentation', async () => {
      const mockPresentation = {
        id: 'presentation-456',
        user_id: 'user-123',
        status: 'ready',
        task_id: 'task-789',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:10:00Z',
      };

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPresentation,
              error: null,
            }),
          }),
        }),
      });

      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
        if (table === 'manus_tasks') {
          return { select: mockManusTasksSelect };
        }
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'presentation-456' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: {
          presentationId: 'presentation-456',
          status: 'ready',
          progress: 100,
          currentStep: 'Completed',
          taskId: 'task-789',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:10:00Z',
        },
      });
    });

    it('should return workflow status for error presentation', async () => {
      const mockPresentation = {
        id: 'presentation-456',
        user_id: 'user-123',
        status: 'error',
        task_id: 'task-789',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:03:00Z',
      };

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPresentation,
              error: null,
            }),
          }),
        }),
      });

      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
        if (table === 'manus_tasks') {
          return { select: mockManusTasksSelect };
        }
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'presentation-456' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        data: {
          presentationId: 'presentation-456',
          status: 'error',
          progress: 0,
          currentStep: 'Error occurred',
          taskId: 'task-789',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:03:00Z',
        },
      });
    });

    it('should use default progress when webhook data is missing', async () => {
      const mockPresentation = {
        id: 'presentation-456',
        user_id: 'user-123',
        status: 'generating',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
      };

      const mockManusTask = {
        task_id: 'task-789',
        presentation_id: 'presentation-456',
        webhook_data: null,
      };

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPresentation,
              error: null,
            }),
          }),
        }),
      });

      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockManusTask,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
        if (table === 'manus_tasks') {
          return { select: mockManusTasksSelect };
        }
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'presentation-456' },
      });

      const data = await response.json();
      expect(data.data.progress).toBe(30); // Default progress for generating
    });

    it('should use default step when webhook data is missing', async () => {
      const mockPresentation = {
        id: 'presentation-456',
        user_id: 'user-123',
        status: 'generating',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
      };

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPresentation,
              error: null,
            }),
          }),
        }),
      });

      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
        if (table === 'manus_tasks') {
          return { select: mockManusTasksSelect };
        }
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'presentation-456' },
      });

      const data = await response.json();
      expect(data.data.currentStep).toBe('Generating slides...');
    });

    it('should prioritize presentation.task_id over manus_task.task_id', async () => {
      const mockPresentation = {
        id: 'presentation-456',
        user_id: 'user-123',
        status: 'generating',
        task_id: 'presentation-task-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
      };

      const mockManusTask = {
        task_id: 'manus-task-id',
        presentation_id: 'presentation-456',
      };

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPresentation,
              error: null,
            }),
          }),
        }),
      });

      const mockManusTasksSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockManusTask,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
        if (table === 'manus_tasks') {
          return { select: mockManusTasksSelect };
        }
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'presentation-456' },
      });

      const data = await response.json();
      expect(data.data.taskId).toBe('presentation-task-id');
    });
  });

  describe('Error Cases', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should return 404 when presentation is not found', async () => {
      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'non-existent-id' },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({
        success: false,
        error: 'Presentation not found',
      });
    });

    it('should return 404 when presentation belongs to different user', async () => {
      const mockPresentation = {
        id: 'presentation-456',
        user_id: 'different-user-id',
        status: 'ready',
      };

      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPresentation,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      // The query .eq('user_id', user.id) will return nothing
      mockPresentationsSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Not found'),
            }),
          }),
        }),
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'presentation-456' },
      });

      expect(response.status).toBe(404);
    });

    it('should handle database errors gracefully', async () => {
      const mockPresentationsSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'presentations') {
          return { select: mockPresentationsSelect };
        }
      });

      const response = await GET(mockRequest, {
        params: { presentationId: 'presentation-456' },
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe('Progress Calculation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
    });

    it('should calculate progress correctly for various webhook progress values', async () => {
      const progressValues = [0, 25, 50, 75, 100];

      for (const webhookProgress of progressValues) {
        const mockPresentation = {
          id: 'presentation-456',
          user_id: 'user-123',
          status: 'generating',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:05:00Z',
        };

        const mockManusTask = {
          task_id: 'task-789',
          webhook_data: {
            progress: webhookProgress,
          },
        };

        const mockPresentationsSelect = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPresentation,
                error: null,
              }),
            }),
          }),
        });

        const mockManusTasksSelect = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockManusTask,
              error: null,
            }),
          }),
        });

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'presentations') {
            return { select: mockPresentationsSelect };
          }
          if (table === 'manus_tasks') {
            return { select: mockManusTasksSelect };
          }
        });

        const response = await GET(mockRequest, {
          params: { presentationId: 'presentation-456' },
        });

        const data = await response.json();
        expect(data.data.progress).toBe(webhookProgress);
      }
    });
  });
});
