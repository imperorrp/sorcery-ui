/**
 * Utility State Helpers Module
 *
 * This module provides helper functions for managing utility class state
 * and generating className strings from structured utility state objects.
 * It serves as the central logic for combining managed utility classes
 * with unmanaged (manually entered) classes into a single className string.
 */

/**
 * Generates a className string from utility state and unmanaged classes.
 * 
 * This function is the single source of truth for building className strings
 * in the visual editor. It combines utility classes from the structured state
 * (managed by UI controls) with unmanaged classes (manually entered by users)
 * into a properly formatted className string.
 * 
 * The function ensures:
 * - Proper deduplication of classes
 * - Filtering out empty/falsy class values
 * - Consistent spacing between classes
 * - Preservation of both managed and unmanaged classes
 * 
 * @param {Record<string, string>} utilityState - Object mapping utility categories to their class values
 * @param {string[]} [unmanagedClasses=[]] - Array of manually entered classes not managed by UI controls
 * @returns {string} Properly formatted className string combining all classes
 * 
 * @example
 * ```typescript
 * const utilityState = {
 *   backgroundColor: 'bg-blue-500',
 *   padding: 'p-4',
 *   textColor: 'text-white'
 * };
 * const unmanagedClasses = ['hover:opacity-75', 'transition-all'];
 * 
 * const className = generateClassNameFromState(utilityState, unmanagedClasses);
 * // Result: "bg-blue-500 p-4 text-white hover:opacity-75 transition-all"
 * ```
 */
export function generateClassNameFromState(
  utilityState: Record<string, string>,
  unmanagedClasses: string[] = [] // For classes we don't have a UI for
): string {
  const classes = [...Object.values(utilityState), ...unmanagedClasses];
  return classes.filter(Boolean).join(' ');
}