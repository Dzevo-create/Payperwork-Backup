/**
 * Sketch-to-Render API Route Tests
 * Tests the main generation endpoint for sketch-to-render transformations
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/sketch-to-render/route';

// Mock dependencies
jest.mock('@/lib/rate-limit', () => ({
  imageGenerationRateLimiter: {
    check: jest.fn(() => ({ success: true })),
  },
  getClientId: jest.fn(() => 'test-client-id'),
}));

jest.mock('@/lib/logger', () => ({
  apiLogger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/api-security', () => ({
  validateApiKeys: jest.fn(() => ({ valid: true })),
  validateContentType: jest.fn(() => true),
}));

jest.mock('@/lib/api/workflows/sketchToRender', () => ({
  enhanceSketchToRenderPrompt: jest.fn(() => Promise.resolve('Enhanced photorealistic rendering prompt')),
  prepareImagesForGeneration: jest.fn((source, ref) => [
    ...(ref || []),
    source,
  ]),
  validateImages: jest.fn(() => ({ valid: true })),
  buildArchitecturalPrompt: jest.fn((prompt, settings) => `Fallback: ${prompt}`),
}));

jest.mock('@/lib/api/providers/gemini', () => ({
  geminiClient: {
    getGenerativeModel: jest.fn(() => ({})),
  },
  GEMINI_MODELS: {
    imageGeneration: 'gemini-2.5-flash-image-preview',
  },
  buildGenerationConfig: jest.fn(() => ({})),
  generateSingleImage: jest.fn(() => Promise.resolve({})),
  parseImageFromResponse: jest.fn(() => ({
    data: 'base64-image-data',
    mimeType: 'image/png',
  })),
}));

describe('POST /api/sketch-to-render', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_GEMINI_API_KEY = 'test-key';
  });

  it('should successfully generate photorealistic rendering', async () => {
    const requestBody = {
      prompt: 'Modern interior design',
      sourceImage: {
        data: 'base64-source-data',
        mimeType: 'image/png',
      },
      settings: {
        style: 'modern',
        lighting: 'natural',
      },
    };

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('image');
    expect(data).toHaveProperty('metadata');
    expect(data.metadata).toHaveProperty('prompt');
    expect(data.metadata).toHaveProperty('enhancedPrompt');
    expect(data.metadata).toHaveProperty('finalPrompt');
    expect(data.metadata).toHaveProperty('settings');
    expect(data.metadata).toHaveProperty('timestamp');
    expect(data.metadata).toHaveProperty('model');
  });

  it('should handle request with reference image', async () => {
    const requestBody = {
      prompt: 'Luxury living room',
      sourceImage: {
        data: 'base64-source-data',
        mimeType: 'image/png',
      },
      referenceImage: {
        data: 'base64-reference-data',
        mimeType: 'image/png',
      },
      settings: {
        style: 'luxury',
      },
    };

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('image');
    expect(data).toHaveProperty('metadata');
  });

  it('should use default prompt when none provided', async () => {
    const requestBody = {
      sourceImage: {
        data: 'base64-source-data',
        mimeType: 'image/png',
      },
    };

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata).toHaveProperty('prompt');
  });

  it('should return error when API key is missing', async () => {
    const { validateApiKeys } = require('@/lib/api-security');
    validateApiKeys.mockReturnValueOnce({
      valid: false,
      errorResponse: {
        json: () => Promise.resolve({ error: 'API key missing' }),
        status: 500,
      },
    });

    const requestBody = {
      prompt: 'Test',
      sourceImage: {
        data: 'base64-data',
        mimeType: 'image/png',
      },
    };

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it('should return error when content type is invalid', async () => {
    const { validateContentType } = require('@/lib/api-security');
    validateContentType.mockReturnValueOnce(false);

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({ prompt: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
  });

  it('should return error when rate limit is exceeded', async () => {
    const { imageGenerationRateLimiter } = require('@/lib/rate-limit');
    imageGenerationRateLimiter.check.mockReturnValueOnce({
      success: false,
      reset: Date.now() + 60000,
    });

    const requestBody = {
      prompt: 'Test',
      sourceImage: {
        data: 'base64-data',
        mimeType: 'image/png',
      },
    };

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toHaveProperty('error');
  });

  it('should return error when image validation fails', async () => {
    const { validateImages } = require('@/lib/api/workflows/sketchToRender');
    validateImages.mockReturnValueOnce({
      valid: false,
      error: 'Invalid source image',
    });

    const requestBody = {
      prompt: 'Test',
      sourceImage: null,
    };

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should use fallback prompt when enhancement fails', async () => {
    const { enhanceSketchToRenderPrompt } = require('@/lib/api/workflows/sketchToRender');
    enhanceSketchToRenderPrompt.mockRejectedValueOnce(new Error('Enhancement failed'));

    const requestBody = {
      prompt: 'Modern office',
      sourceImage: {
        data: 'base64-source-data',
        mimeType: 'image/png',
      },
      settings: {
        style: 'modern',
      },
    };

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('image');
    expect(data.metadata).toHaveProperty('enhancedPrompt');
  });

  it('should handle generation failure gracefully', async () => {
    const { parseImageFromResponse } = require('@/lib/api/providers/gemini');
    parseImageFromResponse.mockReturnValueOnce(null);

    const requestBody = {
      prompt: 'Test',
      sourceImage: {
        data: 'base64-data',
        mimeType: 'image/png',
      },
    };

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
  });

  it('should include critical rendering rules in final prompt', async () => {
    const requestBody = {
      prompt: 'Test rendering',
      sourceImage: {
        data: 'base64-source-data',
        mimeType: 'image/png',
      },
    };

    const request = new NextRequest('http://localhost/api/sketch-to-render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metadata.finalPrompt).toContain('CRITICAL RULES');
    expect(data.metadata.finalPrompt).toContain('EXACT camera angle');
    expect(data.metadata.finalPrompt).toContain('COMPLETELY PHOTOREALISTIC');
  });
});
