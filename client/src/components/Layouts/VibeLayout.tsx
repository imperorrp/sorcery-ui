/**
 * VibeLayout Component - Alternative layout implementation with floating navigator panel
 *
 * This component provides an alternative layout design to the ExperimentalLayout, featuring
 * a compact design with inspector sidebar and floating navigator overlay. It offers a different
 * spatial organization that can be toggled between canvas and code editor views.
 *
 * Key features:
 * - Resizable inspector sidebar that can be hidden/shown
 * - Floating navigator panel with expand/minimize functionality
 * - Smooth animations for panel transitions using Framer Motion
 * - Theme-aware styling with glassmorphic effects
 * - Integrated undo/redo and apply changes functionality
 * - Selection mode management for canvas interaction
 *
 * The layout uses react-resizable-panels for responsive panel management and provides
 * a more traditional IDE-like experience compared to the grid-based ExperimentalLayout.
 *
 * @component
 * @param {VibeLayoutProps} props - Component props
 * @param {string} props.mainView - Current main view ('canvas' or 'code')
 * @param {boolean} props.isInspectorVisible - Whether the inspector sidebar is visible
 * @param {boolean} props.isNavigatorVisible - Whether the floating navigator is visible
 * @returns {JSX.Element} The rendered VibeLayout component with resizable panels and floating navigator
 */
import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTheme } from '@/contexts/ThemeContext';
import { useComponentStore } from '@/store/componentStore';
import { CanvasContainer } from '../containers/CanvasContainer';
import { CodeEditorContainer } from '../containers/CodeEditorContainer';
import { NavigatorContainer } from '../containers/NavigatorContainer';
import { InspectorContainer } from '../containers/InspectorContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '@/components/ui/notification';

interface VibeLayoutProps {
  mainView: string;
  isInspectorVisible: boolean;
  isNavigatorVisible: boolean;
  onRender: () => void | Promise<void>;
  isRendering: boolean;
}

const VibeLayout: React.FC<VibeLayoutProps> = ({
  mainView,
  isInspectorVisible,
  isNavigatorVisible,
  onRender,
  isRendering,
}) => {
  const { theme } = useTheme();
  const [isNavigatorExpanded, setIsNavigatorExpanded] = useState(false);

  /**
   * Handle navigator expand/minimize toggle
   */
  const handleNavigatorToggle = () => {
    setIsNavigatorExpanded(!isNavigatorExpanded);
  };

  // Get store state and actions
  const { selectionMode, setSelectionMode, updateActiveComponentCode, undo, redo, isDirty, isCodeHighlighted, clearCodeHighlight, applyAstChangesToCode } = useComponentStore();

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
  const { notify } = useNotification();
  const handleApplyChanges = async () => {
    const newCode = await applyAstChangesToCode();

    if (newCode) {
      // Success - code will update automatically
    } else {
      const { originalCode, jsxLocation } = useComponentStore.getState();
      if (!originalCode || !jsxLocation) {
        notify({ type: 'warning', title: 'Cannot apply changes', message: 'Click "Render" first to parse the component, then try again.' });
      } else {
        notify({ type: 'error', title: 'Apply failed', message: 'Failed to apply changes. Check the console for errors.' });
      }
    }
  };

  /**
   * Handle fullscreen toggle (placeholder for now)
   */
  const handleFullscreenToggle = () => {
    // TODO: Implement fullscreen logic for Vibe layout
  };
  return (
    <div className={`h-screen w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} relative`}>
      <PanelGroup direction="horizontal">
        {/* Left Sidebar - only render when inspector is visible */}
        {isInspectorVisible && (
          <>
            <Panel defaultSize={25} minSize={20} maxSize={40}>
              <div className={`h-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} border-r border-gray-700 flex flex-col`}>
                {/* Inspector Panel */}
                <div className="flex-1 overflow-hidden">
                  <InspectorContainer
                    canUndo={canUndo}
                    canRedo={canRedo}
                    isDirty={isDirty}
                    onUndo={undo}
                    onRedo={redo}
                    onApplyChanges={handleApplyChanges}
                  />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className={`w-1 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'} transition-colors`} />
          </>
        )}

        {/* Main Content Area */}
        <Panel defaultSize={isInspectorVisible ? 75 : 100}>
          <div className="h-full relative">
            {mainView === 'canvas' ? (
              <CanvasContainer
                selectionMode={selectionMode}
                isFullscreen={false}
                onSelectionModeChange={setSelectionMode}
                onFullscreenToggle={handleFullscreenToggle}
                onRender={onRender}
                isRendering={isRendering}
              />
            ) : (
              <CodeEditorContainer
                activeComponent={activeComponent}
                activeCode={activeCode}
                onCodeChange={handleCodeChange}
              />
            )}

            {/* Floating Navigator Panel */}
            <AnimatePresence>
              {isNavigatorVisible && (
                <motion.div
                  className={isNavigatorExpanded ? "glassmorphic-panel-expanded" : "glassmorphic-panel"}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.3
                  }}
                >
                  <NavigatorContainer
                    isExpanded={isNavigatorExpanded}
                    onToggleExpanded={handleNavigatorToggle}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default VibeLayout;