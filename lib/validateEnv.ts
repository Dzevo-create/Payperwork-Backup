/**
 * Environment Variable Validation
 *
 * Validates all required API keys and configuration at application startup.
 * Provides clear error messages for missing or invalid environment variables.
 */

import { apiLogger } from './logger';

interface EnvironmentConfig {
  // OpenAI
  OPENAI_API_KEY: string;

  // Custom AI Providers
  THESYS_API_KEY: string;

  // Video Providers
  RUNWAY_API_KEY: string;
  FAL_KEY?: string; // Optional
  KLING_ACCESS_KEY?: string; // Optional
  KLING_SECRET_KEY?: string; // Optional
  KLING_API_URL?: string; // Optional

  // Image Providers
  FREEPIK_API_KEY: string;
  GOOGLE_GEMINI_API_KEY?: string; // Optional

  // Supabase (Server-side)
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Supabase (Client-side - public)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

  // Security & CORS
  ALLOWED_ORIGINS?: string; // Optional

  // Monitoring & Error Tracking
  SENTRY_DSN?: string; // Optional
  SENTRY_ORG?: string; // Optional
  SENTRY_PROJECT?: string; // Optional

  // Environment
  NODE_ENV?: string; // Optional, but usually present
}

type RequiredEnvKeys = keyof Pick<EnvironmentConfig,
  'OPENAI_API_KEY' |
  'THESYS_API_KEY' |
  'RUNWAY_API_KEY' |
  'FREEPIK_API_KEY' |
  'SUPABASE_URL' |
  'SUPABASE_SERVICE_ROLE_KEY' |
  'NEXT_PUBLIC_SUPABASE_URL' |
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
>;

const REQUIRED_ENV_VARS: RequiredEnvKeys[] = [
  'OPENAI_API_KEY',
  'THESYS_API_KEY',
  'RUNWAY_API_KEY',
  'FREEPIK_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const OPTIONAL_ENV_VARS: (keyof EnvironmentConfig)[] = [
  'FAL_KEY',
  'KLING_ACCESS_KEY',
  'KLING_SECRET_KEY',
  'KLING_API_URL',
  'GOOGLE_GEMINI_API_KEY',
  'ALLOWED_ORIGINS',
  'SENTRY_DSN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'NODE_ENV',
];

class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public missingVars: string[] = [],
    public invalidVars: string[] = []
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validates that an API key has a reasonable format
 */
function isValidApiKey(key: string, keyName: string): boolean {
  // Basic validation: non-empty, no spaces, reasonable length
  const basicValidation = (
    key.length > 10 &&
    key.length < 500 &&
    !key.includes(' ') &&
    key.trim() === key
  );

  if (!basicValidation) {
    return false;
  }

  // Specific validation rules for known key types
  if (keyName === 'OPENAI_API_KEY') {
    // OpenAI keys start with 'sk-' or 'sk-proj-'
    return key.startsWith('sk-');
  }

  if (keyName.includes('SUPABASE_URL')) {
    // Supabase URLs should be valid URLs
    try {
      new URL(key);
      return key.includes('supabase');
    } catch {
      return false;
    }
  }

  if (keyName === 'FREEPIK_API_KEY') {
    // Freepik keys have a specific format (UUID-like)
    return key.length >= 30;
  }

  return true;
}

/**
 * Validates that Supabase URL and anon key match
 */
function validateSupabaseConsistency(): { valid: boolean; error?: string } {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverUrl = process.env.SUPABASE_URL;

  // Both should be the same
  if (publicUrl && serverUrl && publicUrl !== serverUrl) {
    return {
      valid: false,
      error: 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL must be identical',
    };
  }

  return { valid: true };
}

