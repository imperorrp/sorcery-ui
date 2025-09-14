// client/src/lib/tailwindParser.ts

/**
 * Tailwind Class Parser - Utility for parsing and manipulating Tailwind CSS classes
 *
 * This module provides functionality to parse Tailwind CSS className strings into
 * structured objects and rebuild them back into strings. It enables visual editing
 * of Tailwind classes through intuitive UI controls.
 *
 * Features:
 * - Parses className strings into categorized properties (padding, margin, flex, etc.)
 * - Handles unknown classes by preserving them in remainingClasses
 * - Rebuilds className strings from structured state
 * - Supports common Tailwind utilities for visual editing
 */

// An object to hold the current state of a className string
export interface TailwindState {
  // Spacing
  padding?: string; // e.g., 'p-4', 'px-2', 'py-1'
  margin?: string;  // e.g., 'm-4', 'mx-2', 'my-1', 'mt-3'

  // Layout
  display?: string; // e.g., 'block', 'flex', 'inline', 'hidden'
  flex?: string;    // e.g., 'flex', 'inline-flex'
  flexDirection?: string; // e.g., 'flex-row', 'flex-col'
  justifyContent?: string; // e.g., 'justify-center', 'justify-between'
  alignItems?: string; // e.g., 'items-center', 'items-start'

  // Colors
  textColor?: string; // e.g., 'text-red-500', 'text-blue-600'
  backgroundColor?: string; // e.g., 'bg-white', 'bg-gray-100'

  // Typography
  fontSize?: string; // e.g., 'text-sm', 'text-lg', 'text-xl'
  fontWeight?: string; // e.g., 'font-bold', 'font-light'

  // Borders
  border?: string; // e.g., 'border', 'border-2'
  borderRadius?: string; // e.g., 'rounded', 'rounded-lg'

  // Sizing
  width?: string; // e.g., 'w-full', 'w-1/2', 'w-64'
  height?: string; // e.g., 'h-full', 'h-32'

  // Classes we don't recognize or handle visually
  remainingClasses: string[];
}

/**
 * Parses a className string into a structured TailwindState object
 *
 * @param className - The space-separated className string to parse
 * @returns A TailwindState object with categorized classes
 */
export function parseClasses(className: string): TailwindState {
  const classes = className.trim().split(/\s+/).filter(Boolean);
  const state: TailwindState = {
    remainingClasses: [],
  };

  for (const cls of classes) {
    // Spacing
    if (cls.match(/^p[xytblr]?-/)) {
      state.padding = cls;
    } else if (cls.match(/^m[xytblr]?-/) || cls === 'm-auto') {
      state.margin = cls;
    }
    // Layout
    else if (['block', 'flex', 'inline', 'inline-block', 'inline-flex', 'grid', 'inline-grid', 'hidden'].includes(cls)) {
      state.display = cls;
    } else if (cls === 'flex' || cls === 'inline-flex') {
      state.flex = cls;
    } else if (cls.match(/^flex-(row|col|row-reverse|col-reverse)$/)) {
      state.flexDirection = cls;
    } else if (cls.match(/^justify-(start|center|end|between|around|evenly)$/)) {
      state.justifyContent = cls;
    } else if (cls.match(/^items-(start|center|end|baseline|stretch)$/)) {
      state.alignItems = cls;
    }
    // Colors
    else if (cls.match(/^text-(red|blue|green|yellow|purple|pink|gray|black|white|indigo|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+$/) || cls.match(/^text-(current|transparent|black|white)$/)) {
      state.textColor = cls;
    } else if (cls.match(/^bg-(red|blue|green|yellow|purple|pink|gray|black|white|indigo|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+$/) || cls.match(/^bg-(current|transparent|black|white)$/)) {
      state.backgroundColor = cls;
    }
    // Typography
    else if (cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/)) {
      state.fontSize = cls;
    } else if (cls.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/)) {
      state.fontWeight = cls;
    }
    // Borders
    else if (cls.match(/^border(-\d+)?$/)) {
      state.border = cls;
    } else if (cls.match(/^rounded(-none|sm|md|lg|xl|2xl|3xl|full)?$/)) {
      state.borderRadius = cls;
    }
    // Sizing
    else if (cls.match(/^w-(full|screen|min|max|fit|0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|1\/2|1\/3|1\/4|1\/5|1\/6|1\/12)$/)) {
      state.width = cls;
    } else if (cls.match(/^h-(full|screen|min|max|fit|0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|1\/2|1\/3|1\/4|1\/5|1\/6|1\/12)$/)) {
      state.height = cls;
    }
    // If no match, add to remaining classes
    else {
      state.remainingClasses.push(cls);
    }
  }

  return state;
}

