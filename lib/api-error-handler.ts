/**
 * Centralized API Error Handler
 *
 * Provides consistent error handling and responses across all API routes
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ValidationError } from './validation';

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: any;
  timestamp?: string;
}

/**
 * Error codes
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  API_KEY_MISSING = 'API_KEY_MISSING',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
}

/**
 * Map error codes to HTTP status codes
 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.API_KEY_MISSING]: 500,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
};

/**
 * Create error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  const status = ERROR_STATUS_MAP[code];

  const response: ApiErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  // Log error
  logger.error('API Error', {
    code,
    message,
    status,
    details,
  });

  return NextResponse.json(response, { status });
}

/**
 * Handle API errors with automatic type detection
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  // Log context
  if (context) {
    logger.error(`API Error in ${context}`, { error });
  }

  // Validation error
  if (error instanceof ValidationError) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      error.message,
      { field: error.field }
    );
  }

  // OpenAI API errors
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as any;

    if (apiError.status === 401) {
      return createErrorResponse(
        ErrorCode.UNAUTHORIZED,
        'API authentication failed'
      );
    }

    if (apiError.status === 429) {
      return createErrorResponse(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'API rate limit exceeded'
      );
    }

    if (apiError.status >= 500) {
      return createErrorResponse(
        ErrorCode.EXTERNAL_API_ERROR,
        'External API error',
        process.env.NODE_ENV === 'development' ? apiError : undefined
      );
    }
  }

  // Generic error
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('API key')) {
      return createErrorResponse(
        ErrorCode.API_KEY_MISSING,
        error.message
      );
    }

    if (error.message.includes('rate limit')) {
      return createErrorResponse(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        error.message
      );
    }

    return createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Ein interner Fehler ist aufgetreten',
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    );
  }

  // Unknown error
  return createErrorResponse(
    ErrorCode.INTERNAL_ERROR,
    'Ein unbekannter Fehler ist aufgetreten'
  );
}

/**
 * Rate limit error response
 */
export function rateLimitErrorResponse(
  resetTime: number
): NextResponse<ApiErrorResponse> {
  const response = createErrorResponse(
    ErrorCode.RATE_LIMIT_EXCEEDED,
    'Zu viele Anfragen. Bitte versuche es später erneut.'
  );

  response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());

  return response;
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}
