/**
 * useWorkflowHandlers Hook Tests
 * Tests workflow action handlers functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkflowHandlers, type WorkflowHandlersConfig } from '@/hooks/workflows/common/useWorkflowHandlers';
import { useWorkflowState, type WorkflowState } from '@/hooks/workflows/common/useWorkflowState';
import type { Generation } from '@/hooks/workflows/common/useRecentGenerations';
import { workflowLogger } from '@/lib/logger';
import { getUserIdSync } from '@/lib/supabase/insert-helper';
import { uploadBase64Image, uploadFile } from '@/lib/supabase-library';

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

jest.mock('@/lib/supabase-library', () => ({
  uploadBase64Image: jest.fn(),
  uploadFile: jest.fn(),
}));

describe('useWorkflowHandlers', () => {
  let mockConfig: WorkflowHandlersConfig;
  let mockWorkflowState: WorkflowState<any>;
  let mockSetRecentGenerations: ReturnType<typeof jest.fn>;
  let mockSetCurrentSourceImage: ReturnType<typeof jest.fn>;
  let mockSetRenderName: ReturnType<typeof jest.fn>;
  let mockSetIsGeneratingVideo: ReturnType<typeof jest.fn>;
  let defaultSettings: any;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
    global.alert = jest.fn();
    global.scrollTo = jest.fn();

    // Create URL mock
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    mockConfig = {
      apiEndpoint: 'sketch-to-render',
      workflowName: 'Sketch to Render',
      generateFilename: jest.fn(() => 'test-render-123'),
    };

    mockSetRecentGenerations = jest.fn();
    mockSetCurrentSourceImage = jest.fn();
    mockSetRenderName = jest.fn();
    mockSetIsGeneratingVideo = jest.fn();

    defaultSettings = {
      style: 'modern',
      lighting: 'natural',
    };

    // Create mock workflow state
    const { result } = renderHook(() => useWorkflowState(defaultSettings));
    mockWorkflowState = result.current;

    // Set up some initial state
    act(() => {
      mockWorkflowState.setInputData({
        sourceImage: {
          file: new File(['test'], 'source.jpg', { type: 'image/jpeg' }),
          preview: 'data:image/jpeg;base64,sourceData123',
          originalPreview: null,
        },
        referenceImages: [],
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveGenerationToDb', () => {
    it('should save generation successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.saveGenerationToDb({
          url: 'https://example.com/image.jpg',
          type: 'render',
          name: 'test-render',
          prompt: 'Test prompt',
          sourceType: 'original',
          settings: { style: 'modern' },
        });
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/sketch-to-render/save-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('test-render'),
      });
    });

    it('should include userId in save request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.saveGenerationToDb({
          url: 'https://example.com/image.jpg',
          type: 'render',
          name: 'test-render',
        });
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.userId).toBe('test-user-id');
    });

    it('should handle save errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to save' }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.saveGenerationToDb({
          url: 'https://example.com/image.jpg',
          type: 'render',
          name: 'test-render',
        });
      });

      expect(workflowLogger.error).toHaveBeenCalled();
    });

    it('should save video type correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.saveGenerationToDb({
          url: 'https://example.com/video.mp4',
          type: 'video',
          name: 'test-video',
        });
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.type).toBe('video');
      expect(body.model).toBe('runway-gen4-turbo');
    });

    it('should save upscale type correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.saveGenerationToDb({
          url: 'https://example.com/upscaled.jpg',
          type: 'upscale',
          name: 'test-upscale',
        });
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.type).toBe('upscale');
    });
  });

  describe('handleGenerateSuccess', () => {
    it('should handle generate success', async () => {
      (uploadBase64Image as any).mockResolvedValue('https://storage.com/uploaded.jpg');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleGenerateSuccess({
          imageUrl: 'data:image/jpeg;base64,resultData',
          id: 'gen-123',
          timestamp: new Date(),
          prompt: 'Test prompt',
        });
      });

      expect(uploadBase64Image).toHaveBeenCalled();
      expect(mockSetRecentGenerations).toHaveBeenCalled();
      expect(mockSetRenderName).toHaveBeenCalledWith('test-render-123');
    });

    it('should upload result and source images', async () => {
      (uploadBase64Image as any).mockResolvedValue('https://storage.com/uploaded.jpg');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleGenerateSuccess({
          imageUrl: 'data:image/jpeg;base64,resultData',
          prompt: 'Test prompt',
        });
      });

      expect(uploadBase64Image).toHaveBeenCalledTimes(2);
      expect(uploadBase64Image).toHaveBeenCalledWith(
        'data:image/jpeg;base64,resultData',
        expect.stringContaining('-result.jpg')
      );
      expect(uploadBase64Image).toHaveBeenCalledWith(
        'data:image/jpeg;base64,sourceData123',
        expect.stringContaining('-source.jpg')
      );
    });

    it('should reset prompt after generation', async () => {
      (uploadBase64Image as any).mockResolvedValue('https://storage.com/uploaded.jpg');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      // Set a prompt
      act(() => {
        mockWorkflowState.setPrompt('Test prompt');
      });

      await act(async () => {
        await result.current.handleGenerateSuccess({
          imageUrl: 'data:image/jpeg;base64,resultData',
          prompt: 'Test prompt',
        });
      });

      expect(mockWorkflowState.prompt).toBe('');
    });

    it('should reset settings to default after generation', async () => {
      (uploadBase64Image as any).mockResolvedValue('https://storage.com/uploaded.jpg');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      // Change settings
      act(() => {
        mockWorkflowState.setSettings({ style: 'futuristic', lighting: 'dramatic' });
      });

      await act(async () => {
        await result.current.handleGenerateSuccess({
          imageUrl: 'data:image/jpeg;base64,resultData',
          prompt: 'Test prompt',
        });
      });

      await waitFor(() => {
        expect(mockWorkflowState.settings).toEqual(defaultSettings);
      });
    });

    it('should add generation to recent list', async () => {
      (uploadBase64Image as any).mockResolvedValue('https://storage.com/uploaded.jpg');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleGenerateSuccess({
          imageUrl: 'data:image/jpeg;base64,resultData',
          id: 'gen-123',
          prompt: 'Test prompt',
        });
      });

      expect(mockSetRecentGenerations).toHaveBeenCalledWith(expect.any(Function));

      // Test the function passed to setRecentGenerations
      const setterFn = mockSetRecentGenerations.mock.calls[0][0];
      const newGenerations = setterFn([]);
      expect(newGenerations[0].id).toBe('gen-123');
      expect(newGenerations[0].type).toBe('render');
    });

    it('should handle upload errors gracefully', async () => {
      (uploadBase64Image as any).mockRejectedValue(new Error('Upload failed'));
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleGenerateSuccess({
          imageUrl: 'data:image/jpeg;base64,resultData',
          prompt: 'Test prompt',
        });
      });

      expect(workflowLogger.error).toHaveBeenCalledWith(
        '[Upload] Error uploading images:',
        expect.any(Error)
      );
    });
  });

  describe('handleEditSuccess', () => {
    it('should handle edit success', async () => {
      (uploadBase64Image as any).mockResolvedValue('https://storage.com/edited.jpg');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      // Set result image first
      act(() => {
        mockWorkflowState.setResultImage('https://example.com/previous.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleEditSuccess('data:image/jpeg;base64,editedData');
      });

      expect(uploadBase64Image).toHaveBeenCalled();
      expect(mockSetRecentGenerations).toHaveBeenCalled();
    });

    it('should add edited generation with from_render sourceType', async () => {
      (uploadBase64Image as any).mockResolvedValue('https://storage.com/edited.jpg');
      (uploadFile as any).mockResolvedValue('https://storage.com/previous.jpg');
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test'])),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      act(() => {
        mockWorkflowState.setResultImage('https://example.com/previous.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleEditSuccess('data:image/jpeg;base64,editedData');
      });

      const setterFn = mockSetRecentGenerations.mock.calls[0][0];
      const newGenerations = setterFn([]);
      expect(newGenerations[0].sourceType).toBe('from_render');
    });
  });

  describe('handleUpscaleSuccess', () => {
    it('should handle upscale success', async () => {
      (uploadFile as any).mockResolvedValue('https://storage.com/upscaled.jpg');
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['upscaled'])),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      act(() => {
        mockWorkflowState.setResultImage('https://example.com/previous.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleUpscaleSuccess('https://freepik.com/upscaled.jpg');
      });

      expect(uploadFile).toHaveBeenCalled();
      expect(mockSetRecentGenerations).toHaveBeenCalled();
      expect(global.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('should set media type to image after upscale', async () => {
      (uploadFile as any).mockResolvedValue('https://storage.com/upscaled.jpg');
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['upscaled'])),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      act(() => {
        mockWorkflowState.setResultImage('https://example.com/video.mp4');
        mockWorkflowState.setResultMediaType('video');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleUpscaleSuccess('https://freepik.com/upscaled.jpg');
      });

      expect(mockWorkflowState.resultMediaType).toBe('image');
    });

    it('should add upscale generation with correct type', async () => {
      (uploadFile as any).mockResolvedValue('https://storage.com/upscaled.jpg');
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(new Blob(['upscaled'])),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      act(() => {
        mockWorkflowState.setResultImage('https://example.com/previous.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleUpscaleSuccess('https://freepik.com/upscaled.jpg');
      });

      const setterFn = mockSetRecentGenerations.mock.calls[0][0];
      const newGenerations = setterFn([]);
      expect(newGenerations[0].type).toBe('upscale');
    });
  });

  describe('handleDownload', () => {
    it('should download image successfully', async () => {
      const mockLink = {
        click: jest.fn(),
        setAttribute: jest.fn(),
      };
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['image-data'])),
      });

      act(() => {
        mockWorkflowState.setResultImage('https://example.com/image.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleDownload();
      });

      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should download with custom filename', async () => {
      const mockLink = {
        click: jest.fn(),
        setAttribute: jest.fn(),
        href: '',
        download: '',
      };
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['image-data'])),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleDownload(
          'https://example.com/image.jpg',
          'custom-name.jpg',
          'image'
        );
      });

      expect(mockLink.download).toBe('custom-name.jpg');
    });

    it('should handle download errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Download failed'));

      act(() => {
        mockWorkflowState.setResultImage('https://example.com/image.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleDownload();
      });

      expect(workflowLogger.error).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(
        'Download fehlgeschlagen. Bitte versuche es erneut.'
      );
    });

    it('should download video with correct extension', async () => {
      const mockLink = {
        click: jest.fn(),
        setAttribute: jest.fn(),
        href: '',
        download: '',
      };
      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['video-data'], { type: 'video/mp4' })),
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleDownload(
          'https://example.com/video.mp4',
          undefined,
          'video'
        );
      });

      expect(mockLink.download).toContain('.mp4');
    });

    it('should handle invalid URL gracefully', async () => {
      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleDownload(undefined, undefined, 'image');
      });

      expect(workflowLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleCreateVideo', () => {
    it('should create video successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            videoUrl: 'https://example.com/video.mp4',
            taskId: 'task-123',
          }),
      });

      act(() => {
        mockWorkflowState.setResultImage('https://example.com/image.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleCreateVideo('Camera pans left slowly', 5);
      });

      expect(mockSetIsGeneratingVideo).toHaveBeenCalledWith(true);
      expect(mockSetIsGeneratingVideo).toHaveBeenCalledWith(false);
      expect(global.alert).toHaveBeenCalledWith('Video erfolgreich erstellt! ✨');
    });

    it('should not create video without result image', async () => {
      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleCreateVideo('Camera pans left');
      });

      expect(global.alert).toHaveBeenCalledWith('Kein Bild zum Verarbeiten vorhanden');
    });

    it('should not create video without prompt', async () => {
      act(() => {
        mockWorkflowState.setResultImage('https://example.com/image.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleCreateVideo('');
      });

      expect(global.alert).toHaveBeenCalledWith('Bitte gib einen Video-Prompt ein');
    });

    it('should detect camera movement from prompt', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            videoUrl: 'https://example.com/video.mp4',
            taskId: 'task-123',
          }),
      });

      act(() => {
        mockWorkflowState.setResultImage('https://example.com/image.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleCreateVideo('Camera orbits right around the subject');
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.cameraMovement).toBe('orbit right');
    });

    it('should handle video creation errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Video creation failed' }),
      });

      act(() => {
        mockWorkflowState.setResultImage('https://example.com/image.jpg');
      });

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      await act(async () => {
        await result.current.handleCreateVideo('Test video prompt');
      });

      expect(workflowLogger.error).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Video-Generierung fehlgeschlagen')
      );
    });
  });

  describe('handleLoadForEdit', () => {
    it('should load generation for editing', () => {
      const mockGeneration: Generation = {
        id: 'gen-123',
        imageUrl: 'https://example.com/image.jpg',
        timestamp: new Date(),
        prompt: 'Test prompt',
        name: 'test-render',
        type: 'render',
      };

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      act(() => {
        result.current.handleLoadForEdit(mockGeneration);
      });

      expect(mockWorkflowState.resultImage).toBe('https://example.com/image.jpg');
      expect(mockSetRenderName).toHaveBeenCalledWith('test-render');
      expect(mockWorkflowState.originalPrompt).toBe('Test prompt');
      expect(global.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('should handle video generation for editing', () => {
      const mockGeneration: Generation = {
        id: 'gen-123',
        imageUrl: 'https://example.com/video.mp4',
        timestamp: new Date(),
        prompt: 'Test video',
        name: 'test-video',
        type: 'video',
      };

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      act(() => {
        result.current.handleLoadForEdit(mockGeneration);
      });

      expect(mockWorkflowState.resultMediaType).toBe('video');
    });
  });

  describe('handleLoadForVideo', () => {
    it('should load generation for video creation', () => {
      const mockGeneration: Generation = {
        id: 'gen-123',
        imageUrl: 'https://example.com/image.jpg',
        timestamp: new Date(),
        prompt: 'Test prompt',
        name: 'test-render',
        type: 'render',
      };

      const { result } = renderHook(() =>
        useWorkflowHandlers(
          mockConfig,
          mockWorkflowState,
          mockSetRecentGenerations,
          null,
          mockSetCurrentSourceImage,
          'test-render',
          mockSetRenderName,
          mockSetIsGeneratingVideo,
          defaultSettings
        )
      );

      act(() => {
        result.current.handleLoadForVideo(mockGeneration);
      });

      expect(mockWorkflowState.resultImage).toBe('https://example.com/image.jpg');
      expect(mockSetRenderName).toHaveBeenCalledWith('test-render');
      expect(global.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });
});
