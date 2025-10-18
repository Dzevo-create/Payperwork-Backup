/**
 * Environment Validation - Startup Hook
 *
 * This file validates environment variables at application startup.
 * Import this in your main entry point (layout.tsx or API route) to ensure
 * validation happens before any API calls.
 *
 * Server-side only - safe to import anywhere.
 */

import { validateEnvironmentIfServer } from './validateEnv';
import { logger } from './logger';

// Validate immediately on import (server-side only)
// This will throw and prevent the app from starting if env vars are missing
if (typeof window === 'undefined') {
  try {
    validateEnvironmentIfServer();
  } catch (error) {
    // Log the error with full details
    const separator = '='.repeat(80);
    logger.error(`\n${separator}\nENVIRONMENT VALIDATION FAILED\n${separator}`, error instanceof Error ? error : undefined);

    // In development, throw to prevent server from starting
    // In production, also throw - we don't want to run with missing keys
    throw error;
  }
}

// Export validation function for manual validation if needed
export { validateEnvironment, validateEnvironmentIfServer, getEnvConfig, getRequiredEnv, getOptionalEnv } from './validateEnv';
