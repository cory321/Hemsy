/**
 * Custom logger utility for production-safe error handling
 *
 * This logger ensures that errors are handled gracefully in production
 * without breaking the application or exposing sensitive information.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  /**
   * Sanitize error objects to prevent circular references and sensitive data exposure
   */
  private sanitizeError(error: any): any {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }
    return error;
  }

  /**
   * Sanitize context objects to prevent circular references
   */
  private sanitizeContext(context: LogContext): LogContext {
    try {
      // Attempt to stringify and parse to remove circular references
      return JSON.parse(JSON.stringify(context));
    } catch {
      // If that fails, return a safe version
      return { message: 'Context could not be serialized' };
    }
  }

  /**
   * Send logs to external service in production (e.g., Sentry, LogRocket)
   */
  private sendToLoggingService(
    level: LogLevel,
    message: string,
    context?: LogContext
  ) {
    // In production, send to your logging service
    // For now, we'll just store in a buffer that could be sent periodically
    if (!this.isDevelopment && this.isClient) {
      // Check if we have Sentry or another service available
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const Sentry = (window as any).Sentry;

        if (level === 'error') {
          Sentry.captureException(new Error(message), {
            extra: context,
            level: 'error',
          });
        } else if (level === 'warn') {
          Sentry.captureMessage(message, 'warning');
        }
      }

      // You could also send to your own API endpoint
      // this.sendToAPI(level, message, context);
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = context
      ? this.sanitizeContext(context)
      : undefined;

    // Always send to logging service, regardless of environment
    this.sendToLoggingService(level, message, sanitizedContext);

    // Only log to console in development
    if (!this.isDevelopment) {
      return;
    }

    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, sanitizedContext);
        break;
      case 'info':
        console.info(logMessage, sanitizedContext);
        break;
      case 'warn':
        console.warn(logMessage, sanitizedContext);
        break;
      case 'error':
        // Use console.error only in development
        console.error(logMessage, sanitizedContext);
        break;
    }
  }

  /**
   * Debug level logging - only works in development
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Error level logging - sanitizes errors for production
   */
  error(message: string, error?: any, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error ? this.sanitizeError(error) : undefined,
      url: this.isClient ? window.location.href : undefined,
      userAgent: this.isClient ? navigator.userAgent : undefined,
    };

    this.log('error', message, errorContext);
  }

  /**
   * Log API errors with request context
   */
  apiError(
    message: string,
    endpoint: string,
    error: any,
    context?: LogContext
  ) {
    this.error(message, error, {
      ...context,
      endpoint,
      type: 'api_error',
    });
  }

  /**
   * Log database errors
   */
  dbError(
    message: string,
    operation: string,
    error: any,
    context?: LogContext
  ) {
    this.error(message, error, {
      ...context,
      operation,
      type: 'database_error',
    });
  }

  /**
   * Create a child logger with preset context
   */
  withContext(defaultContext: LogContext) {
    const parentLogger = this;
    return {
      debug: (message: string, context?: LogContext) =>
        parentLogger.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) =>
        parentLogger.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        parentLogger.warn(message, { ...defaultContext, ...context }),
      error: (message: string, error?: any, context?: LogContext) =>
        parentLogger.error(message, error, { ...defaultContext, ...context }),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogContext };
