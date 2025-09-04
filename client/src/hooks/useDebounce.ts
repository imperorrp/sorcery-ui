/**
 * Debounce Hooks - Performance Optimization Utilities
 *
 * This module provides custom React hooks for debouncing values and function calls.
 * Debouncing is essential for optimizing performance in user interfaces by reducing
 * the frequency of expensive operations like API calls, state updates, or DOM manipulations.
 *
 * Key Features:
 * - Value debouncing for input fields and search
 * - Callback debouncing for API calls and computations
 * - TypeScript support with generic types
 * - Automatic cleanup to prevent memory leaks
 * - Configurable delay timing
 *
 * Use Cases:
 * - Search input with API calls (wait for user to stop typing)
 * - Window resize handlers (avoid excessive re-calculations)
 * - Form validation (delay validation until user stops typing)
 * - Auto-save functionality (save after user stops editing)
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value or function call.
 * Useful for delaying expensive operations like API calls or state updates
 * until the user has stopped interacting for a specified delay period.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on delay change or unmount)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook that debounces a callback function.
 * Useful for debouncing function calls like API requests or expensive computations.
 *
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @param deps - Dependencies array for the callback
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  }) as T;

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Update deps effect to clear timer when dependencies change
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return debouncedCallback;
}
