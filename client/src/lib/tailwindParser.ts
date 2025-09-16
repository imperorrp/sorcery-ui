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
  // Spacing - individual axes
  spacing: {
    p?: string;  // p-4 (all sides)
    px?: string; // px-2 (left and right)
    py?: string; // py-1 (top and bottom)
    pt?: string; // pt-3 (top)
    pr?: string; // pr-2 (right)
    pb?: string; // pb-1 (bottom)
    pl?: string; // pl-4 (left)
    m?: string;  // m-4 (all sides)
    mx?: string; // mx-2 (left and right)
    my?: string; // my-1 (top and bottom)
    mt?: string; // mt-3 (top)
    mr?: string; // mr-2 (right)
    mb?: string; // mb-1 (bottom)
    ml?: string; // ml-4 (left)
  };

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

  // New properties for enhanced controls
  gap?: string; // e.g., 'gap-4'
  opacity?: string; // e.g., 'opacity-50'
  boxShadow?: string; // e.g., 'shadow-md'
  borderWidth?: string; // e.g., 'border-2'
  cursor?: string; // e.g., 'cursor-pointer'
  backgroundImage?: string; // e.g., 'bg-gradient-to-r'
  fontItalic?: string; // e.g., 'italic'
  underline?: string; // e.g., 'underline'
  truncate?: string; // e.g., 'truncate'

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
    spacing: {},
    remainingClasses: [],
  };

  for (const cls of classes) {
    // Spacing - individual axes
    if (cls.match(/^p-/) && !cls.match(/^p[xytlrb]-/)) {
      state.spacing.p = cls;
    } else if (cls.match(/^px-/)) {
      state.spacing.px = cls;
    } else if (cls.match(/^py-/)) {
      state.spacing.py = cls;
    } else if (cls.match(/^pt-/)) {
      state.spacing.pt = cls;
    } else if (cls.match(/^pr-/)) {
      state.spacing.pr = cls;
    } else if (cls.match(/^pb-/)) {
      state.spacing.pb = cls;
    } else if (cls.match(/^pl-/)) {
      state.spacing.pl = cls;
    } else if (cls.match(/^m-/) && !cls.match(/^m[xytlrb]-/) && cls !== 'm-auto') {
      state.spacing.m = cls;
    } else if (cls.match(/^mx-/)) {
      state.spacing.mx = cls;
    } else if (cls.match(/^my-/)) {
      state.spacing.my = cls;
    } else if (cls.match(/^mt-/)) {
      state.spacing.mt = cls;
    } else if (cls.match(/^mr-/)) {
      state.spacing.mr = cls;
    } else if (cls.match(/^mb-/)) {
      state.spacing.mb = cls;
    } else if (cls.match(/^ml-/)) {
      state.spacing.ml = cls;
    } else if (cls === 'm-auto') {
      state.spacing.m = cls;
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
    // New properties
    else if (cls.match(/^gap-\d+$/)) {
      state.gap = cls;
    } else if (cls.match(/^opacity-\d+$/)) {
      state.opacity = cls;
    } else if (cls.match(/^shadow(-sm|-md|-lg|-xl|-2xl|-inner|-none)?$/)) {
      state.boxShadow = cls;
    } else if (cls.match(/^cursor-(auto|default|pointer|wait|text|move|help|not-allowed|none|context-menu|progress|cell|crosshair|vertical-text|alias|copy|no-drop|grab|grabbing|all-scroll|col-resize|row-resize|n-resize|e-resize|s-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize)$/)) {
      state.cursor = cls;
    } else if (cls.match(/^bg-(gradient-to-r|gradient-to-l|gradient-to-t|gradient-to-b|gradient-to-tr|gradient-to-tl|gradient-to-br|gradient-to-bl|none)$/)) {
      state.backgroundImage = cls;
    } else if (cls === 'italic' || cls === 'not-italic') {
      state.fontItalic = cls;
    } else if (cls === 'underline' || cls === 'no-underline' || cls === 'line-through') {
      state.underline = cls;
    } else if (cls === 'truncate') {
      state.truncate = cls;
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

  // Add spacing classes in order
  if (state.spacing.p) classes.push(state.spacing.p);
  if (state.spacing.px) classes.push(state.spacing.px);
  if (state.spacing.py) classes.push(state.spacing.py);
  if (state.spacing.pt) classes.push(state.spacing.pt);
  if (state.spacing.pr) classes.push(state.spacing.pr);
  if (state.spacing.pb) classes.push(state.spacing.pb);
  if (state.spacing.pl) classes.push(state.spacing.pl);
  if (state.spacing.m) classes.push(state.spacing.m);
  if (state.spacing.mx) classes.push(state.spacing.mx);
  if (state.spacing.my) classes.push(state.spacing.my);
  if (state.spacing.mt) classes.push(state.spacing.mt);
  if (state.spacing.mr) classes.push(state.spacing.mr);
  if (state.spacing.mb) classes.push(state.spacing.mb);
  if (state.spacing.ml) classes.push(state.spacing.ml);

  // Add all other recognized classes in a consistent order
  if (state.display) classes.push(state.display);
  if (state.flex) classes.push(state.flex);
  if (state.flexDirection) classes.push(state.flexDirection);
  if (state.justifyContent) classes.push(state.justifyContent);
  if (state.alignItems) classes.push(state.alignItems);

  if (state.width) classes.push(state.width);
  if (state.height) classes.push(state.height);

  if (state.textColor) classes.push(state.textColor);
  if (state.backgroundColor) classes.push(state.backgroundColor);

  if (state.fontSize) classes.push(state.fontSize);
  if (state.fontWeight) classes.push(state.fontWeight);

  if (state.border) classes.push(state.border);
  if (state.borderRadius) classes.push(state.borderRadius);

  // Add new properties
  if (state.gap) classes.push(state.gap);
  if (state.opacity) classes.push(state.opacity);
  if (state.boxShadow) classes.push(state.boxShadow);
  if (state.borderWidth) classes.push(state.borderWidth);
  if (state.cursor) classes.push(state.cursor);
  if (state.backgroundImage) classes.push(state.backgroundImage);
  if (state.fontItalic) classes.push(state.fontItalic);
  if (state.underline) classes.push(state.underline);
  if (state.truncate) classes.push(state.truncate);

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
  property: string,
  value: string
): string {
  const state = parseClasses(currentClassName);

  if (value.trim() === '') {
    // Remove the property
    if (property in state.spacing) {
      (state.spacing as Partial<TailwindState['spacing']>)[property as keyof TailwindState['spacing']] = undefined;
    } else {
      (state as Partial<TailwindState>)[property as keyof Omit<TailwindState, 'remainingClasses' | 'spacing'>] = undefined;
    }
  } else {
    // Update the property
    if (property in state.spacing) {
      (state.spacing as Partial<TailwindState['spacing']>)[property as keyof TailwindState['spacing']] = value;
    } else {
      (state as Partial<TailwindState>)[property as keyof Omit<TailwindState, 'remainingClasses' | 'spacing'>] = value;
    }
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
    case 'p':
      return `p-${value}`;
    case 'px':
      return `px-${value}`;
    case 'py':
      return `py-${value}`;
    case 'pt':
      return `pt-${value}`;
    case 'pr':
      return `pr-${value}`;
    case 'pb':
      return `pb-${value}`;
    case 'pl':
      return `pl-${value}`;
    case 'm':
      return value === 'auto' ? 'm-auto' : `m-${value}`;
    case 'mx':
      return `mx-${value}`;
    case 'my':
      return `my-${value}`;
    case 'mt':
      return `mt-${value}`;
    case 'mr':
      return `mr-${value}`;
    case 'mb':
      return `mb-${value}`;
    case 'ml':
      return `ml-${value}`;
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
    case 'gap':
      return `gap-${value}`;
    case 'opacity':
      return `opacity-${value}`;
    case 'boxShadow':
      return value === 'none' ? 'shadow-none' : `shadow${value ? `-${value}` : ''}`;
    case 'borderWidth':
      return value === '0' ? 'border-0' : `border${value ? `-${value}` : ''}`;
    case 'cursor':
      return `cursor-${value}`;
    case 'backgroundImage':
      return `bg-${value}`;
    case 'fontItalic':
      return value === 'italic' ? 'italic' : 'not-italic';
    case 'underline':
      return value === 'underline' ? 'underline' : value === 'line-through' ? 'line-through' : 'no-underline';
    case 'truncate':
      return 'truncate';
  }

  return '';
}
