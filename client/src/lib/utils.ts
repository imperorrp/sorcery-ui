/**
 * Utility Functions Library
 *
 * This module provides common utility functions used throughout the Live Component Editor.
 * These utilities help with CSS class management, conditional styling, and other common
 * operations that improve code maintainability and developer experience.
 *
 * Key Features:
 * - CSS class name merging and conditional application
 * - Tailwind CSS class conflict resolution
 * - Type-safe utility functions with proper TypeScript support
 *
 * Dependencies:
 * - clsx: For conditional class name joining
 * - tailwind-merge: For intelligent Tailwind CSS class merging
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

import clsx from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Conditionally merges and combines CSS class names with Tailwind CSS conflict resolution.
 *
 * This utility function combines the power of clsx for conditional class application
 * with tailwind-merge for intelligent conflict resolution. It handles:
 * - Conditional class application based on boolean values
 * - Null/undefined value filtering
 * - Tailwind CSS class conflict resolution (e.g., "text-red-500 text-blue-500" → "text-blue-500")
 * - Multiple input types (strings, arrays, objects)
 *
 * @param inputs - Variable number of class name inputs (strings, undefined, null, false)
 * @returns A merged and deduplicated class name string
 * @example
 * // Basic usage
 * cn("bg-red-500", isActive && "text-white", null, false && "hidden")
 * // → "bg-red-500 text-white"
 *
 * // With Tailwind conflict resolution
 * cn("text-red-500", "text-blue-500")
 * // → "text-blue-500" (last conflicting class wins)
 *
 * // With conditional objects
 * cn({ "bg-blue-500": isPrimary, "bg-gray-500": !isPrimary })
 * // → "bg-blue-500" or "bg-gray-500"
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(clsx(inputs))
}
