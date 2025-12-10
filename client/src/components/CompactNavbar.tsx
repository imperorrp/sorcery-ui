/**
 * Compact Navigation Bar Component
 *
 * Streamlined command surface that groups project selection, primary screen switching,
 * panel toggles, and global actions. Designed to mirror both Vibe and Experimental layouts.
 * Features responsive design with separate desktop and mobile experiences, keyboard shortcuts,
 * animated sliding pill indicators, and comprehensive project management dropdown.
 *
 * @author Sorcery UI Team
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import {
  Moon,
  Sun,
  Palette,
  TreePine,
  Monitor,
  FileCode,
  Settings2,
  BookOpenCheck,
  Wand2,
  Menu,
  X,
  ChevronDown,
  Plus,
  Eye,
  Code,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { SettingsDialog } from './SettingsDialog';
import { ComponentSwitcher } from './ComponentSwitcher';
import { DesignImportDialog } from './DesignImportDialog';
import type { Example } from '@/examples/examples';
import type { ComponentData } from '@/store/componentStore';

/**
 * SegmentOption - configuration for the primary screen segmented control.
 */
interface SegmentOption {
  id: 'preview' | 'code' | 'config';
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>; // lucide icon signature
}

/**
 * Props for the CompactNavbar component.
 */
interface CompactNavbarProps {
  currentProjectName: string;
  mainSection: 'preview' | 'code' | 'config';
  isInspectorVisible: boolean;
  isNavigatorVisible: boolean;
  examples: Record<string, Example>;
  multiComponentExamples: Record<string, { activeId: string; components: ComponentData[] }>;
  isRendering: boolean;
  onMainSectionChange: (section: 'preview' | 'code' | 'config') => void;
  onInspectorToggle: () => void;
  onNavigatorToggle: () => void;
  onExampleSelect: (key: string) => void;
  onRender: () => void;
  // Optional props for Experimental layout panel toggles
  isCodeEditorVisible?: boolean;
  isConfigurerVisible?: boolean;
  isPreviewVisible?: boolean;
  onCodeEditorToggle?: () => void;
  onConfigurerToggle?: () => void;
  onPreviewToggle?: () => void;
  // Layout switching
  currentLayout?: 'vibe' | 'experimental';
  onLayoutChange?: (layout: 'vibe' | 'experimental') => void;
}

/**
 * CompactNavbar - grouped navigation surface for editor screens.
 *
 * @param {CompactNavbarProps} props - configuration and callbacks
 * @returns {JSX.Element} The rendered navigation bar
 */
