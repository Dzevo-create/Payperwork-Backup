/**
 * useRecentGenerations Hook Tests
 * Tests recent generations management functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecentGenerations, type Generation } from '@/hooks/workflows/common/useRecentGenerations';
import { workflowLogger } from '@/lib/logger';
import { getUserIdSync } from '@/lib/supabase/insert-helper';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  workflowLogger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/supabase/insert-helper', () => ({
  getUserIdSync: jest.fn(() => 'test-user-id'),
}));

describe('useRecentGenerations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty generations', () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: [] }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      expect(result.current.recentGenerations).toEqual([]);
      expect(result.current.isLoadingGenerations).toBe(true);
    });

    it('should set loading state to false after initial load', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: [] }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });
    });

    it('should call loadGenerations on mount', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
          prompt: 'Test prompt 1',
          name: 'test-1',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations.length).toBe(1);
      });
    });
  });

  describe('loadGenerations - Success Cases', () => {
    it('should load generations successfully', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
          prompt: 'Test prompt 1',
          name: 'test-1',
          type: 'render',
        },
        {
          id: 'gen-2',
          url: 'https://example.com/image2.jpg',
          created_at: '2024-01-02T00:00:00Z',
          prompt: 'Test prompt 2',
          name: 'test-2',
          type: 'video',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations.length).toBe(2);
      });

      expect(result.current.recentGenerations[0].id).toBe('gen-1');
      expect(result.current.recentGenerations[1].id).toBe('gen-2');
    });

    it('should format generations correctly with url field', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
          prompt: 'Test prompt',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations[0].imageUrl).toBe(
          'https://example.com/image1.jpg'
        );
      });
    });

    it('should format generations correctly with image_url field', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          image_url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations[0].imageUrl).toBe(
          'https://example.com/image1.jpg'
        );
      });
    });

    it('should format generations correctly with imageUrl field', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          imageUrl: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations[0].imageUrl).toBe(
          'https://example.com/image1.jpg'
        );
      });
    });

    it('should parse timestamp correctly from created_at', async () => {
      const mockDate = '2024-01-01T12:30:00Z';
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: mockDate,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations[0].timestamp).toEqual(new Date(mockDate));
      });
    });

    it('should parse timestamp correctly from timestamp field', async () => {
      const mockDate = '2024-01-01T12:30:00Z';
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          timestamp: mockDate,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations[0].timestamp).toEqual(new Date(mockDate));
      });
    });

    it('should include all generation fields', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          thumbnail_url: 'https://example.com/thumb1.jpg',
          created_at: '2024-01-01T00:00:00Z',
          prompt: 'Test prompt',
          preset: 'modern',
          name: 'test-render',
          type: 'render',
          source_type: 'original',
          media_type: 'image',
          settings: { style: 'modern' },
          source_image: 'https://example.com/source.jpg',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        const gen = result.current.recentGenerations[0];
        expect(gen.id).toBe('gen-1');
        expect(gen.imageUrl).toBe('https://example.com/image1.jpg');
        expect(gen.thumbnailUrl).toBe('https://example.com/thumb1.jpg');
        expect(gen.prompt).toBe('Test prompt');
        expect(gen.preset).toBe('modern');
        expect(gen.name).toBe('test-render');
        expect(gen.type).toBe('render');
        expect(gen.sourceType).toBe('original');
        expect(gen.mediaType).toBe('image');
        expect(gen.settings).toEqual({ style: 'modern' });
        expect(gen.sourceImageUrl).toBe('https://example.com/source.jpg');
      });
    });

    it('should handle sourceType field variations', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
          source_type: 'from_render',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations[0].sourceType).toBe('from_render');
      });
    });

    it('should handle sourceImage field variations', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
          source_image_url: 'https://example.com/source.jpg',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations[0].sourceImageUrl).toBe(
          'https://example.com/source.jpg'
        );
      });
    });

    it('should log loading info', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: [] }),
      });

      renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(workflowLogger.info).toHaveBeenCalledWith(
          '[sketch-to-render] Loading generations for user:',
          { userId: 'test-user-id' }
        );
      });
    });

    it('should work with branding workflow type', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: [] }),
      });

      renderHook(() => useRecentGenerations('branding'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/branding/generations?userId=test-user-id'
        );
      });
    });
  });

  describe('loadGenerations - Error Cases', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });

      expect(workflowLogger.error).toHaveBeenCalledWith(
        '[sketch-to-render] Error loading generations:',
        expect.any(Error)
      );
    });

    it('should handle non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });

      expect(workflowLogger.error).toHaveBeenCalled();
    });

    it('should not update state when fetch fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });

      expect(result.current.recentGenerations).toEqual([]);
    });

    it('should handle empty generations array', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: [] }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations).toEqual([]);
      });
    });

    it('should handle null generations', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: null }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations).toEqual([]);
      });
    });

    it('should handle undefined generations', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations).toEqual([]);
      });
    });
  });

  describe('deleteGeneration', () => {
    it('should delete generation successfully', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'gen-2',
          url: 'https://example.com/image2.jpg',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ generations: mockGenerations }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations.length).toBe(2);
      });

      await act(async () => {
        await result.current.deleteGeneration('gen-1');
      });

      expect(result.current.recentGenerations.length).toBe(1);
      expect(result.current.recentGenerations[0].id).toBe('gen-2');
    });

    it('should call delete API with correct parameters', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ generations: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });

      await act(async () => {
        await result.current.deleteGeneration('gen-123');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/sketch-to-render/delete-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'test-user-id', id: 'gen-123' }),
      });
    });

    it('should log deletion info', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ generations: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });

      await act(async () => {
        await result.current.deleteGeneration('gen-123');
      });

      expect(workflowLogger.info).toHaveBeenCalledWith(
        '[sketch-to-render] Deleting generation:',
        { generationId: 'gen-123' }
      );
      expect(workflowLogger.info).toHaveBeenCalledWith(
        '[sketch-to-render] Generation deleted successfully'
      );
    });

    it('should handle delete errors', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ generations: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Internal Server Error',
        });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.deleteGeneration('gen-123');
        })
      ).rejects.toThrow();

      expect(workflowLogger.error).toHaveBeenCalled();
    });

    it('should not update state when delete fails', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ generations: mockGenerations }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations.length).toBe(1);
      });

      await expect(
        act(async () => {
          await result.current.deleteGeneration('gen-1');
        })
      ).rejects.toThrow();

      expect(result.current.recentGenerations.length).toBe(1);
    });
  });

  describe('setRecentGenerations', () => {
    it('should update generations with new array', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: [] }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });

      const newGenerations: Generation[] = [
        {
          id: 'new-1',
          imageUrl: 'https://example.com/new.jpg',
          timestamp: new Date(),
        },
      ];

      act(() => {
        result.current.setRecentGenerations(newGenerations);
      });

      expect(result.current.recentGenerations).toEqual(newGenerations);
    });

    it('should update generations with function', async () => {
      const mockGenerations = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ generations: mockGenerations }),
      });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations.length).toBe(1);
      });

      act(() => {
        result.current.setRecentGenerations((prev) => [
          {
            id: 'new-1',
            imageUrl: 'https://example.com/new.jpg',
            timestamp: new Date(),
          },
          ...prev,
        ]);
      });

      expect(result.current.recentGenerations.length).toBe(2);
      expect(result.current.recentGenerations[0].id).toBe('new-1');
    });
  });

  describe('refreshGenerations', () => {
    it('should refresh generations', async () => {
      const mockGenerations1 = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockGenerations2 = [
        {
          id: 'gen-1',
          url: 'https://example.com/image1.jpg',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'gen-2',
          url: 'https://example.com/image2.jpg',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ generations: mockGenerations1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ generations: mockGenerations2 }),
        });

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.recentGenerations.length).toBe(1);
      });

      await act(async () => {
        await result.current.refreshGenerations();
      });

      await waitFor(() => {
        expect(result.current.recentGenerations.length).toBe(2);
      });
    });

    it('should set loading state during refresh', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ generations: [] }),
        })
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ generations: [] }),
                });
              }, 100);
            })
        );

      const { result } = renderHook(() => useRecentGenerations('sketch-to-render'));

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });

      act(() => {
        result.current.refreshGenerations();
      });

      expect(result.current.isLoadingGenerations).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingGenerations).toBe(false);
      });
    });
  });
});