/**
 * Takes a TailwindState object and rebuilds the className string
 *
 * @param state - The TailwindState object to stringify
 * @returns A space-separated className string
 */
export function stringifyClasses(state: TailwindState): string {
  const classes: string[] = [];

  // Add all recognized classes in a consistent order
  if (state.display) classes.push(state.display);
  if (state.flex) classes.push(state.flex);
  if (state.flexDirection) classes.push(state.flexDirection);
  if (state.justifyContent) classes.push(state.justifyContent);
  if (state.alignItems) classes.push(state.alignItems);

  if (state.width) classes.push(state.width);
  if (state.height) classes.push(state.height);

  if (state.padding) classes.push(state.padding);
  if (state.margin) classes.push(state.margin);

  if (state.textColor) classes.push(state.textColor);
  if (state.backgroundColor) classes.push(state.backgroundColor);

  if (state.fontSize) classes.push(state.fontSize);
  if (state.fontWeight) classes.push(state.fontWeight);

  if (state.border) classes.push(state.border);
  if (state.borderRadius) classes.push(state.borderRadius);

  // Add remaining classes
  classes.push(...state.remainingClasses);

  return classes.join(' ');
}

/**
 * Updates a specific property in the TailwindState and returns the new className string
 *
 * @param currentClassName - The current className string
 * @param property - The property to update (e.g., 'padding', 'margin')
 * @param value - The new value for the property (empty string to remove)
 * @returns The updated className string
 */
export function updateClassProperty(
  currentClassName: string,
  property: keyof Omit<TailwindState, 'remainingClasses'>,
  value: string
): string {
  const state = parseClasses(currentClassName);

  if (value.trim() === '') {
    // Remove the property
    (state as Partial<TailwindState>)[property] = undefined;
  } else {
    // Update the property
    (state as Partial<TailwindState>)[property] = value;
  }

  return stringifyClasses(state);
}

/**
 * Extracts the numeric value from a Tailwind class (e.g., 'p-4' -> '4', 'text-lg' -> 'lg')
 *
 * @param tailwindClass - The Tailwind class to extract value from
 * @returns The extracted value or empty string if not found
 */
export function extractClassValue(tailwindClass: string): string {
  if (!tailwindClass) return '';

  const parts = tailwindClass.split('-');
  if (parts.length >= 2) {
    // For classes like 'p-4', 'text-lg', 'w-1/2'
    return parts.slice(1).join('-');
  }

  return '';
}

/**
 * Creates a Tailwind class from a property and value (e.g., 'padding', '4' -> 'p-4')
 *
 * @param property - The property type (e.g., 'padding', 'margin')
 * @param value - The value to use
 * @returns The constructed Tailwind class
 */
export function createClassFromValue(property: string, value: string): string {
  if (!value.trim()) return '';

  switch (property) {
    case 'padding':
      return `p-${value}`;
    case 'margin':
      return value === 'auto' ? 'm-auto' : `m-${value}`;
    case 'fontSize':
      return `text-${value}`;
    case 'fontWeight':
      return `font-${value}`;
    case 'width':
      return `w-${value}`;
    case 'height':
      return `h-${value}`;
    case 'textColor':
      return `text-${value}`;
    case 'backgroundColor':
      return `bg-${value}`;
    case 'borderRadius':
      return value === 'none' ? 'rounded-none' : `rounded-${value}`;
    default:
      return `${property}-${value}`;
  }
}