export const CompactNavbar: React.FC<CompactNavbarProps> = ({
  currentProjectName,
  mainSection,
  isInspectorVisible,
  isNavigatorVisible,
  examples,
  multiComponentExamples,
  isRendering,
  onMainSectionChange,
  onInspectorToggle,
  onNavigatorToggle,
  onExampleSelect,
  onRender,
  // Optional experimental layout props (used to determine mode)
  isCodeEditorVisible: _isCodeEditorVisible,
  isConfigurerVisible: _isConfigurerVisible,
  isPreviewVisible: _isPreviewVisible,
  onCodeEditorToggle,
  onConfigurerToggle,
  onPreviewToggle,
  // Layout switching
  currentLayout,
  onLayoutChange,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isMobile } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isDesignDialogOpen, setIsDesignDialogOpen] = useState(false);
  // Segmented control measurement refs/state
  const segContainerRef = useRef<HTMLDivElement | null>(null);
  const segButtonRefs = useRef<Record<SegmentOption['id'], HTMLButtonElement | null>>({
    preview: null,
    code: null,
    config: null,
  });
  const [pill, setPill] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const segmentOptions: SegmentOption[] = useMemo(
    () => [
      { id: 'preview', label: 'Preview', shortcut: 'Ctrl+1', icon: Monitor },
      { id: 'code', label: 'Code', shortcut: 'Ctrl+2', icon: FileCode },
      { id: 'config', label: 'Config', shortcut: 'Ctrl+3', icon: Settings2 },
    ],
    [],
  );

  const singleExamples = useMemo(() => Object.entries(examples), [examples]);
  const multiExamples = useMemo(
    () => Object.entries(multiComponentExamples || {}),
    [multiComponentExamples],
  );

  /**
   * handleKeyboardShortcuts - wires global shortcuts for power users.
   */
  useEffect(() => {
  /**
   * Handles keyboard shortcuts for navigation and actions.
   * @param e - The keyboard event
   */
  const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsShortcutsHelpOpen(true);
        return;
      }

      if (!(e.ctrlKey || e.metaKey)) {
        return;
      }

      const lowerKey = e.key.toLowerCase();

      if (lowerKey === 'r') {
        e.preventDefault();
        if (!isRendering) {
          onRender();
        }
        return;
      }

      if (lowerKey === 'b') {
        e.preventDefault();
        onInspectorToggle();
        return;
      }

      if (lowerKey === 'j') {
        e.preventDefault();
        onNavigatorToggle();
        return;
      }

      if (lowerKey === '1') {
        e.preventDefault();
        onMainSectionChange('preview');
        return;
      }

      if (lowerKey === '2') {
        e.preventDefault();
        onMainSectionChange('code');
        return;
      }

      if (lowerKey === '3' || lowerKey === 'k') {
        e.preventDefault();
        onMainSectionChange('config');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRendering, onRender, onInspectorToggle, onNavigatorToggle, onMainSectionChange]);

  /**
   * recalcPill - measures the active segment button and updates pill position/size.
   */
  const recalcPill = useCallback(() => {
    const container = segContainerRef.current;
    const btn = segButtonRefs.current[mainSection];
    if (!container || !btn) return;
    const cb = container.getBoundingClientRect();
    const bb = btn.getBoundingClientRect();
    const left = bb.left - cb.left + 2;
    const width = Math.max(bb.width - 4, 24);
    setPill({ left, width });
  }, [mainSection]);

  useEffect(() => {
    recalcPill();
  }, [recalcPill, mainSection, isMobile]);

  useEffect(() => {
  /**
   * Recalculates the sliding pill position on window resize.
   */
  const onResize = () => recalcPill();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [recalcPill]);

  /**
   * Renders the project menu items for the project dropdown. The result is a
   * card-based list of available Examples and Projects that supports both
   * single-component and multi-component example entries. The menu integrates
   * with project creation and selection behavior.
   *
   * @returns {JSX.Element} The dropdown menu content element
   */
  const renderProjectMenuItems = () => {
    // Combine all examples (single and multi-component)
    const allExamples = [
      ...singleExamples.map(([key, example]) => ({ key, example, isMulti: false })),
      ...multiExamples.map(([key]) => ({ 
        key, 
        example: { description: `Multi-component example: ${key}` } as Example, 
        isMulti: true 
      })),
    ];

    return (
      <DropdownMenuContent className="min-w-52 p-2">
        {/* Projects Card - Contains all project-related items */}
        <div className="border border-border/60 rounded-lg bg-muted/20 p-2 shadow-sm">
          {/* Projects Header */}
          <div className="px-2 py-1.5 mb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wide">Projects</span>
          </div>

          {/* Create New Project */}
          <DropdownMenuItem className="px-2 py-1.5 rounded-sm cursor-pointer mb-2">
            <Plus className="h-3.5 w-3.5 mr-2" />
            <span className="text-sm">New Project</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-2" />

          {/* Examples Subsection */}
          <div className="px-2 py-1 mb-1">
            <div className="flex items-center gap-1.5">
              <BookOpenCheck className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Examples</span>
            </div>
          </div>

          {/* Examples Container */}
          <div className="ml-2 mr-1 border-l border-border/50 pl-2 space-y-0.5">
            {allExamples.map(({ key, example, isMulti }) => {
              const isSelected = currentProjectName === key;

              return (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => {
                    onExampleSelect(key);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`relative px-2 py-1.5 rounded-sm cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/15 text-primary border-l-2 border-primary ml-2'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-2 w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-sm font-medium truncate ${
                          isSelected ? 'text-primary' : 'text-foreground'
                        }`}>
                          {key}
                        </span>
                        {isMulti && (
                          <span className="text-[8px] px-1 py-0.5 bg-muted/80 rounded text-muted-foreground shrink-0 uppercase tracking-wider">
                            Multi Component
                          </span>
                        )}
                      </div>
                      {example?.description && (
                        <span className="text-xs text-muted-foreground truncate block leading-tight">
                          {example.description}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        </div>
      </DropdownMenuContent>
    );
  };

  /**
   * DesktopNav - desktop experience with grouped controls.
   *
   * @returns {JSX.Element} Controls for larger screens
   */
  /**
   * Desktop navigation component with full layout controls.
   * @returns JSX for desktop navigation bar
   */
  const DesktopNav: React.FC = () => {
    // Determine if we're in Experimental mode (has panel toggle props)
    const isExperimentalMode = onCodeEditorToggle !== undefined || onConfigurerToggle !== undefined;

  // Sliding pill is measured via refs

    return (
      <div className="flex items-center gap-2">
        {/* Vibe Mode: Segmented Control with Sliding Pill */}
        {!isExperimentalMode && (
          <div className="relative inline-flex items-center rounded-lg bg-muted/50 p-0.5 border border-border/40 shadow-sm" ref={segContainerRef}>
            {/* Animated Sliding Pill Indicator */}
            <motion.div
              className="absolute top-0.5 bottom-0.5 rounded-md bg-primary/15 ring-1 ring-primary/30"
              initial={false}
              animate={{ left: pill.left, width: pill.width }}
              transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
            />

            {segmentOptions.map((segment) => {
              const Icon = segment.icon;
              const isActive = mainSection === segment.id;

              return (
                <Tooltip key={segment.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      ref={(el) => {
                        segButtonRefs.current[segment.id] = el;
                      }}
                      type="button"
                      onClick={() => onMainSectionChange(segment.id)}
                      className={`relative z-10 flex items-center gap-1.5 h-8 px-2.5 rounded-md transition-colors ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <motion.span
                        className="text-xs font-medium whitespace-nowrap overflow-hidden"
                        initial={false}
                        animate={{
                          width: isActive ? 'auto' : 0,
                          opacity: isActive ? 1 : 0,
                        }}
                        transition={{
                          width: { duration: 0.2, ease: 'easeInOut' },
                          opacity: { duration: 0.15 },
                        }}
                      >
                        {segment.label}
                      </motion.span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium">{segment.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{segment.shortcut}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}

          {/* Experimental Mode: Separate Icon Buttons */}
          {isExperimentalMode && (
            <>
              {/* Preview Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={onPreviewToggle}
                    className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                      _isPreviewVisible
                        ? 'bg-primary/15 ring-1 ring-primary/30 text-foreground'
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                    whileHover={{ scale: 1.08, rotate: _isPreviewVisible ? 0 : 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Eye className="h-4 w-4" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">Preview</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ctrl+1</p>
                </TooltipContent>
              </Tooltip>

              {/* Code Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={onCodeEditorToggle}
                    className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                      _isCodeEditorVisible
                        ? 'bg-primary/15 ring-1 ring-primary/30 text-foreground'
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                    whileHover={{ scale: 1.08, rotate: _isCodeEditorVisible ? 0 : -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Code className="h-4 w-4" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">Code</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ctrl+2</p>
                </TooltipContent>
              </Tooltip>

              {/* Config Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={onConfigurerToggle}
                    className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                      _isConfigurerVisible
                        ? 'bg-primary/15 ring-1 ring-primary/30 text-foreground'
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                    whileHover={{ scale: 1.08, rotate: _isConfigurerVisible ? 0 : 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Settings className="h-4 w-4" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">Config</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Ctrl+3</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {/* Divider - only in Vibe mode */}
          {!isExperimentalMode && (
            <div className="h-6 mx-2 border-l border-border/60" />
          )}

          {/* Inspector Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onInspectorToggle}
                className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                  isInspectorVisible
                    ? 'bg-primary/15 ring-1 ring-primary/30 text-foreground'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
                whileHover={{ scale: 1.08, rotate: isInspectorVisible ? 0 : 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Palette className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">Inspector</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Ctrl+B</p>
            </TooltipContent>
          </Tooltip>

          {/* Navigator Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={onNavigatorToggle}
                className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                  isNavigatorVisible
                    ? 'bg-primary/15 ring-1 ring-primary/30 text-foreground'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
                whileHover={{ scale: 1.08, rotate: isNavigatorVisible ? 0 : -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <TreePine className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">Navigator</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Ctrl+J</p>
            </TooltipContent>
          </Tooltip>

          {/* AI Design Import */}
          <DesignImportDialog 
            open={isDesignDialogOpen} 
            onOpenChange={setIsDesignDialogOpen} 
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => setIsDesignDialogOpen(true)}
                className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <Wand2 className="h-4 w-4" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">AI Design Import</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Generate from Image</p>
            </TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="h-6 mx-2 border-l border-border/60" />

          {/* Render button intentionally removed from navbar per design */}
        </div>
    );
  };

  /**
   * MobileNav - collapsible command center for small screens.
   *
   * @returns {JSX.Element} Sheet-based mobile controls
   */
  /**
   * Mobile navigation component using Sheet for responsive design.
   * @returns JSX for mobile navigation sheet
   */
  const MobileNav: React.FC = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Editor Controls</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-between">
                <span className="truncate">{currentProjectName}</span>
                <ChevronDown className="h-4 w-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            {renderProjectMenuItems()}
          </DropdownMenu>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Main Section</p>
            <div className="flex flex-col gap-2">
              {segmentOptions.map((segment) => {
                const Icon = segment.icon;
                return (
                  <Button
                    key={segment.id}
                    variant={mainSection === segment.id ? 'default' : 'outline'}
                    className="justify-start gap-3"
                    onClick={() => {
                      onMainSectionChange(segment.id);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{segment.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Panels</p>
            <Button
              variant={isInspectorVisible ? 'default' : 'outline'}
              className="justify-start gap-3"
              onClick={() => {
                onInspectorToggle();
                setIsMobileMenuOpen(false);
              }}
            >
              <Palette className="h-4 w-4" />
              Inspector
            </Button>
            <Button
              variant={isNavigatorVisible ? 'default' : 'outline'}
              className="justify-start gap-3"
              onClick={() => {
                onNavigatorToggle();
                setIsMobileMenuOpen(false);
              }}
            >
              <TreePine className="h-4 w-4" />
              Navigator
            </Button>
          </div>

          <Button
            variant="outline"
            className="justify-start gap-3"
            onClick={() => {
              toggleTheme();
              setIsMobileMenuOpen(false);
            }}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Switch Theme
          </Button>

          <div className="pt-2 border-t border-border/50">
            <SettingsDialog
              currentLayout={currentLayout || 'vibe'}
              onLayoutChange={(layout) => {
                onLayoutChange?.(layout);
                setIsMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
  <nav className="h-12 px-4 border-b bg-card border-border flex items-center justify-between shadow-sm">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-4 min-w-0">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="text-primary"
              >
                <Wand2 className="h-5 w-5" />
              </motion.div>
              {!isMobile && (
                <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  Sorcery UI
                </span>
              )}
            </Link>

            {/* Project Selector - Compact & Stylish */}
            {!isMobile && (
              <div className="flex items-center gap-2">
                <div className="h-5 mx-2 border-l border-border/60" />
                
                {/* Project Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      className="h-8 px-2.5 rounded-md flex items-center gap-1.5 hover:bg-muted/50 transition-colors group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <BookOpenCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">{currentProjectName}</span>
                      <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </motion.button>
                  </DropdownMenuTrigger>
                  {renderProjectMenuItems()}
                </DropdownMenu>

                {/* Component Switcher */}
                <ComponentSwitcher />
              </div>
            )}

            {/* All Control Buttons - Moved to left side */}
            {!isMobile && <DesktopNav />}
          </div>

          {/* Right Side - Settings and Theme */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              {/* Settings Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <SettingsDialog
                    currentLayout={currentLayout || 'vibe'}
                    onLayoutChange={onLayoutChange || (() => {})}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">Settings</p>
                </TooltipContent>
              </Tooltip>

              {/* Theme Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={toggleTheme}
                    className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.08, rotate: 15 }}
                    whileTap={{ scale: 0.95, rotate: -15 }}
                  >
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">Switch Theme</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {isMobile && <MobileNav />}
        </TooltipProvider>
      </nav>

      <KeyboardShortcutsHelp open={isShortcutsHelpOpen} onOpenChange={setIsShortcutsHelpOpen} />
    </>
  );
};
