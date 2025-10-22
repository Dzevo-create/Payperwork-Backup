/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for server-side error tracking.
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

    integrations: [
      // Add Prisma instrumentation for database query tracking
      Sentry.prismaIntegration(),
      // Track HTTP requests
      Sentry.httpIntegration({
        tracing: {
          // Disable tracking for health checks and static assets
          ignoreIncomingRequests: (url) => {
            return (
              url.includes("/api/health") ||
              url.includes("/_next/static") ||
              url.includes("/favicon.ico")
            );
          },
          ignoreOutgoingRequests: (url) => {
            // Don't track internal requests
            return url.includes("localhost") || url.includes("127.0.0.1");
          },
        },
      }),
    ],

    // Filter out known non-error events
    beforeSend(event, hint) {
      // Filter out non-errors
      if (event.level === "info" || event.level === "log") {
        return null;
      }

      // Add additional context
      if (event.request) {
        // Sanitize sensitive data
        if (event.request.headers) {
          delete event.request.headers["authorization"];
          delete event.request.headers["cookie"];
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Database connection errors (handled separately)
      "Connection terminated unexpectedly",
      // Network errors
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ENOTFOUND",
      // AbortController errors
      "AbortError",
      "The user aborted a request",
    ],
  });

  console.log("✅ Sentry initialized (server-side)");
} else {
  console.warn("⚠️ Sentry DSN not configured - error tracking disabled");
}
