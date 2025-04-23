/**
 * Structured logging utility with logging levels
 * Replaces direct console.log calls with a more consistent format
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Define output colors for console (DevTools)
const COLORS = {
  DEBUG: '#6B7280', // gray-500
  INFO: '#3B82F6',  // blue-500
  WARN: '#F59E0B',  // amber-500
  ERROR: '#EF4444', // red-500
};

// Configuration options
type LoggerConfig = {
  minLevel: LogLevel;
  enabled: boolean;
  prefix: string;
  includeTimestamps: boolean;
  colorize: boolean;
};

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enabled: true,
  prefix: '',
  includeTimestamps: true,
  colorize: true,
};

// Current configuration
let config = { ...DEFAULT_CONFIG };

// Set logger configuration
export function configureLogger(customConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...customConfig };
}

// Get level name from enum value
function getLevelName(level: LogLevel): string {
  return LogLevel[level];
}

// Format message with timestamp, level, and context
function formatMessage(level: LogLevel, context: string, message: string): string {
  const parts: string[] = [];
  
  if (config.includeTimestamps) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  parts.push(`[${getLevelName(level)}]`);
  
  if (config.prefix) {
    parts.push(`[${config.prefix}]`);
  }
  
  if (context) {
    parts.push(`[${context}]`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
}

// Core logging function
function log(level: LogLevel, context: string, message: string, ...args: any[]): void {
  // Skip if logging is disabled or below minimum level
  if (!config.enabled || level < config.minLevel) {
    return;
  }
  
  const formattedMessage = formatMessage(level, context, message);
  
  // Select appropriate console method based on log level
  const consoleMethod = level === LogLevel.DEBUG ? 'debug' :
                        level === LogLevel.INFO ? 'info' :
                        level === LogLevel.WARN ? 'warn' : 'error';
  
  // Apply coloring in development for better readability
  if (config.colorize && typeof window !== 'undefined') {
    const color = level === LogLevel.DEBUG ? COLORS.DEBUG :
                 level === LogLevel.INFO ? COLORS.INFO :
                 level === LogLevel.WARN ? COLORS.WARN : COLORS.ERROR;
    
    console[consoleMethod](`%c${formattedMessage}`, `color: ${color}`, ...args);
  } else {
    console[consoleMethod](formattedMessage, ...args);
  }
  
  // Could extend here to send logs to a service in production
  if (process.env.NODE_ENV === 'production' && level >= LogLevel.ERROR) {
    // In a real app, you could send errors to a service like Sentry
    // reportErrorToService(level, context, message, args);
  }
}

// Public API methods
export const logger = {
  debug: (message: string, context = '', ...args: any[]) => 
    log(LogLevel.DEBUG, context, message, ...args),
  
  info: (message: string, context = '', ...args: any[]) => 
    log(LogLevel.INFO, context, message, ...args),
  
  warn: (message: string, context = '', ...args: any[]) => 
    log(LogLevel.WARN, context, message, ...args),
  
  error: (message: string, context = '', ...args: any[]) => 
    log(LogLevel.ERROR, context, message, ...args),
  
  // Create a scoped logger with a fixed context
  createLogger: (context: string) => ({
    debug: (message: string, ...args: any[]) => log(LogLevel.DEBUG, context, message, ...args),
    info: (message: string, ...args: any[]) => log(LogLevel.INFO, context, message, ...args),
    warn: (message: string, ...args: any[]) => log(LogLevel.WARN, context, message, ...args),
    error: (message: string, ...args: any[]) => log(LogLevel.ERROR, context, message, ...args),
  }),
};

export default logger;
