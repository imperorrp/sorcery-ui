/**
 * Navigation Bar Component
 *
 * Top navigation bar with branding, theme toggle, layout controls, and global actions.
 * Provides centralized control for all UI toggles, layout switching, and application features.
 *
 * Key Features:
 * - Branding and application title display
 * - View mode toggle (Canvas vs Code)
 * - Examples dropdown for loading predefined components
 * - Render button for processing components
 * - Configuration panel toggle (Vibe layout only)
 * - Panel visibility toggles (Inspector, Navigator)
 * - Layout mode switching (Vibe vs Experimental)
 * - Theme toggle (Light/Dark mode)
 * - Responsive design with proper spacing and alignment
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, Code, Palette, TreePine, Layout, Monitor, FileCode, Play, BookOpenCheck, SlidersHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Example } from '@/examples/examples';
import type { ComponentData } from '@/store/componentStore';

/**
 * Props for the Navbar component
 */
interface NavbarProps {
  layoutMode: string;
  mainView: string;
  isInspectorVisible: boolean;
  isNavigatorVisible: boolean;
  examples: Record<string, Example>;
  multiComponentExamples: Record<string, { activeId: string; components: ComponentData[] }>;
  isRendering: boolean;
  onLayoutModeChange: (mode: 'vibe' | 'experimental') => void;
  onMainViewChange: (view: 'canvas' | 'code') => void;
  onInspectorToggle: () => void;
  onNavigatorToggle: () => void;
  onExampleSelect: (key: string) => void;
  onRender: () => void;
  onConfigToggle: () => void;
}

/**
 * Main navigation component with branding, theme controls, and layout toggles.
 */
export const Navbar: React.FC<NavbarProps> = ({
  layoutMode,
  mainView,
  isInspectorVisible,
  isNavigatorVisible,
  examples,
  multiComponentExamples,
  isRendering,
  onLayoutModeChange,
  onMainViewChange,
  onInspectorToggle,
  onNavigatorToggle,
  onExampleSelect,
  onRender,
  onConfigToggle,
}) => {
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
          {/* View Toggle - Segmented Control Style */}
          <div className="flex rounded-lg border border-border p-1 bg-muted">
            <Button
              onClick={() => onMainViewChange('canvas')}
              variant={mainView === 'canvas' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
            >
              <Monitor className="h-4 w-4 mr-1" />
              Canvas
            </Button>
            <Button
              onClick={() => onMainViewChange('code')}
              variant={mainView === 'code' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
            >
              <FileCode className="h-4 w-4 mr-1" />
              Code
            </Button>
          </div>

          {/* Global Action Buttons */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm' className='flex items-center gap-2'>
                <BookOpenCheck className='h-4 w-4' />
                Examples
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background border border-border shadow-lg z-[100]">
              <DropdownMenuLabel>Load an Example</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                Single Component
              </DropdownMenuLabel>
              {Object.keys(examples).map((key) => {
                const example = examples[key as keyof typeof examples];
                return (
                  <DropdownMenuItem key={key} onSelect={() => onExampleSelect(key)}>
                    <div className="flex items-center justify-between w-full">
                      <span>{key}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({example.description})
                      </span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                Multi Component
              </DropdownMenuLabel>
              {multiComponentExamples && Object.keys(multiComponentExamples).map((key) => (
                <DropdownMenuItem key={key} onSelect={() => onExampleSelect(key)} className="font-medium">
                  <div className="flex items-center justify-between w-full">
                    <span>🚀 {key}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (Multi-component)
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={onRender}
            size="sm"
            variant="default"
            disabled={isRendering}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRendering ? 'Rendering...' : 'Render'}
          </Button>

          <Button
            onClick={onConfigToggle}
            variant="outline"
            size="sm"
            className="h-9"
            title="Open Component Configuration"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          {/* Panel Toggles */}
          <Button
            onClick={onInspectorToggle}
            variant={isInspectorVisible ? 'default' : 'outline'}
            size="sm"
            className="h-9"
            title={isInspectorVisible ? 'Hide Inspector' : 'Show Inspector'}
          >
            <Palette className="h-4 w-4" />
          </Button>

          <Button
            onClick={onNavigatorToggle}
            variant={isNavigatorVisible ? 'default' : 'outline'}
            size="sm"
            className="h-9"
            title={isNavigatorVisible ? 'Hide Navigator' : 'Show Navigator'}
          >
            <TreePine className="h-4 w-4" />
          </Button>

          {/* Layout Mode Toggle */}
          <Button
            onClick={() => onLayoutModeChange(layoutMode === 'vibe' ? 'experimental' : 'vibe')}
            variant="outline"
            size="sm"
            className="h-9"
            title={`Switch to ${layoutMode === 'vibe' ? 'Experimental' : 'Vibe'} layout`}
          >
            <Layout className="h-4 w-4" />
          </Button>

          {/* Theme Toggle */}
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
