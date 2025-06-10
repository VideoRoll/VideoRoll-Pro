/**
 * Debug logging utility
 * @param message - The main message to log
 * @param args - Additional arguments to log
 */
export function logDebug(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Debug] ${message}`, ...args);
  }
}
