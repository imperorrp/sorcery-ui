/**
 * Process Polyfill - Node.js Compatibility Layer
 *
 * Provides a minimal Node.js process global for browser environments.
 * Required by Babel and other Node.js packages that expect process to exist.
 * Includes essential process properties like env, version, and utility methods.
 */

// Process polyfill for browser environment
// This provides the Node.js process global that Babel packages expect

// Provide a comprehensive process polyfill for Babel and other Node.js packages
if (typeof globalThis !== 'undefined' && !(globalThis as any).process) { // eslint-disable-line @typescript-eslint/no-explicit-any
  (globalThis as any).process = { // eslint-disable-line @typescript-eslint/no-explicit-any
    env: {
      NODE_ENV: 'development',
    },
    version: 'v16.0.0',
    platform: 'linux',
    cwd: () => '/',
    nextTick: (callback: () => void) => {
      setTimeout(callback, 0);
    },
  };
}