/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for client-side error tracking.
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_SENTRY_DSN: Your Sentry DSN
 * - NEXT_PUBLIC_SENTRY_ENVIRONMENT: Environment name (development, staging, production)
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: SENTRY_ENVIRONMENT === "development",

    // Replays are useful for debugging, but can impact performance
    replaysOnErrorSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.5 : 1.0,
    replaysSessionSampleRate: SENTRY_ENVIRONMENT === "production" ? 0.1 : 0,

    integrations: [
      Sentry.replayIntegration({
        // Additional SDK configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Filter out known non-error events
    beforeSend(event, hint) {
      // Filter out non-errors
      if (event.level === "info" || event.level === "log") {
        return null;
      }

      // Filter out known browser extensions errors
      const error = hint.originalException;
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        if (
          error.message.includes("Extension context") ||
          error.message.includes("chrome-extension://") ||
          error.message.includes("moz-extension://")
        ) {
          return null;
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extension errors
      "Non-Error promise rejection captured",
      "Extension context invalidated",
      // Network errors
      "NetworkError",
      "Failed to fetch",
      "Network request failed",
      // AbortController errors
      "The user aborted a request",
      "AbortError",
    ],
  });

  console.log("✅ Sentry initialized (client-side)");
} else {
  console.warn("⚠️ Sentry DSN not configured - error tracking disabled");
}
