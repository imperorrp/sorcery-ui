/**
 * Theme Context - Global Theme Management
 *
 * This module provides a React context for managing the application's theme state.
 * It handles light/dark mode switching, persistence to localStorage, and automatic
 * application of theme classes to the document root.
 *
 * Key Features:
 * - Light and dark theme support
 * - Automatic system preference detection (future enhancement)
 * - Persistent theme selection using localStorage
 * - Type-safe theme management with TypeScript
 * - Smooth theme transitions with CSS classes
 *
 * Architecture:
 * - React Context for global state management
 * - Custom hook (useTheme) for consuming theme state
 * - ThemeProvider component for wrapping the application
 * - Automatic DOM manipulation for theme application
 *
 * Usage:
 * ```tsx
 * import { useTheme } from './contexts/ThemeContext';
 *
 * function MyComponent() {
 *   const { theme, toggleTheme } = useTheme();
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current theme: {theme}
 *     </button>
 *   );
 * }
 * ```
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * React context for theme state management.
 * Provides theme value and toggle function to all consuming components.
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Custom hook for accessing theme context.
 *
 * This hook provides access to the current theme state and theme toggle function.
 * It must be used within a component that is wrapped by ThemeProvider.
 *
 * @returns Object containing current theme and toggle function
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme provider component that manages global theme state.
 *
 * This component provides theme context to all child components and handles:
 * - Initial theme detection from localStorage
 * - Theme application to document root
 * - Theme persistence to localStorage
 * - Theme toggle functionality
 *
 * @param children - Child components that will have access to theme context
 * @returns ThemeProvider wrapper component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    // Only add 'dark' class for dark theme, remove all classes for light theme
    if (theme === 'dark') {
      root.classList.add('dark');
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
