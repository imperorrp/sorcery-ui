/**
 * Mobile Layout Component
 *
 * Responsive layout system for mobile devices that replaces react-resizable-panels
 * with a tabbed/stacked interface optimized for small screens and touch interactions.
 *
 * Features:
 * - Bottom tab bar for switching between panels (Code, Canvas, Inspector, Navigator)
 * - Full-screen panels with smooth transitions
 * - Swipe gestures for panel switching
 * - Touch-optimized UI elements
 * - Floating action button for quick actions
 *
 * @author Sorcery UI Team
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useComponentStore } from '@/store/componentStore';
import { CanvasContainer } from '../components/containers/CanvasContainer';
import { CodeEditorContainer } from '../components/containers/CodeEditorContainer';
import { NavigatorContainer } from '../components/containers/NavigatorContainer';
import { InspectorContainer } from '../components/containers/InspectorContainer';
import { ConfigurerContainer } from '../components/containers/ConfigurerContainer';
import { Button } from '@/components/ui/button';
import { FileCode, Monitor, Palette, TreePine, Settings, Play } from 'lucide-react';

/**
 * Available mobile panels
 */
type MobilePanel = 'code' | 'canvas' | 'inspector' | 'navigator' | 'config';

interface MobileLayoutProps {
  mainView?: 'canvas' | 'code' | 'config';
}

/**
 * Tab configuration for bottom navigation
 */
const tabs = [
  { id: 'code' as MobilePanel, icon: FileCode, label: 'Code' },
  { id: 'canvas' as MobilePanel, icon: Monitor, label: 'Canvas' },
  { id: 'inspector' as MobilePanel, icon: Palette, label: 'Styles' },
  { id: 'navigator' as MobilePanel, icon: TreePine, label: 'Tree' },
  { id: 'config' as MobilePanel, icon: Settings, label: 'Config' },
];

/**
 * MobileLayout - Touch-optimized layout for mobile devices
 *
 * @param {MobileLayoutProps} props - Component props
 * @returns {JSX.Element} The mobile layout component
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({ mainView = 'canvas' }) => {
  const { theme } = useTheme();
  const [activePanel, setActivePanel] = useState<MobilePanel>(mainView as MobilePanel);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    setActivePanel(mainView as MobilePanel);
  }, [mainView]);

  // Store state and actions
  const {
    selectionMode,
    setSelectionMode,
    updateActiveComponentCode,
    undo,
    redo,
    isDirty,
    isCodeHighlighted,
    clearCodeHighlight,
    applyAstChangesToCode,
    renderActiveComponent,
    isRendering,
  } = useComponentStore();

  // Get active component data
  const activeProjectId = useComponentStore((state) => state.activeProjectId);
  const projects = useComponentStore((state) => state.projects);
  
  const activeProject = activeProjectId ? projects[activeProjectId] : null;
  const activeComponentId = activeProject?.activeComponentId ?? null;
  const activeComponent = activeComponentId && activeProject 
    ? activeProject.components[activeComponentId] 
    : null;
  
  const activeCode = activeComponent?.code ?? '';
  const activeHistory = activeComponent?.history ?? [];
  const activeHistoryIndex = activeComponent?.historyIndex ?? 0;

  const canUndo = activeHistoryIndex > 0;
  const canRedo = activeHistoryIndex < activeHistory.length - 1;

  /**
   * Handle code changes from the editor
   */
  const handleCodeChange = (newCode: string) => {
    updateActiveComponentCode(newCode);
    if (isCodeHighlighted) {
      clearCodeHighlight();
    }
  };

  /**
   * Handle applying visual changes back to the source code
   */
  const handleApplyChanges = async () => {
    const newCode = await applyAstChangesToCode();

    if (newCode) {
      await renderActiveComponent();
      return;
    }

    const { originalCode, jsxLocation } = useComponentStore.getState();
    if (!originalCode || !jsxLocation) {
      alert('Cannot apply changes yet. Click "Render" first to parse the component, then try again.');
    } else {
      alert('Failed to apply changes. Check the console for errors.');
    }
  };

  /**
   * Handle swipe gestures for panel navigation
   */
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const swipeVelocityThreshold = 500;

    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > swipeVelocityThreshold) {
      const currentIndex = tabs.findIndex(tab => tab.id === activePanel);
      
      if (info.offset.x > 0 && currentIndex > 0) {
        // Swipe right - go to previous panel
        setSwipeDirection('right');
        setActivePanel(tabs[currentIndex - 1].id);
      } else if (info.offset.x < 0 && currentIndex < tabs.length - 1) {
        // Swipe left - go to next panel
        setSwipeDirection('left');
        setActivePanel(tabs[currentIndex + 1].id);
      }
    }
  };

  /**
   * Render the active panel content
   */
  const renderPanelContent = (panelId: MobilePanel) => {
    switch (panelId) {
      case 'code':
        return (
          <CodeEditorContainer
            activeComponent={activeComponent}
            activeCode={activeCode}
            onCodeChange={handleCodeChange}
          />
        );
      case 'canvas':
        return (
          <CanvasContainer
            selectionMode={selectionMode}
            isFullscreen={false}
            onSelectionModeChange={setSelectionMode}
            onFullscreenToggle={() => {}}
            onRender={renderActiveComponent}
            isRendering={isRendering}
          />
        );
      case 'inspector':
        return (
          <InspectorContainer
            canUndo={canUndo}
            canRedo={canRedo}
            isDirty={isDirty}
            onUndo={undo}
            onRedo={redo}
            onApplyChanges={handleApplyChanges}
          />
        );
      case 'navigator':
        return <NavigatorContainer />;
      case 'config':
        return <ConfigurerContainer />;
      default:
        return null;
    }
  };

  /**
   * Animation variants for panel transitions
   */
  const panelVariants = {
    enter: (direction: 'left' | 'right' | null) => ({
      x: direction === 'left' ? 300 : direction === 'right' ? -300 : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right' | null) => ({
      x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
      opacity: 0,
    }),
  };

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Main Content Area with Swipe */}
      <div className="flex-1 overflow-hidden relative">
        {/* Swipe Indicator - shows which panel is active */}
        <div className={`
          absolute top-0 left-0 right-0 h-1 z-10
          ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}
        `}>
          <motion.div
            className={`h-full ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'}`}
            initial={false}
            animate={{
              width: `${(1 / tabs.length) * 100}%`,
              x: `${tabs.findIndex(tab => tab.id === activePanel) * 100}%`,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        <AnimatePresence initial={false} custom={swipeDirection} mode="wait">
          <motion.div
            key={activePanel}
            custom={swipeDirection}
            variants={panelVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="h-full w-full absolute top-0 left-0"
          >
            {renderPanelContent(activePanel)}
          </motion.div>
        </AnimatePresence>

        {/* Floating Action Button - Render */}
        {activePanel === 'canvas' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-20 right-4 z-50"
          >
            <Button
              onClick={renderActiveComponent}
              size="lg"
              variant="default"
              disabled={isRendering}
              className="h-14 w-14 rounded-full shadow-lg"
            >
              <Play className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className={`
        h-16 border-t flex items-center justify-around px-2 shrink-0
        ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
      `}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePanel === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSwipeDirection(null);
                setActivePanel(tab.id);
              }}
              className={`
                flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg
                transition-colors min-w-[60px]
                ${isActive
                  ? theme === 'dark'
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-blue-600 bg-blue-50'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
