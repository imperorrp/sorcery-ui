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
    <nav className="px-6 py-3 border-b bg-card border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Code className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">
              Live Component Editor
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="h-9 w-9"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
};
