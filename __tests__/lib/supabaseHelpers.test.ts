/**
 * Supabase Helpers Tests
 * Tests shared database utility functions
 */

import {
  executeWithUserContext,
  executeArrayQueryWithUserContext,
  executeVoidQueryWithUserContext,
  buildUpdateObject,
  extractStorageFilePath,
} from '@/lib/utils/supabaseHelpers';

// Mock dependencies
jest.mock('@/lib/supabase/insert-helper', () => ({
  getUserIdSync: jest.fn(() => 'test-user-id'),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('Supabase Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeWithUserContext', () => {
    it('should execute query successfully and return data', async () => {
      const mockData = { id: '1', name: 'Test' };
      const mockQueryFn = jest.fn(() =>
        Promise.resolve({ data: mockData, error: null })
      );

      const result = await executeWithUserContext('test-operation', mockQueryFn);

      expect(mockQueryFn).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(mockData);
    });

    it('should return null when query returns error', async () => {
      const { logger } = require('@/lib/logger');
      const mockError = new Error('Database error');
      const mockQueryFn = jest.fn(() =>
        Promise.resolve({ data: null, error: mockError })
      );

      const result = await executeWithUserContext('test-operation', mockQueryFn);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith('Error in test-operation:', mockError);
    });

    it('should handle unexpected errors', async () => {
      const { logger } = require('@/lib/logger');
      const mockQueryFn = jest.fn(() => {
        throw new Error('Unexpected error');
      });

      const result = await executeWithUserContext('test-operation', mockQueryFn);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith(
        'Unexpected error in test-operation:',
        expect.any(Error)
      );
    });

    it('should pass user ID to query function', async () => {
      const mockQueryFn = jest.fn(() =>
        Promise.resolve({ data: {}, error: null })
      );

      await executeWithUserContext('test-operation', mockQueryFn);

      expect(mockQueryFn).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('executeArrayQueryWithUserContext', () => {
    it('should execute query successfully and return array', async () => {
      const mockData = [
        { id: '1', name: 'Test 1' },
        { id: '2', name: 'Test 2' },
      ];
      const mockQueryFn = jest.fn(() =>
        Promise.resolve({ data: mockData, error: null })
      );

      const result = await executeArrayQueryWithUserContext('test-operation', mockQueryFn);

      expect(mockQueryFn).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(mockData);
    });

    it('should return empty array when query returns error', async () => {
      const { logger } = require('@/lib/logger');
      const mockError = new Error('Database error');
      const mockQueryFn = jest.fn(() =>
        Promise.resolve({ data: null, error: mockError })
      );

      const result = await executeArrayQueryWithUserContext('test-operation', mockQueryFn);

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith('Error in test-operation:', mockError);
    });

    it('should return empty array when data is null', async () => {
      const mockQueryFn = jest.fn(() =>
        Promise.resolve({ data: null, error: null })
      );

      const result = await executeArrayQueryWithUserContext('test-operation', mockQueryFn);

      expect(result).toEqual([]);
    });

    it('should handle unexpected errors and return empty array', async () => {
      const { logger } = require('@/lib/logger');
      const mockQueryFn = jest.fn(() => {
        throw new Error('Unexpected error');
      });

      const result = await executeArrayQueryWithUserContext('test-operation', mockQueryFn);

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('executeVoidQueryWithUserContext', () => {
    it('should execute void operation successfully and return true', async () => {
      const mockQueryFn = jest.fn(() => Promise.resolve({ error: null }));

      const result = await executeVoidQueryWithUserContext('test-operation', mockQueryFn);

      expect(mockQueryFn).toHaveBeenCalledWith('test-user-id');
      expect(result).toBe(true);
    });

    it('should return false when query returns error', async () => {
      const { logger } = require('@/lib/logger');
      const mockError = new Error('Delete failed');
      const mockQueryFn = jest.fn(() => Promise.resolve({ error: mockError }));

      const result = await executeVoidQueryWithUserContext('test-operation', mockQueryFn);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Error in test-operation:', mockError);
    });

    it('should handle unexpected errors and return false', async () => {
      const { logger } = require('@/lib/logger');
      const mockQueryFn = jest.fn(() => {
        throw new Error('Unexpected error');
      });

      const result = await executeVoidQueryWithUserContext('test-operation', mockQueryFn);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('buildUpdateObject', () => {
    it('should build update object filtering out undefined values', () => {
      const updates = {
        name: 'New Name',
        age: 30,
        email: undefined,
        status: 'active',
      };

      const result = buildUpdateObject(updates);

      expect(result).toEqual({
        name: 'New Name',
        age: 30,
        status: 'active',
      });
      expect(result).not.toHaveProperty('email');
    });

    it('should handle empty updates object', () => {
      const updates = {};
      const result = buildUpdateObject(updates);

      expect(result).toEqual({});
    });

    it('should include null values but exclude undefined', () => {
      const updates = {
        name: 'Test',
        deletedAt: null,
        optionalField: undefined,
      };

      const result = buildUpdateObject(updates);

      expect(result).toEqual({
        name: 'Test',
        deletedAt: null,
      });
    });

    it('should include zero and false values', () => {
      const updates = {
        count: 0,
        isActive: false,
        name: '',
      };

      const result = buildUpdateObject(updates);

      expect(result).toEqual({
        count: 0,
        isActive: false,
        name: '',
      });
    });

    it('should use field map when provided', () => {
      const updates = {
        firstName: 'John',
        lastName: 'Doe',
        age: 25,
      };

      const fieldMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        age: 'age',
      };

      const result = buildUpdateObject(updates, fieldMap);

      expect(result).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        age: 25,
      });
    });

    it('should handle partial field map', () => {
      const updates = {
        firstName: 'John',
        age: 25,
      };

      const fieldMap = {
        firstName: 'first_name',
      };

      const result = buildUpdateObject(updates, fieldMap as any);

      expect(result).toEqual({
        first_name: 'John',
        age: 25,
      });
    });
  });

  describe('extractStorageFilePath', () => {
    it('should extract file path from Supabase storage URL', () => {
      const url =
        'https://example.supabase.co/storage/v1/object/public/images/user123/photo.jpg';
      const bucket = 'images';

      const result = extractStorageFilePath(url, bucket);

      expect(result).toBe('user123/photo.jpg');
    });

    it('should handle nested folder structure', () => {
      const url =
        'https://example.supabase.co/storage/v1/object/public/documents/2024/01/reports/monthly.pdf';
      const bucket = 'documents';

      const result = extractStorageFilePath(url, bucket);

      expect(result).toBe('2024/01/reports/monthly.pdf');
    });

    it('should return null for invalid URL format', () => {
      const url = 'https://example.com/images/photo.jpg';
      const bucket = 'images';

      const result = extractStorageFilePath(url, bucket);

      expect(result).toBeNull();
    });

    it('should return null for URL with wrong bucket', () => {
      const url =
        'https://example.supabase.co/storage/v1/object/public/wrong-bucket/file.jpg';
      const bucket = 'images';

      const result = extractStorageFilePath(url, bucket);

      expect(result).toBeNull();
    });

    it('should handle URL with query parameters', () => {
      const url =
        'https://example.supabase.co/storage/v1/object/public/images/photo.jpg?t=123456';
      const bucket = 'images';

      const result = extractStorageFilePath(url, bucket);

      expect(result).toBe('photo.jpg?t=123456');
    });

    it('should handle file names with special characters', () => {
      const url =
        'https://example.supabase.co/storage/v1/object/public/images/my%20photo%20(1).jpg';
      const bucket = 'images';

      const result = extractStorageFilePath(url, bucket);

      expect(result).toBe('my%20photo%20(1).jpg');
    });
  });
});
