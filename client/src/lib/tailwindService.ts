/**
 * Tailwind Service - Service layer for Tailwind CSS operations
 *
 * This module provides a service layer for interacting with Tailwind CSS utilities,
 * including validation, generation, and manipulation of Tailwind classes.
 * It serves as an abstraction layer for Tailwind-related operations in the application.
 */

/**
 * Validates if a given class name is a valid Tailwind utility
 *
 * @param className - The class name to validate
 * @returns True if the class name is a valid Tailwind utility
 */
export function isValidTailwindClass(className: string): boolean {
  // Basic validation - check if it matches common Tailwind patterns
  const tailwindPatterns = [
    /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
    /^text-(red|blue|green|yellow|purple|pink|gray|black|white|indigo|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+$/,
    /^bg-(red|blue|green|yellow|purple|pink|gray|black|white|indigo|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+$/,
    /^p-\d+$/,
    /^m-\d+$/,
    /^w-\d+$/,
    /^h-\d+$/,
    /^(block|flex|inline|inline-block|grid|hidden)$/,
    /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  ];

  return tailwindPatterns.some(pattern => pattern.test(className));
}

/**
 * Generates a Tailwind class for a given property and value
 *
 * @param property - The CSS property (e.g., 'padding', 'margin', 'width')
 * @param value - The value for the property
 * @returns The corresponding Tailwind class or empty string if not supported
 */
export function generateTailwindClass(property: string, value: string): string {
  // This is a simplified implementation - in a real service,
  // this would have comprehensive mappings
  switch (property) {
    case 'padding':
      return `p-${value}`;
    case 'margin':
      return `m-${value}`;
    case 'width':
      return `w-${value}`;
    case 'height':
      return `h-${value}`;
    case 'color':
      return `text-${value}`;
    case 'backgroundColor':
      return `bg-${value}`;
    default:
      return '';
  }
}

/**
 * Extracts the value from a Tailwind class
 *
 * @param tailwindClass - The Tailwind class to parse
 * @returns The extracted value or null if not a valid class
 */
export function extractValueFromClass(tailwindClass: string): string | null {
  const parts = tailwindClass.split('-');
  if (parts.length >= 2) {
    return parts.slice(1).join('-');
  }
  return null;
}

/**
 * Checks if a class name represents a responsive variant
 *
 * @param className - The class name to check
 * @returns True if the class has responsive prefixes
 */
export function isResponsiveClass(className: string): boolean {
  return /^(sm|md|lg|xl|2xl):/.test(className);
}

/**
 * Removes responsive prefixes from a class name
 *
 * @param className - The class name with potential responsive prefix
 * @returns The class name without responsive prefix
 */
export function stripResponsivePrefix(className: string): string {
  return className.replace(/^(sm|md|lg|xl|2xl):/, '');
}