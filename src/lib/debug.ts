/**
 * Debug logging utility
 * 
 * Only logs in development mode. In production, all logs are suppressed.
 * Import and use instead of console.log/debug/warn/error.
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Debug logger that only outputs in development mode
 */
export const debug = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Always log errors (they indicate real problems)
    console.error('[ERROR]', ...args);
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  
  /**
   * Group logs (for complex debugging)
   */
  group: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
  
  /**
   * Table output for arrays/objects
   */
  table: (data: unknown) => {
    if (isDevelopment) {
      console.table(data);
    }
  },
  
  /**
   * Time a function execution
   */
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
};

/**
 * Check if we're in development mode
 */
export const isDevMode = () => isDevelopment;

export default debug;
