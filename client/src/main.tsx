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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
