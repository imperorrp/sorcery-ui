import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useComponentStore } from '@/store/componentStore';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { InspectorContainer } from '../components/containers/InspectorContainer';
import { NavigatorContainer } from '../components/containers/NavigatorContainer';
import { CodeEditorContainer } from '../components/containers/CodeEditorContainer';
import { CanvasContainer } from '../components/containers/CanvasContainer';
import { ConfigurerContainer } from '../components/containers/ConfigurerContainer';

/**
 * Props for the ExperimentalLayout component
 */
interface ExperimentalLayoutProps {
  isFullscreen: boolean;
  isCodeEditorVisible: boolean;
  isInspectorVisible: boolean;
  isNavigatorVisible: boolean;
  isConfigurerVisible: boolean;
  preFullscreenStates: {
    codeEditor: boolean;
    inspector: boolean;
    navigator: boolean;
    configurer: boolean;
  };
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsCodeEditorVisible: (visible: boolean) => void;
  setIsInspectorVisible: (visible: boolean) => void;
  setIsNavigatorVisible: (visible: boolean) => void;
  setIsConfigurerVisible: (visible: boolean) => void;
  setPreFullscreenStates: (states: {
    codeEditor: boolean;
    inspector: boolean;
    navigator: boolean;
    configurer: boolean;
  }) => void;
}

/**
 * Experimental Layout component - Current main layout implementation.
 *
 * This component serves as the root container for all editor functionality,
 * coordinating between the code editor, component canvas, inspector, and
 * navigation panels. It handles:
 * - Panel layout and resizing management with react-resizable-panels
 * - Component rendering and code synchronization
 * - User interaction modes (selection vs interaction)
 * - Theme application and responsive design
 * - State synchronization across all panels
 * - Fullscreen mode with automatic panel hiding
 * - Floating dock for panel visibility controls
 *
 * @param {ExperimentalLayoutProps} props - Component props
 * @returns {JSX.Element} The complete editor layout with all panels and functionality
 */
