import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useTheme } from '@/contexts/ThemeContext';
import { useComponentStore } from '@/store/componentStore';
import { CanvasContainer } from '../components/containers/CanvasContainer';
import { CodeEditorContainer } from '../components/containers/CodeEditorContainer';
import { NavigatorContainer } from '../components/containers/NavigatorContainer';
import { InspectorContainer } from '../components/containers/InspectorContainer';
import { motion, AnimatePresence } from 'framer-motion';

interface VibeLayoutProps {
  mainView: string;
  isInspectorVisible: boolean;
  isNavigatorVisible: boolean;
}

const VibeLayout: React.FC<VibeLayoutProps> = ({
  mainView,
  isInspectorVisible,
  isNavigatorVisible,
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