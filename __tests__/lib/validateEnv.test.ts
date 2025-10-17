/**
 * Environment Validation Tests
 *
 * Tests for the API key validation system
 */

import { validateEnvironment, getRequiredEnv, getOptionalEnv, getEnvConfig } from '@/lib/validateEnv';

describe('validateEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    // Start with a clean environment
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Required Environment Variables', () => {
    it('should pass validation with all required env vars set correctly', () => {
      // Set all required variables with valid formats
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890123456789012345678901234567890';
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-1234567890';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';

      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should throw error for missing OPENAI_API_KEY', () => {
      // Set all except OpenAI
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-1234567890';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';

      delete process.env.OPENAI_API_KEY;

      expect(() => validateEnvironment()).toThrow('Missing environment variables');
      expect(() => validateEnvironment()).toThrow('OPENAI_API_KEY');
    });

    it('should throw error for missing THESYS_API_KEY', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890123456789012345678901234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-1234567890';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';

      delete process.env.THESYS_API_KEY;

      expect(() => validateEnvironment()).toThrow('Missing environment variables');
      expect(() => validateEnvironment()).toThrow('THESYS_API_KEY');
    });

    it('should throw error for missing Supabase keys', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890123456789012345678901234567890';
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';

      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => validateEnvironment()).toThrow('Missing environment variables');
    });

    it('should throw error for multiple missing variables', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890123456789012345678901234567890';
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';

      delete process.env.RUNWAY_API_KEY;
      delete process.env.FREEPIK_API_KEY;
      delete process.env.SUPABASE_URL;

      expect(() => validateEnvironment()).toThrow('Missing environment variables');
      expect(() => validateEnvironment()).toThrow('RUNWAY_API_KEY');
      expect(() => validateEnvironment()).toThrow('FREEPIK_API_KEY');
    });
  });

  describe('API Key Format Validation', () => {
    beforeEach(() => {
      // Set base valid environment
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-1234567890';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';
    });

    it('should reject OPENAI_API_KEY with invalid format (too short)', () => {
      process.env.OPENAI_API_KEY = 'sk-short';

      expect(() => validateEnvironment()).toThrow('Invalid environment variables');
    });

    it('should reject OPENAI_API_KEY without sk- prefix', () => {
      process.env.OPENAI_API_KEY = 'invalid-openai-key-1234567890';

      expect(() => validateEnvironment()).toThrow('Invalid environment variables');
    });

    it('should reject API keys with spaces', () => {
      process.env.OPENAI_API_KEY = 'sk-test key with spaces';

      expect(() => validateEnvironment()).toThrow('Invalid environment variables');
    });

    it('should reject API keys that are too short', () => {
      process.env.OPENAI_API_KEY = 'sk-short';

      expect(() => validateEnvironment()).toThrow('Invalid environment variables');
    });

    it('should reject Supabase URL without supabase in domain', () => {
      process.env.SUPABASE_URL = 'https://example.com';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';

      expect(() => validateEnvironment()).toThrow('Invalid environment variables');
    });

    it('should reject invalid Supabase URL format', () => {
      process.env.SUPABASE_URL = 'not-a-valid-url';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url';

      expect(() => validateEnvironment()).toThrow('Invalid environment variables');
    });
  });

  describe('Supabase Consistency Checks', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890123456789012345678901234567890';
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-1234567890';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';
    });

    it('should reject mismatched Supabase URLs', () => {
      process.env.SUPABASE_URL = 'https://project1.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project2.supabase.co';

      expect(() => validateEnvironment()).toThrow('Invalid environment variables');
      expect(() => validateEnvironment()).toThrow('must be identical');
    });

    it('should pass with matching Supabase URLs', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

      expect(() => validateEnvironment()).not.toThrow();
    });
  });

  describe('getRequiredEnv', () => {
    it('should return value for existing required env var', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890123456789012345678901234567890';

      expect(getRequiredEnv('OPENAI_API_KEY')).toBe('sk-test-key-1234567890123456789012345678901234567890');
    });

    it('should throw error for missing required env var', () => {
      delete process.env.OPENAI_API_KEY;

      expect(() => getRequiredEnv('OPENAI_API_KEY')).toThrow('Required environment variable OPENAI_API_KEY is not set');
    });
  });

  describe('getOptionalEnv', () => {
    it('should return value for existing optional env var', () => {
      process.env.FAL_KEY = 'test-fal-key-1234567890';

      expect(getOptionalEnv('FAL_KEY')).toBe('test-fal-key-1234567890');
    });

    it('should return undefined for missing optional env var', () => {
      delete process.env.FAL_KEY;

      expect(getOptionalEnv('FAL_KEY')).toBeUndefined();
    });
  });

  describe('getEnvConfig', () => {
    beforeEach(() => {
      // Set all required vars
      process.env.OPENAI_API_KEY = 'sk-test-key-1234567890123456789012345678901234567890';
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-1234567890';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';
    });

    it('should return complete config object with all required vars', () => {
      const config = getEnvConfig();

      expect(config.OPENAI_API_KEY).toBe('sk-test-key-1234567890123456789012345678901234567890');
      expect(config.THESYS_API_KEY).toBe('test-thesys-key-1234567890');
      expect(config.RUNWAY_API_KEY).toBe('test-runway-key-1234567890');
      expect(config.FREEPIK_API_KEY).toBe('test-freepik-key-1234567890123456789012345678');
      expect(config.SUPABASE_URL).toBe('https://test.supabase.co');
    });

    it('should include optional vars when set', () => {
      process.env.FAL_KEY = 'test-fal-key-1234567890';
      process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key-1234567890';

      const config = getEnvConfig();

      expect(config.FAL_KEY).toBe('test-fal-key-1234567890');
      expect(config.GOOGLE_GEMINI_API_KEY).toBe('test-gemini-key-1234567890');
    });

    it('should have undefined optional vars when not set', () => {
      delete process.env.FAL_KEY;
      delete process.env.GOOGLE_GEMINI_API_KEY;

      const config = getEnvConfig();

      expect(config.FAL_KEY).toBeUndefined();
      expect(config.GOOGLE_GEMINI_API_KEY).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string as invalid', () => {
      process.env.OPENAI_API_KEY = '';
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-1234567890';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';

      expect(() => validateEnvironment()).toThrow('Missing environment variables');
    });

    it('should handle whitespace-only string as invalid', () => {
      process.env.OPENAI_API_KEY = '   ';
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-1234567890';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';

      expect(() => validateEnvironment()).toThrow();
    });

    it('should reject keys with leading/trailing whitespace', () => {
      process.env.OPENAI_API_KEY = ' sk-test-key-1234567890123456789012345678901234567890 ';
      process.env.THESYS_API_KEY = 'test-thesys-key-1234567890';
      process.env.RUNWAY_API_KEY = 'test-runway-key-1234567890';
      process.env.FREEPIK_API_KEY = 'test-freepik-key-1234567890123456789012345678';
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-1234567890';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';

      expect(() => validateEnvironment()).toThrow('Invalid environment variables');
    });
  });
});
