/**
 * Vibe Layout - Traditional IDE-style Editor Layout
 *
 * Alternative layout implementation with a floating navigator panel that can be expanded/minimized.
 * Features a compact design with inspector sidebar and floating navigator overlay,
 * including expand/minimize functionality for better space utilization.
 *
 * @author Sorcery UI Team
 */

import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTheme } from '@/contexts/ThemeContext';
import { useComponentStore } from '@/store/componentStore';
import { useResponsive } from '@/hooks/useResponsive';
import { CanvasContainer } from '../components/containers/CanvasContainer';
import { CodeEditorContainer } from '../components/containers/CodeEditorContainer';
import { NavigatorContainer } from '../components/containers/NavigatorContainer';
import { InspectorContainer } from '../components/containers/InspectorContainer';
import { ConfigurerContainer } from '../components/containers/ConfigurerContainer';
import { MobileLayout } from './MobileLayout';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Props for the VibeLayout component.
 */
interface VibeLayoutProps {
  mainSection: 'preview' | 'code' | 'config';
  isInspectorVisible: boolean;
  isNavigatorVisible: boolean;
  onNavigatorToggle?: () => void;
}

const VibeLayout: React.FC<VibeLayoutProps> = ({
  mainSection,
  isInspectorVisible,
  isNavigatorVisible,
  onNavigatorToggle,
}) => {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();
  const [isNavigatorExpanded, setIsNavigatorExpanded] = useState(false);

  /**
   * Handle navigator expand/minimize toggle
   */
  const handleNavigatorToggle = () => {
    setIsNavigatorExpanded(!isNavigatorExpanded);
  };

  // Get store state and actions
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
  const activeComponent = useComponentStore((state) =>
    state.activeComponentId ? state.components[state.activeComponentId] : null
  );
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
      // Success - code will update automatically
      await renderActiveComponent();
    } else {
      const { originalCode, jsxLocation } = useComponentStore.getState();
      if (!originalCode || !jsxLocation) {
        alert('Cannot apply changes yet. Click "Render" first to parse the component, then try again.');
      } else {
        alert('Failed to apply changes. Check the console for errors.');
      }
    }
  };

  /**
   * Handle fullscreen toggle (placeholder for now)
   */
  const handleFullscreenToggle = () => {
    // TODO: Implement fullscreen logic for Vibe layout
  };

  // Use mobile layout for small screens
  if (isMobile) {
    const mobileInitialView =
      mainSection === 'preview' ? 'canvas' : mainSection === 'code' ? 'code' : 'config';
    return <MobileLayout mainView={mobileInitialView} />;
  }

  // Desktop layout with resizable panels
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
            {mainSection === 'preview' && (
              <CanvasContainer
                selectionMode={selectionMode}
                isFullscreen={false}
                onSelectionModeChange={setSelectionMode}
                onFullscreenToggle={handleFullscreenToggle}
                onRender={renderActiveComponent}
                isRendering={isRendering}
              />
            )}
            {mainSection === 'code' && (
              <CodeEditorContainer
                activeComponent={activeComponent}
                activeCode={activeCode}
                onCodeChange={handleCodeChange}
              />
            )}
            {mainSection === 'config' && (
              <div className="h-full overflow-hidden">
                <ConfigurerContainer />
              </div>
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
                    onMinimize={onNavigatorToggle}
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