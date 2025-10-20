/**
 * Theme Utility Helpers
 *
 * Centralized helpers for parsing, resolving, and working with Tailwind theme
 * configuration in the visual inspector. Functions in this module transform
 * the user-provided Tailwind config into rich data structures that power live
 * previews, color pickers, and control suggestions.
 */
import { defaultTailwindTheme } from './default-tailwind-theme';
import type { ColorOption } from '@/lib/colorConstants';
import type { CSSProperties } from 'react';

function safeParseJsObject(jsString: string): unknown {
  if (!jsString.trim()) return null;
  try {
    return new Function('return (' + jsString + ')')();
  } catch (e) {
    console.error("Invalid Tailwind config object string:", e);
    return null;
  }
}

/**
 * Deep merges two objects. The second object (extend) takes precedence.
 *
 * @param target - Base object that will receive properties
 * @param source - Object whose properties should override the base
 * @returns A new object containing merged properties
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] as Record<string, unknown> || {}, source[key] as Record<string, unknown>);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Resolves the user's Tailwind config string into a complete theme object.
 * Handles theme.extend by deeply merging with defaults, or wholesale replacement if no extend.
 *
 * @param configString - Stringified Tailwind configuration provided by the user
 * @returns A fully resolved theme object ready for runtime lookup
 */
export function resolveTheme(configString: string): Record<string, unknown> {
  const userConfig = safeParseJsObject(configString);

  if (!userConfig || typeof userConfig !== 'object') {
    return defaultTailwindTheme; // Fallback to default if no user config
  }

  const userConfigObj = userConfig as Record<string, unknown>;
  const userTheme = userConfigObj.theme as Record<string, unknown> || {};
  const userExtend = userTheme.extend as Record<string, unknown> || {};
  // ...existing code...

  if (Object.keys(userExtend).length > 0) {
    // Deep merge extend with defaults
    return deepMerge(defaultTailwindTheme, userExtend);
  } else if (Object.keys(userTheme).length > 0) {
    // Wholesale replacement of theme
    return { ...defaultTailwindTheme, ...userTheme };
  }

  return defaultTailwindTheme;
}

/**
 * Flattens a nested theme object into a single-level object with dot-notation keys.
 * E.g., { red: { 500: '#ef4444' } } -> { 'red.500': '#ef4444' }
 *
 * @param themeObject - Nested theme object to flatten
 * @returns A record with dot-notated keys
 */
export function flattenThemeObject(themeObject: Record<string, unknown>): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};

  function flatten(obj: Record<string, unknown>, prefix = ''): void {
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flatten(value as Record<string, unknown>, newKey);
      } else {
        flattened[newKey] = value;
      }
    }
  }

  flatten(themeObject);
  return flattened;
}

export function resolveThemeColors(tailwindConfig: string): Record<string, unknown> {
  const resolvedTheme = resolveTheme(tailwindConfig);
  return resolvedTheme.colors as Record<string, unknown> || {};
}

/**
 * Converts a resolved Tailwind color palette into ColorOption[] format for the ColorPicker.
 * Handles nested color objects by flattening them first.
 *
 * @param themeColors - The `colors` section of a Tailwind theme
 * @returns Structured color options used by color pickers
 */
export function convertThemeColorsToOptions(themeColors: Record<string, unknown>): ColorOption[] {
  const flattenedColors = flattenThemeObject(themeColors);
  const options: ColorOption[] = [];

  Object.entries(flattenedColors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Flattened key like 'red.500' -> className 'red-500', name 'red 500'
      const className = key.replace(/\./g, '-');
      const name = key.replace(/\./g, ' ');
      options.push({
        name,
        className,
        hex: value,
      });
    }
  });

  return options;
}

/**
 * Removes Tailwind variant prefixes (e.g., sm:, hover:) from a utility class so the
 * base utility can be detected reliably for preview logic.
 *
 * @param className - Utility class that may include variant prefixes
 * @returns The base utility class with prefixes stripped
 */
export function stripVariantPrefixes(className: string): string {
  if (!className) {
    return className;
  }
  const parts = className.split(':');
  return parts[parts.length - 1];
}

/**
 * Maps a Tailwind utility class to CSS properties for live preview in UI controls.
 *
 * @param className - The Tailwind class name (e.g., 'text-lg', 'font-bold', 'rounded-lg', 'shadow-xl')
 * @param resolvedTheme - The fully resolved theme object
 * @returns CSS properties object for styling preview elements, or an empty object when unsupported
 */
