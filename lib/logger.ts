/**
 * Centralized Logger Utility
 *
 * Replaces console.log with structured logging that can be:
 * - Disabled in production
 * - Sent to monitoring services (Sentry, LogRocket, etc.)
 * - Filtered by level and context
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  conversationId?: string;
  messageId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  /**
   * Debug logs - only in development
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Info logs - important events
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * Warning logs - potential issues
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Error logs - always logged, sent to monitoring
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.log('error', message, { ...context, error: this.serializeError(error) });

    // Send to Sentry in production
    if (!this.isDevelopment && this.isClient && error) {
      try {
        // Dynamic import to avoid bundling issues
        import('@sentry/nextjs').then(({ captureException }) => {
          captureException(error, {
            extra: context,
            tags: {
              component: context?.component,
            },
          });
        }).catch(() => {
          // Fail silently if Sentry is not configured
        });
      } catch {
        // Fail silently
      }
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const prefix = this.getPrefix(level);

    if (this.isDevelopment) {
      // Development: Pretty console output with colors
      // Note: getStyle kept for future color support
      this.getStyle(level);
      if (context && Object.keys(context).length > 0) {
        // eslint-disable-next-line no-console
        console.log(`${prefix} ${message}`, context);
      } else {
        // eslint-disable-next-line no-console
        console.log(`${prefix} ${message}`);
      }
    } else {
      // Production: Structured JSON logs
      const logEntry = {
        timestamp,
        level,
        message,
        context,
        environment: this.isClient ? 'client' : 'server',
      };

      // Only log warnings and errors in production
      if (level === 'warn' || level === 'error') {
        console[level](JSON.stringify(logEntry));
      }
    }
  }

  /**
   * Get emoji prefix for log level
   */
  private getPrefix(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
    }
  }

  /**
   * Get console style for log level
   */
  private getStyle(level: LogLevel): string {
    switch (level) {
      case 'debug': return 'color: gray';
      case 'info': return 'color: blue';
      case 'warn': return 'color: orange';
      case 'error': return 'color: red';
    }
  }

  /**
   * Serialize error objects for logging
   */
  private serializeError(error: Error | unknown): any {
    if (!error) return null;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    // Handle plain objects (e.g., API error responses)
    if (typeof error === 'object') {
      try {
        // Attempt to extract meaningful data from the object
        const errorObj = error as any;
        return {
          type: 'object',
          message: errorObj.message || errorObj.error || errorObj.statusText || 'Unknown error',
          status: errorObj.status || errorObj.statusCode,
          code: errorObj.code,
          details: this.isDevelopment ? errorObj : undefined,
          stringified: JSON.stringify(error, null, 2),
        };
      } catch (e) {
        // If JSON.stringify fails, fall back to String()
        return {
          type: 'object',
          value: String(error),
          warning: 'Could not serialize error object'
        };
      }
    }

    // Primitive values
    return {
      type: typeof error,
      value: String(error)
    };
  }

  /**
   * Performance measurement
   */
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Group logs together
   */
  group(label: string) {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Table logging for arrays/objects
   */
  table(data: any, label?: string) {
    if (this.isDevelopment) {
      if (label) {
        console.log(`📊 ${label}`);
      }
      console.table(data);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports for specific contexts
export const chatLogger = {
  debug: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.debug(message, { component: 'Chat', ...context }),
  info: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.info(message, { component: 'Chat', ...context }),
  warn: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.warn(message, { component: 'Chat', ...context }),
  error: (message: string, error?: Error, context?: Omit<LogContext, 'component'>) =>
    logger.error(message, error, { component: 'Chat', ...context }),
};

export const libraryLogger = {
  debug: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.debug(message, { component: 'Library', ...context }),
  info: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.info(message, { component: 'Library', ...context }),
  warn: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.warn(message, { component: 'Library', ...context }),
  error: (message: string, error?: Error, context?: Omit<LogContext, 'component'>) =>
    logger.error(message, error, { component: 'Library', ...context }),
};

export const apiLogger = {
  debug: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.debug(message, { component: 'API', ...context }),
  info: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.info(message, { component: 'API', ...context }),
  warn: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.warn(message, { component: 'API', ...context }),
  error: (message: string, error?: Error, context?: Omit<LogContext, 'component'>) =>
    logger.error(message, error, { component: 'API', ...context }),
};

export const workflowLogger = {
  debug: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.debug(message, { component: 'Workflow', ...context }),
  info: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.info(message, { component: 'Workflow', ...context }),
  warn: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.warn(message, { component: 'Workflow', ...context }),
  error: (message: string, error?: Error, context?: Omit<LogContext, 'component'>) =>
    logger.error(message, error, { component: 'Workflow', ...context }),
};

export const videoLogger = {
  debug: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.debug(message, { component: 'Video', ...context }),
  info: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.info(message, { component: 'Video', ...context }),
  warn: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.warn(message, { component: 'Video', ...context }),
  error: (message: string, error?: Error, context?: Omit<LogContext, 'component'>) =>
    logger.error(message, error, { component: 'Video', ...context }),
};

export const imageLogger = {
  debug: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.debug(message, { component: 'Image', ...context }),
  info: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.info(message, { component: 'Image', ...context }),
  warn: (message: string, context?: Omit<LogContext, 'component'>) =>
    logger.warn(message, { component: 'Image', ...context }),
  error: (message: string, error?: Error, context?: Omit<LogContext, 'component'>) =>
    logger.error(message, error, { component: 'Image', ...context }),
};

// Legacy compatibility - for gradual migration
// These allow console.log replacement without changing call signature
export const createLogger = (component: string) => ({
  log: (message: string, ...args: any[]) => {
    if (args.length > 0) {
      logger.debug(message, { component, data: args });
    } else {
      logger.debug(message, { component });
    }
  },
  debug: (message: string, ...args: any[]) => {
    logger.debug(message, { component, data: args.length > 0 ? args : undefined });
  },
  info: (message: string, ...args: any[]) => {
    logger.info(message, { component, data: args.length > 0 ? args : undefined });
  },
  warn: (message: string, ...args: any[]) => {
    logger.warn(message, { component, data: args.length > 0 ? args : undefined });
  },
  error: (message: string, ...args: any[]) => {
    const error = args.find(arg => arg instanceof Error);
    const otherArgs = args.filter(arg => !(arg instanceof Error));
    logger.error(message, error, { component, data: otherArgs.length > 0 ? otherArgs : undefined });
  },
});