export const ExperimentalLayout: React.FC<ExperimentalLayoutProps> = ({
  isFullscreen,
  isCodeEditorVisible,
  isInspectorVisible,
  isNavigatorVisible,
  isConfigurerVisible,
  preFullscreenStates,
  setIsFullscreen,
  setIsCodeEditorVisible,
  setIsInspectorVisible,
  setIsNavigatorVisible,
  setIsConfigurerVisible,
  setPreFullscreenStates,
}) => {
  const { theme } = useTheme();

  /**
   * Handle fullscreen toggle - hide/show all panels
   * Remembers panel states before entering fullscreen and restores them when exiting
   */
  const handleFullscreenToggle = () => {
    if (!isFullscreen) {
      // Entering fullscreen - remember current states and hide all panels
      setPreFullscreenStates({
        codeEditor: isCodeEditorVisible,
        inspector: isInspectorVisible,
        navigator: isNavigatorVisible,
        configurer: isConfigurerVisible
      });
      setIsCodeEditorVisible(false);
      setIsInspectorVisible(false);
      setIsNavigatorVisible(false);
      setIsConfigurerVisible(false);
    } else {
      // Exiting fullscreen - restore previous states
      setIsCodeEditorVisible(preFullscreenStates.codeEditor);
      setIsInspectorVisible(preFullscreenStates.inspector);
      setIsNavigatorVisible(preFullscreenStates.navigator);
      setIsConfigurerVisible(preFullscreenStates.configurer);
    }
    setIsFullscreen(!isFullscreen);
  };

  const { selectionMode, setSelectionMode, applyAstChangesToCode, isCodeHighlighted, clearCodeHighlight, undo, redo, isDirty, updateActiveComponentCode } = useComponentStore();

  // ▼▼▼ THIS IS THE FIX ▼▼▼
  // Create selectors to get the data for the *active* component.
  const activeComponent = useComponentStore((state) =>
    state.activeComponentId ? state.components[state.activeComponentId] : null
  );
  const activeCode = activeComponent?.code ?? '';
  const activeHistory = activeComponent?.history ?? [];
  const activeHistoryIndex = activeComponent?.historyIndex ?? 0;
  // ▲▲▲ END OF FIX ▲▲▲

  /**
   * Handle code changes from the editor
   *
   * @param {string} newCode - The updated code from the Monaco editor
   */
  const handleCodeChange = (newCode: string) => {
    updateActiveComponentCode(newCode);
    // If the user types, clear the highlight
    if (isCodeHighlighted) {
      clearCodeHighlight();
    }
  };

  const canUndo = activeHistoryIndex > 0;
  const canRedo = activeHistoryIndex < activeHistory.length - 1;

  /**
   * Handle applying visual changes back to the source code
   * Uses AST-based surgical updates to preserve component logic
   */
  const handleApplyChanges = async () => {
    const newCode = await applyAstChangesToCode();

    if (newCode) { // This block only runs on success
      // The editor will automatically update because it's controlled by the store
      // Highlighting is now handled by useEffect based on isCodeHighlighted state
    } else { // This block now runs on failure
      // Let's check the store to give a specific reason
      const { originalCode, jsxLocation } = useComponentStore.getState();
      if (!originalCode || !jsxLocation) {
        alert('Cannot apply changes yet. Click "Render" first to parse the component, then try again.');
      } else {
        alert('Failed to apply changes. Check the console for errors.');
      }
    }
  };

  return (
    <div className={`h-full w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`} data-layout-container>
      <PanelGroup direction="horizontal" className="h-full w-full">
        {/* Left Panel Group - Code Editor and Configurer */}
        {(isCodeEditorVisible || isConfigurerVisible) && (
          <>
            <Panel
              id="left-panels"
              defaultSize={35}
              minSize={20}
              order={1}
            >
              <PanelGroup direction="vertical">
                {/* Code Editor Panel - Conditionally rendered */}
                {isCodeEditorVisible && (
                  <>
                    <Panel
                      id="code-editor"
                      defaultSize={isConfigurerVisible ? 70 : 100}
                      minSize={30}
                      order={1}
                    >
                      <CodeEditorContainer
                        activeComponent={activeComponent}
                        activeCode={activeCode}
                        onCodeChange={handleCodeChange}
                      />
                    </Panel>
                    {isConfigurerVisible && (
                      <PanelResizeHandle className={`h-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'}`} />
                    )}
                  </>
                )}

                {/* Configurer Panel - Conditionally rendered */}
                {isConfigurerVisible && (
                  <Panel
                    id="configurer"
                    defaultSize={isCodeEditorVisible ? 30 : 100}
                    minSize={20}
                    order={2}
                  >
                    <ConfigurerContainer />
                  </Panel>
                )}
              </PanelGroup>
            </Panel>
            <PanelResizeHandle className={`w-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'}`} />
          </>
        )}

        {/* Component Canvas Panel - Always visible */}
        <Panel
          id="component-canvas"
          defaultSize={isFullscreen ? 100 : ((isCodeEditorVisible || isConfigurerVisible) ? 45 : 65)}
          minSize={30}
          order={2}
        >
          <CanvasContainer
            selectionMode={selectionMode}
            isFullscreen={isFullscreen}
            onSelectionModeChange={setSelectionMode}
            onFullscreenToggle={handleFullscreenToggle}
          />
        </Panel>

        {/* Right Panel Group - Conditionally rendered */}
        {(isInspectorVisible || isNavigatorVisible) && (
          <>
            <PanelResizeHandle className={`w-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'}`} />
            <Panel
              id="right-panels"
              defaultSize={20}
              minSize={15}
              order={3}
            >
              <PanelGroup direction="vertical">
                {/* Inspector Panel - Conditionally rendered */}
                {isInspectorVisible && (
                  <>
                    <Panel
                      id="inspector"
                      defaultSize={isNavigatorVisible ? 60 : 100}
                      minSize={25}
                      order={1}
                    >
                      <InspectorContainer
                        canUndo={canUndo}
                        canRedo={canRedo}
                        isDirty={isDirty}
                        onUndo={undo}
                        onRedo={redo}
                        onApplyChanges={handleApplyChanges}
                      />
                    </Panel>
                    {isNavigatorVisible && (
                      <PanelResizeHandle className={`h-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'}`} />
                    )}
                  </>
                )}

                {/* Navigator Panel - Conditionally rendered */}
                {isNavigatorVisible && (
                  <Panel
                    id="navigator"
                    defaultSize={isInspectorVisible ? 40 : 100}
                    minSize={20}
                    order={2}
                  >
                    <NavigatorContainer />
                  </Panel>
                )}
              </PanelGroup>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};