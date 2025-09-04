/**
 * Live Component Editor - Main Application Component
 *
 * This is the root component of the Live Component Editor application. It provides
 * the overall application structure, theme management, and layout coordination.
 *
 * Architecture Overview:
 * - ThemeProvider: Manages light/dark theme state and transitions
 * - Navbar: Top navigation with branding and global controls
 * - EditorLayout: Main editing interface with panels and canvas
 *
 * Layout Structure:
 * - Full-screen container with proper overflow handling
 * - Theme-aware background colors with smooth transitions
 * - Responsive flex layout for navbar and main content
 * - Overflow management to prevent layout issues
 *
 * Key Features:
 * - Theme support with system preference detection
 * - Responsive design for different screen sizes
 * - Proper accessibility with semantic HTML structure
 * - Performance optimized with minimal re-renders
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { EditorLayout } from './components/EditorLayout';

/**
 * Root application component that orchestrates the entire Live Component Editor.
 *
 * This component serves as the main container and coordinator for all major
 * application features. It establishes the theme context, provides the basic
 * layout structure, and ensures proper component composition.
 *
 * @returns The complete Live Component Editor application interface
 */
function App() {
  return (
    <ThemeProvider>
      <div className="h-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          <EditorLayout />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
