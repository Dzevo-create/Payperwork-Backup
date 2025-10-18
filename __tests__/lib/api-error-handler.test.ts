/**
 * API Error Handler Tests
 * Tests centralized error handling and response formatting
 */

import {
  handleApiError,
  createErrorResponse,
  rateLimitErrorResponse,
  createSuccessResponse,
  ErrorCode,
} from '@/lib/api-error-handler';
import { ValidationError } from '@/lib/validation';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('API Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  describe('createErrorResponse', () => {
    it('should create error response with correct structure', () => {
      const response = createErrorResponse(
        ErrorCode.BAD_REQUEST,
        'Invalid input',
        { field: 'email' }
      );

      expect(response.status).toBe(400);

      response.json().then((data: any) => {
        expect(data).toHaveProperty('error', 'Invalid input');
        expect(data).toHaveProperty('code', ErrorCode.BAD_REQUEST);
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('details');
      });
    });

    it('should not include details in production', () => {
      process.env.NODE_ENV = 'production';

      const response = createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Server error',
        { sensitive: 'data' }
      );

      response.json().then((data: any) => {
        expect(data).not.toHaveProperty('details');
      });
    });

    it('should map error codes to correct HTTP status codes', () => {
      const testCases = [
        { code: ErrorCode.BAD_REQUEST, expectedStatus: 400 },
        { code: ErrorCode.UNAUTHORIZED, expectedStatus: 401 },
        { code: ErrorCode.FORBIDDEN, expectedStatus: 403 },
        { code: ErrorCode.NOT_FOUND, expectedStatus: 404 },
        { code: ErrorCode.RATE_LIMIT_EXCEEDED, expectedStatus: 429 },
        { code: ErrorCode.INTERNAL_ERROR, expectedStatus: 500 },
        { code: ErrorCode.SERVICE_UNAVAILABLE, expectedStatus: 503 },
        { code: ErrorCode.EXTERNAL_API_ERROR, expectedStatus: 502 },
      ];

      testCases.forEach(({ code, expectedStatus }) => {
        const response = createErrorResponse(code, 'Test error');
        expect(response.status).toBe(expectedStatus);
      });
    });
  });

  describe('handleApiError', () => {
    it('should handle ValidationError correctly', () => {
      const validationError = new ValidationError('Invalid email format', 'email');
      const response = handleApiError(validationError);

      expect(response.status).toBe(400);

      response.json().then((data: any) => {
        expect(data.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(data.error).toBe('Invalid email format');
      });
    });

    it('should handle 401 API errors', () => {
      const apiError = {
        status: 401,
        message: 'Unauthorized',
      };

      const response = handleApiError(apiError);
      expect(response.status).toBe(401);

      response.json().then((data: any) => {
        expect(data.code).toBe(ErrorCode.UNAUTHORIZED);
      });
    });

    it('should handle 429 rate limit errors', () => {
      const apiError = {
        status: 429,
        message: 'Too many requests',
      };

      const response = handleApiError(apiError);
      expect(response.status).toBe(429);

      response.json().then((data: any) => {
        expect(data.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      });
    });

    it('should handle 5xx external API errors', () => {
      const apiError = {
        status: 503,
        message: 'Service unavailable',
      };

      const response = handleApiError(apiError);
      expect(response.status).toBe(502);

      response.json().then((data: any) => {
        expect(data.code).toBe(ErrorCode.EXTERNAL_API_ERROR);
      });
    });

    it('should handle API key errors', () => {
      const error = new Error('API key is missing or invalid');
      const response = handleApiError(error);

      expect(response.status).toBe(500);

      response.json().then((data: any) => {
        expect(data.code).toBe(ErrorCode.API_KEY_MISSING);
      });
    });

    it('should handle rate limit message errors', () => {
      const error = new Error('Request exceeds rate limit');
      const response = handleApiError(error);

      expect(response.status).toBe(429);

      response.json().then((data: any) => {
        expect(data.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      });
    });

    it('should handle generic errors in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Something went wrong');
      const response = handleApiError(error);

      expect(response.status).toBe(500);

      response.json().then((data: any) => {
        expect(data.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(data.error).toBe('Something went wrong');
        expect(data).toHaveProperty('details');
      });
    });

    it('should handle generic errors in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Something went wrong');
      const response = handleApiError(error);

      expect(response.status).toBe(500);

      response.json().then((data: any) => {
        expect(data.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(data.error).toBe('Ein interner Fehler ist aufgetreten');
        expect(data).not.toHaveProperty('details');
      });
    });

    it('should handle unknown errors', () => {
      const response = handleApiError('unknown error type');

      expect(response.status).toBe(500);

      response.json().then((data: any) => {
        expect(data.code).toBe(ErrorCode.INTERNAL_ERROR);
      });
    });

    it('should log context when provided', () => {
      const { logger } = require('@/lib/logger');
      const error = new Error('Test error');

      handleApiError(error, 'test-context');

      expect(logger.error).toHaveBeenCalledWith('API Error in test-context', { error });
    });
  });

  describe('rateLimitErrorResponse', () => {
    it('should create rate limit response with retry-after header', () => {
      const resetTime = Date.now() + 60000; // 60 seconds from now
      const response = rateLimitErrorResponse(resetTime);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeTruthy();

      const retryAfter = parseInt(response.headers.get('Retry-After') || '0');
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });

    it('should include German error message', () => {
      const resetTime = Date.now() + 30000;
      const response = rateLimitErrorResponse(resetTime);

      response.json().then((data: any) => {
        expect(data.error).toContain('Zu viele Anfragen');
      });
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with default status 200', () => {
      const data = { result: 'success', value: 42 };
      const response = createSuccessResponse(data);

      expect(response.status).toBe(200);

      response.json().then((result: any) => {
        expect(result).toEqual(data);
      });
    });

    it('should create success response with custom status', () => {
      const data = { created: true };
      const response = createSuccessResponse(data, 201);

      expect(response.status).toBe(201);

      response.json().then((result: any) => {
        expect(result).toEqual(data);
      });
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle null error', () => {
      const response = handleApiError(null);
      expect(response.status).toBe(500);
    });

    it('should handle undefined error', () => {
      const response = handleApiError(undefined);
      expect(response.status).toBe(500);
    });

    it('should handle error with no message', () => {
      const error = new Error();
      const response = handleApiError(error);
      expect(response.status).toBe(500);
    });

    it('should handle circular reference in error details', () => {
      const circularObj: any = { prop: 'value' };
      circularObj.self = circularObj;

      const response = createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Circular error',
        circularObj
      );

      expect(response.status).toBe(500);
    });
  });
});
