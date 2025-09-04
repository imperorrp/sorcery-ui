/**
 * Navigation Bar Component
 *
 * Top navigation bar with branding and theme toggle functionality.
 * Provides consistent header across the application with theme switching.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Code } from 'lucide-react';

/**
 * Main navigation component with branding and theme controls.
 */
export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className={`px-6 py-3 border-b ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Code className={`h-6 w-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Live Component Editor
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            className={`flex items-center space-x-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
};
