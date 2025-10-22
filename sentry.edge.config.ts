/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for edge runtime (middleware, edge functions).
 *
 * Environment Variables Required:
 * - SENTRY_DSN: Your Sentry DSN
 * - SENTRY_ENVIRONMENT: Environment name (development, staging, production)
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: SENTRY_ENVIRONMENT === "development",

    // Note: Edge runtime has limitations - some integrations may not work
  });

  console.log("✅ Sentry initialized (edge runtime)");
} else {
  console.warn("⚠️ Sentry DSN not configured - error tracking disabled");
}
