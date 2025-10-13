/**
 * API Security Utilities
 *
 * Provides API key validation and security checks for all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Check if OpenAI API key is configured
 */
export function validateOpenAIKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.error('OPENAI_API_KEY not configured');
    throw new Error('OpenAI API key not configured');
  }

  if (!apiKey.startsWith('sk-')) {
    logger.error('Invalid OPENAI_API_KEY format');
    throw new Error('Invalid OpenAI API key format');
  }

  return apiKey;
}

/**
 * Check if Anthropic API key is configured (for C1)
 */
export function validateAnthropicKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    logger.error('ANTHROPIC_API_KEY not configured');
    throw new Error('Anthropic API key not configured');
  }

  if (!apiKey.startsWith('sk-ant-')) {
    logger.error('Invalid ANTHROPIC_API_KEY format');
    throw new Error('Invalid Anthropic API key format');
  }

  return apiKey;
}

/**
 * Check if Kling AI API key is configured (for video generation)
 */
export function validateKlingKey(): string {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;

  if (!accessKey || !secretKey) {
    logger.error('KLING_ACCESS_KEY or KLING_SECRET_KEY not configured');
    throw new Error('Kling API keys not configured');
  }

  return accessKey;
}

/**
 * Check if fal.ai API key is configured (for video generation v2)
 */
export function validateFalKey(): string {
  const apiKey = process.env.FAL_KEY;

  if (!apiKey) {
    logger.error('FAL_KEY not configured');
    throw new Error('fal.ai API key not configured');
  }

  if (!apiKey.includes(':')) {
    logger.error('Invalid FAL_KEY format');
    throw new Error('Invalid fal.ai API key format (must include colon)');
  }

  return apiKey;
}

/**
 * Check if Supabase keys are configured
 */
export function validateSupabaseKeys(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    logger.error('Supabase keys not configured');
    throw new Error('Supabase configuration missing');
  }

  return { url, key };
}

/**
 * Security error response
 */
export function securityErrorResponse(message: string, status: number = 401): NextResponse {
  logger.warn('Security error', { message, status });

  return NextResponse.json(
    {
      error: message,
      code: 'SECURITY_ERROR',
    },
    { status }
  );
}

/**
 * Check request origin (basic CSRF protection)
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Allow same-origin requests
  if (!origin) return true; // No origin header (same-origin or tool request)

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true;
    }
  }

  // In production, check against allowed origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  if (allowedOrigins.length > 0) {
    return allowedOrigins.some(allowed => origin.includes(allowed));
  }

  // Fallback: check if origin matches host
  if (host && origin.includes(host)) {
    return true;
  }

  logger.warn('Invalid origin', { origin, host });
  return false;
}

/**
 * Validate content type
 */
export function validateContentType(request: NextRequest, expected: string = 'application/json'): boolean {
  const contentType = request.headers.get('content-type');

  if (!contentType) {
    logger.warn('Missing content-type header');
    return false;
  }

  if (!contentType.includes(expected)) {
    logger.warn('Invalid content-type', { expected, received: contentType });
    return false;
  }

  return true;
}

/**
 * API Key validation result
 */
export interface ApiKeyValidation {
  valid: boolean;
  error?: string;
  errorResponse?: NextResponse;
}

/**
 * Validate API keys for a route
 */
export function validateApiKeys(
  requiredKeys: ('openai' | 'anthropic' | 'kling' | 'fal' | 'supabase')[]
): ApiKeyValidation {
  try {
    for (const keyType of requiredKeys) {
      switch (keyType) {
        case 'openai':
          validateOpenAIKey();
          break;
        case 'anthropic':
          validateAnthropicKey();
          break;
        case 'kling':
          validateKlingKey();
          break;
        case 'fal':
          validateFalKey();
          break;
        case 'supabase':
          validateSupabaseKeys();
          break;
      }
    }

    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'API configuration error';
    return {
      valid: false,
      error: message,
      errorResponse: securityErrorResponse(message, 500),
    };
  }
}
