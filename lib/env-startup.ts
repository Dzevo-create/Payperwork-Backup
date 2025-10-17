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

// Validate immediately on import (server-side only)
// This will throw and prevent the app from starting if env vars are missing
if (typeof window === 'undefined') {
  try {
    validateEnvironmentIfServer();
  } catch (error) {
    // Log the error with full details
    console.error('\n' + '='.repeat(80));
    console.error('ENVIRONMENT VALIDATION FAILED');
    console.error('='.repeat(80));
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unknown error:', error);
    }
    console.error('='.repeat(80) + '\n');

    // In development, throw to prevent server from starting
    // In production, also throw - we don't want to run with missing keys
    throw error;
  }
}

// Export validation function for manual validation if needed
export { validateEnvironment, validateEnvironmentIfServer, getEnvConfig, getRequiredEnv, getOptionalEnv } from './validateEnv';
