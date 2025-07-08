// Enhanced logging utility for production-ready logging
// Replaces console.log statements with structured logging

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext extends Record<string, unknown> {
  userId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  componentStack?: string;
  errorBoundary?: boolean;
  errorInfo?: unknown;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment || this.isClient) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  // Performance logging
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // API request logging
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API ${method} ${url}`, { ...context, type: 'api_request' });
  }

  apiResponse(method: string, url: string, status: number, duration?: number, context?: LogContext): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this[level](`API ${method} ${url} ${status}${duration ? ` (${duration}ms)` : ''}`, {
      ...context,
      type: 'api_response',
      status,
      duration,
    });
  }

  // Database operation logging
  dbQuery(query: string, duration?: number, context?: LogContext): void {
    this.debug(`DB Query: ${query}${duration ? ` (${duration}ms)` : ''}`, {
      ...context,
      type: 'db_query',
      duration,
    });
  }

  // User action logging
  userAction(action: string, userId?: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      type: 'user_action',
    });
  }

  // Component lifecycle logging
  componentMount(component: string, context?: LogContext): void {
    this.debug(`Component mounted: ${component}`, {
      ...context,
      type: 'component_lifecycle',
      event: 'mount',
    });
  }

  componentUnmount(component: string, context?: LogContext): void {
    this.debug(`Component unmounted: ${component}`, {
      ...context,
      type: 'component_lifecycle',
      event: 'unmount',
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports for common logging patterns
export const logApiRequest = logger.apiRequest.bind(logger);
export const logApiResponse = logger.apiResponse.bind(logger);
export const logDbQuery = logger.dbQuery.bind(logger);
export const logUserAction = logger.userAction.bind(logger);
export const logError = logger.error.bind(logger);

// Performance monitoring helpers
export function withPerformanceLogging<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T {
  return ((...args: Parameters<T>) => {
    logger.time(label);
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.finally(() => logger.timeEnd(label));
      }
      logger.timeEnd(label);
      return result;
    } catch (error) {
      logger.timeEnd(label);
      throw error;
    }
  }) as T;
}

// React hook for component logging
export function useComponentLogger(componentName: string) {
  const { useEffect } = require('react');
  
  useEffect(() => {
    logger.componentMount(componentName);
    return () => logger.componentUnmount(componentName);
  }, [componentName]);

  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...context, component: componentName }),
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...context, component: componentName }),
    warn: (message: string, context?: LogContext) => 
      logger.warn(message, { ...context, component: componentName }),
    error: (message: string, error?: Error, context?: LogContext) => 
      logger.error(message, error, { ...context, component: componentName }),
  };
}