/**
 * Simple logger utility for server-side logging
 * In production, consider using a proper logging library like Winston or Pino
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    error?: Error;
    metadata?: Record<string, unknown>;
}

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
    private formatMessage(level: LogLevel, message: string, error?: Error, metadata?: Record<string, unknown>): string {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        if (error) {
            return `${prefix} ${message}\nError: ${error.message}\nStack: ${error.stack}`;
        }
        
        if (metadata && Object.keys(metadata).length > 0) {
            return `${prefix} ${message}\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
        }
        
        return `${prefix} ${message}`;
    }

    info(message: string, metadata?: Record<string, unknown>): void {
        const formatted = this.formatMessage('info', message, undefined, metadata);
        if (isDevelopment) {
            console.log(formatted);
        }
        // In production, send to logging service
    }

    warn(message: string, metadata?: Record<string, unknown>): void {
        const formatted = this.formatMessage('warn', message, undefined, metadata);
        console.warn(formatted);
        // In production, send to logging service
    }

    error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
        const formatted = this.formatMessage('error', message, error, metadata);
        console.error(formatted);
        // In production, send to error tracking service (e.g., Sentry)
    }

    debug(message: string, metadata?: Record<string, unknown>): void {
        if (isDevelopment) {
            const formatted = this.formatMessage('debug', message, undefined, metadata);
            console.debug(formatted);
        }
    }
}

export const logger = new Logger();