/**
 * Validates all required environment variables
 * @throws {EnvironmentValidationError} if validation fails
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  const invalid: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];

    if (!value) {
      missing.push(varName);
    } else if (!isValidApiKey(value, varName)) {
      invalid.push(varName);
    }
  }

  // Check Supabase consistency
  const supabaseCheck = validateSupabaseConsistency();
  if (!supabaseCheck.valid && supabaseCheck.error) {
    invalid.push(supabaseCheck.error);
  }

  // Log optional variables status (only in development)
  if (process.env.NODE_ENV === 'development') {
    const configured: string[] = [];
    const notConfigured: string[] = [];

    for (const varName of OPTIONAL_ENV_VARS) {
      const value = process.env[varName];
      if (value) {
        configured.push(varName);
      } else {
        notConfigured.push(varName);
      }
    }

    if (configured.length > 0) {
      apiLogger.info(`Optional env vars configured: ${configured.join(', ')}`);
    }
    if (notConfigured.length > 0) {
      apiLogger.debug(`Optional env vars not configured: ${notConfigured.join(', ')}`);
    }
  }

  // If we have errors, throw with details
  if (missing.length > 0 || invalid.length > 0) {
    const errorParts: string[] = [];

    if (missing.length > 0) {
      errorParts.push(`Missing environment variables:\n  - ${missing.join('\n  - ')}`);
    }

    if (invalid.length > 0) {
      errorParts.push(`Invalid environment variables (check format):\n  - ${invalid.join('\n  - ')}`);
    }

    const message = [
      '❌ Environment validation failed!',
      '',
      ...errorParts,
      '',
      '📝 Please check your .env.local file and ensure all required API keys are set.',
      '   Copy .env.example to .env.local if you haven\'t already.',
      '',
      '   Required environment variables:',
      ...REQUIRED_ENV_VARS.map(v => `   - ${v}`),
    ].join('\n');

    const error = new EnvironmentValidationError(message, missing, invalid);
    apiLogger.error('Environment validation failed', error, {
      missingCount: missing.length,
      invalidCount: invalid.length,
    });
    throw error;
  }

  apiLogger.info('✅ Environment validation passed - all required API keys present');
}

/**
 * Gets a validated environment variable
 * @throws {Error} if the variable is not set
 */
export function getRequiredEnv(key: RequiredEnvKeys): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Gets an optional environment variable
 */
export function getOptionalEnv(key: keyof EnvironmentConfig): string | undefined {
  return process.env[key];
}

/**
 * Type-safe environment configuration getter
 */
export function getEnvConfig(): EnvironmentConfig {
  return {
    OPENAI_API_KEY: getRequiredEnv('OPENAI_API_KEY'),
    THESYS_API_KEY: getRequiredEnv('THESYS_API_KEY'),
    RUNWAY_API_KEY: getRequiredEnv('RUNWAY_API_KEY'),
    FREEPIK_API_KEY: getRequiredEnv('FREEPIK_API_KEY'),
    SUPABASE_URL: getRequiredEnv('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    NEXT_PUBLIC_SUPABASE_URL: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    FAL_KEY: getOptionalEnv('FAL_KEY'),
    KLING_ACCESS_KEY: getOptionalEnv('KLING_ACCESS_KEY'),
    KLING_SECRET_KEY: getOptionalEnv('KLING_SECRET_KEY'),
    KLING_API_URL: getOptionalEnv('KLING_API_URL'),
    GOOGLE_GEMINI_API_KEY: getOptionalEnv('GOOGLE_GEMINI_API_KEY'),
    ALLOWED_ORIGINS: getOptionalEnv('ALLOWED_ORIGINS'),
    SENTRY_DSN: getOptionalEnv('SENTRY_DSN'),
    SENTRY_ORG: getOptionalEnv('SENTRY_ORG'),
    SENTRY_PROJECT: getOptionalEnv('SENTRY_PROJECT'),
    NODE_ENV: getOptionalEnv('NODE_ENV'),
  };
}

/**
 * Validates environment on server-side only
 * Safe to call from any context - will only validate on server
 */
export function validateEnvironmentIfServer(): void {
  if (typeof window === 'undefined') {
    validateEnvironment();
  }
}
