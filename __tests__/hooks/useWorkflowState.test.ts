/**
 * useWorkflowState Hook Tests
 * Tests workflow state management functionality
 */

import { renderHook, act } from '@testing-library/react';
import { useWorkflowState } from '@/hooks/workflows/common/useWorkflowState';

describe('useWorkflowState', () => {
  const defaultSettings = {
    style: 'modern',
    lighting: 'natural',
    quality: 'high',
  };

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      expect(result.current.prompt).toBe('');
      expect(result.current.settings).toEqual(defaultSettings);
      expect(result.current.resultImage).toBeNull();
      expect(result.current.resultMediaType).toBe('image');
      expect(result.current.originalPrompt).toBe('');
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBe(0);
    });

    it('should initialize inputData with empty values', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      expect(result.current.inputData.sourceImage).toEqual({
        file: null,
        preview: null,
        originalPreview: null,
      });
      expect(result.current.inputData.referenceImages).toEqual([]);
    });

    it('should use provided default settings', () => {
      const customSettings = {
        custom: 'value',
        another: 'setting',
      };

      const { result } = renderHook(() => useWorkflowState(customSettings));

      expect(result.current.settings).toEqual(customSettings);
    });
  });

  describe('Prompt Management', () => {
    it('should update prompt', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setPrompt('New prompt text');
      });

      expect(result.current.prompt).toBe('New prompt text');
    });

    it('should update prompt multiple times', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setPrompt('First prompt');
      });
      expect(result.current.prompt).toBe('First prompt');

      act(() => {
        result.current.setPrompt('Second prompt');
      });
      expect(result.current.prompt).toBe('Second prompt');
    });

    it('should clear prompt', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setPrompt('Some text');
      });
      expect(result.current.prompt).toBe('Some text');

      act(() => {
        result.current.setPrompt('');
      });
      expect(result.current.prompt).toBe('');
    });

    it('should handle empty prompt', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setPrompt('');
      });

      expect(result.current.prompt).toBe('');
    });
  });

  describe('Settings Management', () => {
    it('should update settings with object', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      const newSettings = {
        style: 'futuristic',
        lighting: 'dramatic',
        quality: 'ultra',
      };

      act(() => {
        result.current.setSettings(newSettings);
      });

      expect(result.current.settings).toEqual(newSettings);
    });

    it('should update settings with function', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setSettings((prev) => ({
          ...prev,
          style: 'updated',
        }));
      });

      expect(result.current.settings).toEqual({
        style: 'updated',
        lighting: 'natural',
        quality: 'high',
      });
    });

    it('should handle partial settings update', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setSettings((prev) => ({
          ...prev,
          lighting: 'sunset',
        }));
      });

      expect(result.current.settings.style).toBe('modern');
      expect(result.current.settings.lighting).toBe('sunset');
      expect(result.current.settings.quality).toBe('high');
    });

    it('should handle complex settings object', () => {
      const complexSettings = {
        style: 'modern',
        nested: {
          value: 'test',
          array: [1, 2, 3],
        },
      };

      const { result } = renderHook(() => useWorkflowState(complexSettings));

      const newSettings = {
        style: 'updated',
        nested: {
          value: 'changed',
          array: [4, 5, 6],
        },
      };

      act(() => {
        result.current.setSettings(newSettings);
      });

      expect(result.current.settings).toEqual(newSettings);
    });
  });

  describe('Input Data Management', () => {
    it('should update input data with object', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      const newInputData = {
        sourceImage: {
          file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
          preview: 'data:image/jpeg;base64,test',
          originalPreview: null,
        },
        referenceImages: [],
      };

      act(() => {
        result.current.setInputData(newInputData);
      });

      expect(result.current.inputData).toEqual(newInputData);
    });

    it('should update input data with function', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      const sourceFile = new File(['source'], 'source.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.setInputData((prev) => ({
          ...prev,
          sourceImage: {
            file: sourceFile,
            preview: 'data:image/jpeg;base64,source',
            originalPreview: null,
          },
        }));
      });

      expect(result.current.inputData.sourceImage.file).toBe(sourceFile);
      expect(result.current.inputData.sourceImage.preview).toBe('data:image/jpeg;base64,source');
    });

    it('should update reference images', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      const refImage = {
        file: new File(['ref'], 'ref.jpg', { type: 'image/jpeg' }),
        preview: 'data:image/jpeg;base64,ref',
        originalPreview: null,
      };

      act(() => {
        result.current.setInputData((prev) => ({
          ...prev,
          referenceImages: [refImage],
        }));
      });

      expect(result.current.inputData.referenceImages).toHaveLength(1);
      expect(result.current.inputData.referenceImages[0]).toBe(refImage);
    });

    it('should update multiple reference images', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      const refImages = [
        {
          file: new File(['ref1'], 'ref1.jpg', { type: 'image/jpeg' }),
          preview: 'data:image/jpeg;base64,ref1',
          originalPreview: null,
        },
        {
          file: new File(['ref2'], 'ref2.jpg', { type: 'image/jpeg' }),
          preview: 'data:image/jpeg;base64,ref2',
          originalPreview: null,
        },
      ];

      act(() => {
        result.current.setInputData((prev) => ({
          ...prev,
          referenceImages: refImages,
        }));
      });

      expect(result.current.inputData.referenceImages).toHaveLength(2);
    });

    it('should preserve originalPreview when updating preview', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      const originalFile = new File(['original'], 'original.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.setInputData({
          sourceImage: {
            file: originalFile,
            preview: 'original-preview',
            originalPreview: null,
          },
          referenceImages: [],
        });
      });

      act(() => {
        result.current.setInputData((prev) => ({
          ...prev,
          sourceImage: {
            ...prev.sourceImage,
            preview: 'cropped-preview',
            originalPreview: prev.sourceImage.originalPreview || prev.sourceImage.preview,
          },
        }));
      });

      expect(result.current.inputData.sourceImage.preview).toBe('cropped-preview');
      expect(result.current.inputData.sourceImage.originalPreview).toBe('original-preview');
    });
  });

  describe('Result Management', () => {
    it('should update result image', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setResultImage('https://example.com/result.jpg');
      });

      expect(result.current.resultImage).toBe('https://example.com/result.jpg');
    });

    it('should clear result image', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setResultImage('https://example.com/result.jpg');
      });
      expect(result.current.resultImage).toBe('https://example.com/result.jpg');

      act(() => {
        result.current.setResultImage(null);
      });
      expect(result.current.resultImage).toBeNull();
    });

    it('should update result media type', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setResultMediaType('video');
      });

      expect(result.current.resultMediaType).toBe('video');
    });

    it('should switch between image and video', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setResultMediaType('video');
      });
      expect(result.current.resultMediaType).toBe('video');

      act(() => {
        result.current.setResultMediaType('image');
      });
      expect(result.current.resultMediaType).toBe('image');
    });

    it('should update original prompt', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setOriginalPrompt('Original prompt text');
      });

      expect(result.current.originalPrompt).toBe('Original prompt text');
    });
  });

  describe('Generation State Management', () => {
    it('should update isGenerating', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setIsGenerating(true);
      });

      expect(result.current.isGenerating).toBe(true);

      act(() => {
        result.current.setIsGenerating(false);
      });

      expect(result.current.isGenerating).toBe(false);
    });

    it('should update progress', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setProgress(50);
      });

      expect(result.current.progress).toBe(50);

      act(() => {
        result.current.setProgress(100);
      });

      expect(result.current.progress).toBe(100);
    });

    it('should handle progress from 0 to 100', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      for (let i = 0; i <= 100; i += 10) {
        act(() => {
          result.current.setProgress(i);
        });
        expect(result.current.progress).toBe(i);
      }
    });
  });

  describe('Reset State', () => {
    it('should reset all state to defaults', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      // Set all values
      act(() => {
        result.current.setPrompt('Test prompt');
        result.current.setSettings({ style: 'changed', lighting: 'changed', quality: 'changed' });
        result.current.setInputData({
          sourceImage: {
            file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
            preview: 'data:image/jpeg;base64,test',
            originalPreview: null,
          },
          referenceImages: [],
        });
        result.current.setResultImage('https://example.com/result.jpg');
        result.current.setResultMediaType('video');
        result.current.setOriginalPrompt('Original');
        result.current.setIsGenerating(true);
        result.current.setProgress(75);
      });

      // Reset
      act(() => {
        result.current.resetState();
      });

      // Verify all reset
      expect(result.current.prompt).toBe('');
      expect(result.current.settings).toEqual(defaultSettings);
      expect(result.current.inputData.sourceImage.file).toBeNull();
      expect(result.current.inputData.sourceImage.preview).toBeNull();
      expect(result.current.inputData.referenceImages).toEqual([]);
      expect(result.current.resultImage).toBeNull();
      expect(result.current.resultMediaType).toBe('image');
      expect(result.current.originalPrompt).toBe('');
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBe(0);
    });

    it('should reset to provided default settings', () => {
      const customDefaults = {
        custom: 'default',
        value: 123,
      };

      const { result } = renderHook(() => useWorkflowState(customDefaults));

      act(() => {
        result.current.setSettings({ custom: 'changed', value: 456 });
      });

      act(() => {
        result.current.resetState();
      });

      expect(result.current.settings).toEqual(customDefaults);
    });

    it('should be callable multiple times', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setPrompt('First');
        result.current.resetState();
      });

      expect(result.current.prompt).toBe('');

      act(() => {
        result.current.setPrompt('Second');
        result.current.resetState();
      });

      expect(result.current.prompt).toBe('');
    });
  });

  describe('Complex State Updates', () => {
    it('should handle multiple simultaneous updates', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setPrompt('Test prompt');
        result.current.setSettings({ style: 'updated', lighting: 'updated', quality: 'updated' });
        result.current.setIsGenerating(true);
        result.current.setProgress(50);
      });

      expect(result.current.prompt).toBe('Test prompt');
      expect(result.current.settings.style).toBe('updated');
      expect(result.current.isGenerating).toBe(true);
      expect(result.current.progress).toBe(50);
    });

    it('should handle workflow complete state', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      // Start generation
      act(() => {
        result.current.setPrompt('Generate image');
        result.current.setIsGenerating(true);
        result.current.setProgress(0);
      });

      // Progress
      act(() => {
        result.current.setProgress(50);
      });

      // Complete
      act(() => {
        result.current.setProgress(100);
        result.current.setResultImage('https://example.com/result.jpg');
        result.current.setIsGenerating(false);
        result.current.setOriginalPrompt('Generate image');
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.progress).toBe(100);
      expect(result.current.resultImage).toBe('https://example.com/result.jpg');
      expect(result.current.originalPrompt).toBe('Generate image');
    });

    it('should handle edit workflow state', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      // Initial generation result
      act(() => {
        result.current.setResultImage('https://example.com/original.jpg');
        result.current.setOriginalPrompt('Original prompt');
      });

      // Edit
      act(() => {
        result.current.setPrompt('Edit changes');
        result.current.setIsGenerating(true);
      });

      // Edit complete
      act(() => {
        result.current.setResultImage('https://example.com/edited.jpg');
        result.current.setIsGenerating(false);
        result.current.setPrompt('');
      });

      expect(result.current.resultImage).toBe('https://example.com/edited.jpg');
      expect(result.current.originalPrompt).toBe('Original prompt');
      expect(result.current.prompt).toBe('');
    });
  });

  describe('Type Safety', () => {
    it('should maintain settings type consistency', () => {
      interface CustomSettings {
        customField: string;
        numericField: number;
        booleanField: boolean;
      }

      const customSettings: CustomSettings = {
        customField: 'test',
        numericField: 42,
        booleanField: true,
      };

      const { result } = renderHook(() => useWorkflowState<CustomSettings>(customSettings));

      expect(result.current.settings.customField).toBe('test');
      expect(result.current.settings.numericField).toBe(42);
      expect(result.current.settings.booleanField).toBe(true);

      act(() => {
        result.current.setSettings({
          customField: 'updated',
          numericField: 100,
          booleanField: false,
        });
      });

      expect(result.current.settings.customField).toBe('updated');
      expect(result.current.settings.numericField).toBe(100);
      expect(result.current.settings.booleanField).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string prompts', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setPrompt('   ');
      });

      expect(result.current.prompt).toBe('   ');
    });

    it('should handle very long prompts', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      const longPrompt = 'a'.repeat(10000);

      act(() => {
        result.current.setPrompt(longPrompt);
      });

      expect(result.current.prompt).toBe(longPrompt);
      expect(result.current.prompt.length).toBe(10000);
    });

    it('should handle special characters in prompts', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      const specialPrompt = '!@#$%^&*()_+{}[]|\\:";\'<>?,./~`';

      act(() => {
        result.current.setPrompt(specialPrompt);
      });

      expect(result.current.prompt).toBe(specialPrompt);
    });

    it('should handle unicode in prompts', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      const unicodePrompt = '测试 🎨 тест مرحبا';

      act(() => {
        result.current.setPrompt(unicodePrompt);
      });

      expect(result.current.prompt).toBe(unicodePrompt);
    });

    it('should handle progress values outside 0-100', () => {
      const { result } = renderHook(() => useWorkflowState(defaultSettings));

      act(() => {
        result.current.setProgress(-10);
      });
      expect(result.current.progress).toBe(-10);

      act(() => {
        result.current.setProgress(150);
      });
      expect(result.current.progress).toBe(150);
    });
  });
});