export function getCssForClass(className: string, resolvedTheme: Record<string, unknown>): CSSProperties {
  const baseClass = stripVariantPrefixes(className);

  // Ignore template/arbitrary tokens like '{value}' or '[1rem]' which aren't real utilities
  if (!baseClass || baseClass.includes('{') || baseClass.includes('[')) return {};

  // Handle different utility types
  if (baseClass.startsWith('text-')) {
    const size = baseClass.replace('text-', '');
    const fontSizeValue = (resolvedTheme.fontSize as Record<string, unknown>)?.[size];
    if (fontSizeValue) {
      if (Array.isArray(fontSizeValue)) {
        // Handle [size, {lineHeight}] format
        const [fontSize, options] = fontSizeValue;
        const css: CSSProperties = { fontSize: fontSize as string };
        const lineHeight = (options as Record<string, unknown>)?.lineHeight as string | undefined;
        if (lineHeight) css.lineHeight = lineHeight;
        return css;
      } else if (typeof fontSizeValue === 'string') {
        return { fontSize: fontSizeValue };
      }
    }
  } else if (baseClass.startsWith('font-')) {
    const weight = baseClass.replace('font-', '');
    const fontWeightValue = (resolvedTheme.fontWeight as Record<string, unknown>)?.[weight];
    if (fontWeightValue) {
      return { fontWeight: fontWeightValue as string };
    }
  } else if (baseClass === 'rounded' || baseClass.startsWith('rounded-')) {
    const radius = baseClass === 'rounded' ? 'DEFAULT' : baseClass.replace('rounded-', '');
    const borderRadiusValue = (resolvedTheme.borderRadius as Record<string, unknown>)?.[radius];
    if (borderRadiusValue) {
      return { borderRadius: borderRadiusValue as string };
    }
  } else if (baseClass.startsWith('leading-')) {
    const leading = baseClass.replace('leading-', '');
    const lineHeightValue = (resolvedTheme.lineHeight as Record<string, unknown>)?.[leading];
    if (lineHeightValue) {
      return { lineHeight: lineHeightValue as string };
    }
  } else if (baseClass.startsWith('tracking-')) {
    const spacing = baseClass.replace('tracking-', '');
    const letterSpacingValue = (resolvedTheme.letterSpacing as Record<string, unknown>)?.[spacing];
    if (letterSpacingValue) {
      return { letterSpacing: letterSpacingValue as string };
    }

  } else if (baseClass.startsWith('w-')) {
    const width = baseClass.replace('w-', '');
    const widthValue = (resolvedTheme.width as Record<string, unknown>)?.[width];
    if (widthValue) {
      return { width: widthValue as string };
    }
  } else if (baseClass.startsWith('min-w-')) {
    const minWidth = baseClass.replace('min-w-', '');
    const minWidthValue = (resolvedTheme.minWidth as Record<string, unknown>)?.[minWidth];
    if (minWidthValue) {
      return { minWidth: minWidthValue as string };
    }
  } else if (baseClass.startsWith('max-w-')) {
    const maxWidth = baseClass.replace('max-w-', '');
    const maxWidthValue = (resolvedTheme.maxWidth as Record<string, unknown>)?.[maxWidth];
    if (maxWidthValue) {
      return { maxWidth: maxWidthValue as string };
    }
  } else if (baseClass.startsWith('h-')) {
    const height = baseClass.replace('h-', '');
    const heightValue = (resolvedTheme.height as Record<string, unknown>)?.[height];
    if (heightValue) {
      return { height: heightValue as string };
    }
  } else if (baseClass.startsWith('min-h-')) {
    const minHeight = baseClass.replace('min-h-', '');
    const minHeightValue = (resolvedTheme.minHeight as Record<string, unknown>)?.[minHeight];
    if (minHeightValue) {
      return { minHeight: minHeightValue as string };
    }
  } else if (baseClass.startsWith('max-h-')) {
    const maxHeight = baseClass.replace('max-h-', '');
    const maxHeightValue = (resolvedTheme.maxHeight as Record<string, unknown>)?.[maxHeight];
    if (maxHeightValue) {
      return { maxHeight: maxHeightValue as string };
    }
  } else if (baseClass.startsWith('border-') && !baseClass.includes('-')) {
    // Simple border width like 'border', 'border-2'
    const width = baseClass === 'border' ? 'DEFAULT' : baseClass.replace('border-', '');
    const borderWidthValue = (resolvedTheme.borderWidth as Record<string, unknown>)?.[width];
    if (borderWidthValue) {
      return { borderWidth: borderWidthValue as string };
    }
  }

  return {};
}

