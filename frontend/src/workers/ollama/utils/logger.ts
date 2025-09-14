/* eslint-disable no-console */

/**
 * @file logger.ts
 * @description A simple, centralized logger that respects a LOG_LEVEL environment variable.
 */

// Define the hierarchy of log levels. A lower number means more verbose.
const logLevels = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  SILENT: 5, // A level to disable all logging
};

// Determine the current log level from environment variables, defaulting to 'INFO' for safety.
const currentLogLevelName = (process.env.LOG_LEVEL?.toUpperCase() || 'INFO') as keyof typeof logLevels;
const currentLogLevel = logLevels[currentLogLevelName] || logLevels.INFO;

/**
 * A shared logger instance. It will only output messages that are at or above
 * the configured LOG_LEVEL.
 *
 * @example
 * logger.debug('This will only show if LOG_LEVEL is DEBUG');
 * logger.info('This will show for INFO and DEBUG');
 * logger.warn('This will show for WARN, INFO, and DEBUG');
 * logger.error('This will always show unless LOG_LEVEL is SILENT');
 */
export const logger = {
  debug: (...args: unknown[]): void => {
    if (currentLogLevel <= logLevels.DEBUG) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (currentLogLevel <= logLevels.INFO) {
      // Using console.log for INFO as console.info can be filtered by browsers/platforms.
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (currentLogLevel <= logLevels.WARN) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (currentLogLevel <= logLevels.ERROR) {
      console.error('[ERROR]', ...args);
    }
  },
};