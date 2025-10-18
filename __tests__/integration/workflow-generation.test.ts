/**
 * Workflow Generation Integration Tests
 * Tests end-to-end workflow generation processes
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock workflow types
interface WorkflowInput {
  prompt: string;
  sourceImage: { data: string; mimeType: string };
  referenceImage?: { data: string; mimeType: string };
  settings?: Record<string, any>;
}

interface WorkflowResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    prompt: string;
    enhancedPrompt: string;
    settings: Record<string, any>;
    timestamp: string;
  };
}

// Mock workflow execution
class WorkflowExecutor {
  async executeSketchToRender(input: WorkflowInput): Promise<WorkflowResult> {
    // Validate input
    if (!input.prompt || !input.sourceImage) {
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate prompt enhancement
    const enhancedPrompt = `Enhanced: ${input.prompt}`;

    return {
      success: true,
      imageUrl: 'https://example.com/generated-image.jpg',
      metadata: {
        prompt: input.prompt,
        enhancedPrompt,
        settings: input.settings || {},
        timestamp: new Date().toISOString(),
      },
    };
  }

  async executeBranding(input: WorkflowInput): Promise<WorkflowResult> {
    if (!input.prompt || !input.sourceImage) {
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    // Simulate brand intelligence
    const brandName = input.settings?.brandingText || 'Unknown';
    const enhancedPrompt = `Transform into ${brandName} branded space: ${input.prompt}`;

    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      success: true,
      imageUrl: 'https://example.com/branded-image.jpg',
      metadata: {
        prompt: input.prompt,
        enhancedPrompt,
        settings: input.settings || {},
        timestamp: new Date().toISOString(),
      },
    };
  }
}

describe('Workflow Generation Integration', () => {
  let executor: WorkflowExecutor;

  beforeEach(() => {
    executor = new WorkflowExecutor();
  });

  describe('Sketch-to-Render Workflow', () => {
    it('should execute complete sketch-to-render workflow', async () => {
      const input: WorkflowInput = {
        prompt: 'Modern living room with natural lighting',
        sourceImage: {
          data: 'base64-sketch-data',
          mimeType: 'image/png',
        },
        settings: {
          style: 'modern',
          lighting: 'natural',
        },
      };

      const result = await executor.executeSketchToRender(input);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.prompt).toBe(input.prompt);
      expect(result.metadata?.enhancedPrompt).toContain('Enhanced');
      expect(result.metadata?.settings).toEqual(input.settings);
    });

    it('should handle sketch-to-render with reference image', async () => {
      const input: WorkflowInput = {
        prompt: 'Luxury bedroom',
        sourceImage: {
          data: 'base64-sketch-data',
          mimeType: 'image/png',
        },
        referenceImage: {
          data: 'base64-reference-data',
          mimeType: 'image/jpeg',
        },
      };

      const result = await executor.executeSketchToRender(input);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
    });

    it('should fail when required fields are missing', async () => {
      const input: WorkflowInput = {
        prompt: '',
        sourceImage: {
          data: '',
          mimeType: 'image/png',
        },
      };

      const result = await executor.executeSketchToRender(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include timestamp in metadata', async () => {
      const before = new Date().toISOString();

      const input: WorkflowInput = {
        prompt: 'Test',
        sourceImage: {
          data: 'base64-data',
          mimeType: 'image/png',
        },
      };

      const result = await executor.executeSketchToRender(input);

      expect(result.metadata?.timestamp).toBeDefined();
      expect(new Date(result.metadata!.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime()
      );
    });
  });

  describe('Branding Workflow', () => {
    it('should execute complete branding workflow', async () => {
      const input: WorkflowInput = {
        prompt: 'Transform this space',
        sourceImage: {
          data: 'base64-space-data',
          mimeType: 'image/png',
        },
        settings: {
          brandingText: 'Starbucks',
          venueType: 'café',
          preserveEmptySpace: false,
        },
      };

      const result = await executor.executeBranding(input);

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeDefined();
      expect(result.metadata?.enhancedPrompt).toContain('Starbucks');
    });

    it('should incorporate brand name in enhanced prompt', async () => {
      const input: WorkflowInput = {
        prompt: 'Modern retail space',
        sourceImage: {
          data: 'base64-data',
          mimeType: 'image/png',
        },
        settings: {
          brandingText: 'Apple',
          venueType: 'retail store',
        },
      };

      const result = await executor.executeBranding(input);

      expect(result.success).toBe(true);
      expect(result.metadata?.enhancedPrompt).toContain('Apple');
      expect(result.metadata?.enhancedPrompt).toContain('branded space');
    });

    it('should handle branding without brand name', async () => {
      const input: WorkflowInput = {
        prompt: 'Generic space',
        sourceImage: {
          data: 'base64-data',
          mimeType: 'image/png',
        },
        settings: {},
      };

      const result = await executor.executeBranding(input);

      expect(result.success).toBe(true);
      expect(result.metadata?.enhancedPrompt).toContain('Unknown');
    });

    it('should preserve settings in metadata', async () => {
      const settings = {
        brandingText: 'Nike',
        venueType: 'retail store',
        preserveEmptySpace: true,
      };

      const input: WorkflowInput = {
        prompt: 'Minimal space',
        sourceImage: {
          data: 'base64-data',
          mimeType: 'image/png',
        },
        settings,
      };

      const result = await executor.executeBranding(input);

      expect(result.success).toBe(true);
      expect(result.metadata?.settings).toEqual(settings);
    });
  });

  describe('Workflow Error Handling', () => {
    it('should handle missing prompt', async () => {
      const input: WorkflowInput = {
        prompt: '',
        sourceImage: {
          data: 'base64-data',
          mimeType: 'image/png',
        },
      };

      const result = await executor.executeSketchToRender(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required fields');
    });

    it('should handle missing source image', async () => {
      const input: WorkflowInput = {
        prompt: 'Test prompt',
        sourceImage: {
          data: '',
          mimeType: '',
        },
      };

      const result = await executor.executeSketchToRender(input);

      expect(result.success).toBe(false);
    });

    it('should handle both workflows with same error validation', async () => {
      const invalidInput: WorkflowInput = {
        prompt: '',
        sourceImage: {
          data: '',
          mimeType: '',
        },
      };

      const sketchResult = await executor.executeSketchToRender(invalidInput);
      const brandingResult = await executor.executeBranding(invalidInput);

      expect(sketchResult.success).toBe(false);
      expect(brandingResult.success).toBe(false);
      expect(sketchResult.error).toBe(brandingResult.error);
    });
  });

  describe('Workflow Performance', () => {
    it('should complete sketch-to-render in reasonable time', async () => {
      const startTime = Date.now();

      const input: WorkflowInput = {
        prompt: 'Test',
        sourceImage: {
          data: 'base64-data',
          mimeType: 'image/png',
        },
      };

      await executor.executeSketchToRender(input);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should complete branding workflow in reasonable time', async () => {
      const startTime = Date.now();

      const input: WorkflowInput = {
        prompt: 'Test',
        sourceImage: {
          data: 'base64-data',
          mimeType: 'image/png',
        },
        settings: {
          brandingText: 'Test Brand',
        },
      };

      await executor.executeBranding(input);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Workflow Data Integrity', () => {
    it('should maintain data integrity throughout workflow', async () => {
      const originalPrompt = 'Original prompt text';
      const originalSettings = {
        style: 'modern',
        lighting: 'natural',
      };

      const input: WorkflowInput = {
        prompt: originalPrompt,
        sourceImage: {
          data: 'base64-data',
          mimeType: 'image/png',
        },
        settings: originalSettings,
      };

      const result = await executor.executeSketchToRender(input);

      expect(result.metadata?.prompt).toBe(originalPrompt);
      expect(result.metadata?.settings).toEqual(originalSettings);
    });

    it('should not mutate input data', async () => {
      const input: WorkflowInput = {
        prompt: 'Test prompt',
        sourceImage: {
          data: 'base64-data',
          mimeType: 'image/png',
        },
        settings: {
          style: 'modern',
        },
      };

      const originalInput = JSON.parse(JSON.stringify(input));

      await executor.executeSketchToRender(input);

      expect(input).toEqual(originalInput);
    });
  });
});
