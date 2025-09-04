/**
 * Live Component Editor - Main Entry Point
 *
 * This is the main entry point for the Live Component Editor React application.
 * It handles the initial setup, polyfills, and rendering of the root App component.
 *
 * Key Responsibilities:
 * - Browser environment setup and polyfills
 * - Process environment shim for third-party libraries
 * - React 18+ root creation and rendering
 * - StrictMode for development warnings
 * - Global CSS imports
 *
 * Architecture Notes:
 * - Uses React 18's createRoot API for concurrent features
 * - Implements process.env shim for libraries expecting Node.js environment
 * - Polyfills are loaded before other imports to ensure compatibility
 * - StrictMode helps catch potential issues in development
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

// Ensure a minimal `process.env` exists in the browser for libraries that reference it
declare global {
  // Minimal process stub accepted in browser runtime for third-party libs
  interface GlobalThis {
    process?: unknown;
  }
}

// Import polyfills FIRST before any other imports
import './polyfills/processShim';

// Allow a minimal process shim for browser runtime. This intentionally uses a narrow any-cast.
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
if ((globalThis as any).process === undefined) {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (globalThis as any).process = { env: {} };
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Initialize and render the Live Component Editor application.
 *
 * This function creates the React root and renders the main App component
 * within StrictMode for enhanced development experience and error detection.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
