/**
 * Import Utilities
 *
 * Helpers that convert AI-generated token objects and Tailwind config
 * structures into strings suitable for the Theme CSS editor / Tailwind
 * config editor. The utility functions are intentionally simple and agnostic
 * of the concrete AI schema — they assume token objects use simple string
 * key/value pairs and avoid mutating inputs.
 */

/**
 * Converts the AI's CSS variables object into a CSS string
 * compatible with the ThemeCssEditor.
 */
export function jsonCssToCssString(
  rootVars: Record<string, string>,
  darkVars: Record<string, string>
): string {
  const formatVars = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([key, val]) => `  ${key}: ${val};`)
      .join('\n');

  return `@layer base {
  :root {
${formatVars(rootVars)}
  }
  
  .dark {
${formatVars(darkVars)}
  }
}`;
}

/**
 * Converts the AI's Tailwind config object into a JS string compatible with
 * the TailwindConfigEditor. The function returns a formatted object literal
 * suitable for a module's `theme.extend` config, not a complete `module.exports`.
 *
 * @param config - An object representing Tailwind configuration returned by the AI
 * @returns A pretty-printed JS object string representing the Tailwind config
 */
export function jsonConfigToString(config: Record<string, unknown>): string {
  // Return just the object literal, not module.exports.
  // Note: We intentionally do not convert functions or RegExp — the AI is
  // expected to return serializable primitives. If the AI inserts JS code,
  // this function will stringify it which can be manually edited in the UI.
  return JSON.stringify(config, null, 2);
}