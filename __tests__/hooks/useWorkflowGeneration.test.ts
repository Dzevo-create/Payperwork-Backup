/**
 * Workflow Generation Hook Utilities Tests
 * Tests shared generation state management and utilities
 */

import { renderHook, act } from '@testing-library/react';
import {
  useGenerationState,
  validateGenerationInputs,
  extractBase64Data,
  buildGenerationPayload,
  makeGenerationRequest,
} from '@/hooks/workflows/common/useWorkflowGeneration';

describe('useGenerationState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGenerationState());

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.currentResult).toBeNull();
  });

  it('should start generation correctly', () => {
    const { result } = renderHook(() => useGenerationState());

    act(() => {
      result.current.startGeneration();
    });

    expect(result.current.isGenerating).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.currentResult).toBeNull();
  });

  it('should finish generation correctly', () => {
    const { result } = renderHook(() => useGenerationState());

    act(() => {
      result.current.startGeneration();
    });

    act(() => {
      result.current.finishGeneration();
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it('should set generation error correctly', () => {
    const { result } = renderHook(() => useGenerationState());

    act(() => {
      result.current.startGeneration();
    });

    act(() => {
      result.current.setGenerationError('Test error message');
    });

    expect(result.current.error).toBe('Test error message');
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useGenerationState());

    act(() => {
      result.current.startGeneration();
      result.current.setProgress(50);
    });

    act(() => {
      result.current.resetState();
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it('should update progress', () => {
    const { result } = renderHook(() => useGenerationState());

    act(() => {
      result.current.setProgress(50);
    });

    expect(result.current.progress).toBe(50);

    act(() => {
      result.current.setProgress(75);
    });

    expect(result.current.progress).toBe(75);
  });

  it('should set current result', () => {
    const { result } = renderHook(() => useGenerationState());

    const mockResult = {
      id: 'test-id',
      imageUrl: 'https://example.com/image.jpg',
      timestamp: new Date(),
    };

    act(() => {
      result.current.setCurrentResult(mockResult);
    });

    expect(result.current.currentResult).toEqual(mockResult);
  });
});

describe('validateGenerationInputs', () => {
  it('should return true for valid inputs', () => {
    const sourceImage = {
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      preview: 'data:image/jpeg;base64,test123',
    };

    const result = validateGenerationInputs('Test prompt', sourceImage);

    expect(result).toBe(true);
  });

  it('should return false when source image file is missing', () => {
    const onError = jest.fn();
    const sourceImage = {
      file: null,
      preview: 'data:image/jpeg;base64,test123',
    };

    const result = validateGenerationInputs('Test prompt', sourceImage, onError);

    expect(result).toBe(false);
    expect(onError).toHaveBeenCalledWith('Ausgangsbild ist erforderlich');
  });

  it('should return false when source image preview is missing', () => {
    const onError = jest.fn();
    const sourceImage = {
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      preview: null,
    };

    const result = validateGenerationInputs('Test prompt', sourceImage, onError);

    expect(result).toBe(false);
    expect(onError).toHaveBeenCalledWith('Ausgangsbild ist erforderlich');
  });

  it('should return false when prompt is empty', () => {
    const onError = jest.fn();
    const sourceImage = {
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      preview: 'data:image/jpeg;base64,test123',
    };

    const result = validateGenerationInputs('', sourceImage, onError);

    expect(result).toBe(false);
    expect(onError).toHaveBeenCalledWith('Prompt ist erforderlich');
  });

  it('should return false when prompt is whitespace only', () => {
    const onError = jest.fn();
    const sourceImage = {
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      preview: 'data:image/jpeg;base64,test123',
    };

    const result = validateGenerationInputs('   ', sourceImage, onError);

    expect(result).toBe(false);
    expect(onError).toHaveBeenCalledWith('Prompt ist erforderlich');
  });

  it('should work without onError callback', () => {
    const sourceImage = {
      file: null,
      preview: null,
    };

    const result = validateGenerationInputs('prompt', sourceImage);

    expect(result).toBe(false);
  });
});

describe('extractBase64Data', () => {
  it('should extract base64 and mimeType from valid preview', () => {
    const preview = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';

    const result = extractBase64Data(preview);

    expect(result.base64).toBe('iVBORw0KGgoAAAANSUhEUgAAAAUA');
    expect(result.mimeType).toBe('image/png');
  });

  it('should handle different image formats', () => {
    const formats = [
      { preview: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', expected: 'image/jpeg' },
      { preview: 'data:image/webp;base64,UklGRiQAAABXRUJQ', expected: 'image/webp' },
      { preview: 'data:image/gif;base64,R0lGODlhAQABAIAA', expected: 'image/gif' },
    ];

    formats.forEach(({ preview, expected }) => {
      const result = extractBase64Data(preview);
      expect(result.mimeType).toBe(expected);
    });
  });

  it('should throw error for invalid preview format', () => {
    const invalidPreview = 'invalid-data-string';

    expect(() => extractBase64Data(invalidPreview)).toThrow(
      'Invalid preview data: Failed to extract base64'
    );
  });

  it('should throw error when mimeType is missing', () => {
    const invalidPreview = 'base64,somedata';

    expect(() => extractBase64Data(invalidPreview)).toThrow(
      'Invalid preview data: Failed to extract mimeType'
    );
  });
});

describe('buildGenerationPayload', () => {
  it('should build payload with all fields', () => {
    const sourceImage = {
      file: new File(['test'], 'source.jpg', { type: 'image/jpeg' }),
      preview: 'data:image/jpeg;base64,sourceData123',
    };

    const referenceImage = {
      file: new File(['ref'], 'reference.jpg', { type: 'image/jpeg' }),
      preview: 'data:image/png;base64,refData456',
    };

    const settings = {
      style: 'modern',
      lighting: 'natural',
    };

    const result = buildGenerationPayload(
      'Test prompt',
      sourceImage,
      settings,
      referenceImage
    );

    expect(result).toEqual({
      prompt: 'Test prompt',
      sourceImage: {
        data: 'sourceData123',
        mimeType: 'image/jpeg',
      },
      referenceImage: {
        data: 'refData456',
        mimeType: 'image/png',
      },
      settings,
    });
  });

  it('should build payload without reference image', () => {
    const sourceImage = {
      file: new File(['test'], 'source.jpg', { type: 'image/jpeg' }),
      preview: 'data:image/jpeg;base64,sourceData123',
    };

    const settings = {
      style: 'modern',
    };

    const result = buildGenerationPayload('Test prompt', sourceImage, settings);

    expect(result).toEqual({
      prompt: 'Test prompt',
      sourceImage: {
        data: 'sourceData123',
        mimeType: 'image/jpeg',
      },
      settings,
    });
    expect(result).not.toHaveProperty('referenceImage');
  });

  it('should trim prompt whitespace', () => {
    const sourceImage = {
      file: new File(['test'], 'source.jpg', { type: 'image/jpeg' }),
      preview: 'data:image/jpeg;base64,data123',
    };

    const result = buildGenerationPayload('  Test prompt  ', sourceImage, {});

    expect(result.prompt).toBe('Test prompt');
  });

  it('should not include reference image if file is missing', () => {
    const sourceImage = {
      file: new File(['test'], 'source.jpg', { type: 'image/jpeg' }),
      preview: 'data:image/jpeg;base64,data123',
    };

    const referenceImage = {
      file: null,
      preview: 'data:image/jpeg;base64,refData',
    };

    const result = buildGenerationPayload('Prompt', sourceImage, {}, referenceImage);

    expect(result).not.toHaveProperty('referenceImage');
  });
});

describe('makeGenerationRequest', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should make successful request and update progress', async () => {
    const mockResponse = {
      image: { data: 'base64-data', mimeType: 'image/png' },
      metadata: {},
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const setProgress = jest.fn();
    const payload = { prompt: 'test', sourceImage: {} };

    const result = await makeGenerationRequest('/api/test', payload, setProgress);

    expect(result).toEqual(mockResponse);
    expect(setProgress).toHaveBeenCalledWith(20);
    expect(setProgress).toHaveBeenCalledWith(40);
    expect(setProgress).toHaveBeenCalledWith(90);
  });

  it('should throw error when response is not ok', async () => {
    const errorData = { error: 'Generation failed' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(errorData),
    });

    const setProgress = jest.fn();
    const payload = { prompt: 'test' };

    await expect(makeGenerationRequest('/api/test', payload, setProgress)).rejects.toThrow(
      'Generation failed'
    );
  });

  it('should use default error message if not provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const setProgress = jest.fn();

    await expect(makeGenerationRequest('/api/test', {}, setProgress)).rejects.toThrow(
      'Fehler bei der Generierung'
    );
  });

  it('should send correct request headers and body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const payload = { prompt: 'test', sourceImage: { data: 'base64' } };
    const setProgress = jest.fn();

    await makeGenerationRequest('/api/generate', payload, setProgress);

    expect(global.fetch).toHaveBeenCalledWith('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });
});
