/**
 * Navigation Bar Component
 *
 * Top navigation bar with branding and theme toggle functionality.
 * Provides consistent header across the application with theme switching.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Code, Library } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LibraryPanel } from '@/components/Library/LibraryPanel';

/**
 * Main navigation component with branding and theme controls.
 */
export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

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
          <Sheet open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Library className="h-4 w-4" />
                <span>Library</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 bg-background">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Component Library</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-auto">
                <LibraryPanel />
              </div>
            </SheetContent>
          </Sheet>

          <div className="h-6 w-px bg-border" />

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
