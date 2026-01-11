import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/components/ui/notification';
import { useComponentStore } from '@/store/componentStore';
import { useResponsive } from '@/hooks/useResponsive';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { InspectorContainer } from '../components/containers/InspectorContainer';
import { NavigatorContainer } from '../components/containers/NavigatorContainer';
import { CodeEditorContainer } from '../components/containers/CodeEditorContainer';
import { CanvasContainer } from '../components/containers/CanvasContainer';
import { ConfigurerContainer } from '../components/containers/ConfigurerContainer';
import { MobileLayout } from './MobileLayout';

/**
 * Props for the ExperimentalLayout component
 */
interface ExperimentalLayoutProps {
  mainSection: 'preview' | 'code' | 'config';
  isFullscreen: boolean;
  isCodeEditorVisible: boolean;
  isInspectorVisible: boolean;
  isNavigatorVisible: boolean;
  isConfigurerVisible: boolean;
  isPreviewVisible: boolean;
  preFullscreenStates: {
    codeEditor: boolean;
    inspector: boolean;
    navigator: boolean;
    configurer: boolean;
    preview: boolean;
  };
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsCodeEditorVisible: (visible: boolean) => void;
  setIsInspectorVisible: (visible: boolean) => void;
  setIsNavigatorVisible: (visible: boolean) => void;
  setIsConfigurerVisible: (visible: boolean) => void;
  setIsPreviewVisible: (visible: boolean) => void;
  setPreFullscreenStates: (states: {
    codeEditor: boolean;
    inspector: boolean;
    navigator: boolean;
    configurer: boolean;
    preview: boolean;
  }) => void;
  onRender: () => Promise<void> | void;
  isRendering: boolean;
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
  mainSection,
  isFullscreen,
  isCodeEditorVisible,
  isInspectorVisible,
  isNavigatorVisible,
  isConfigurerVisible,
  isPreviewVisible,
  preFullscreenStates,
  setIsFullscreen,
  setIsCodeEditorVisible,
  setIsInspectorVisible,
  setIsNavigatorVisible,
  setIsConfigurerVisible,
  setIsPreviewVisible,
  setPreFullscreenStates,
  onRender,
  isRendering,
}) => {
  const { theme } = useTheme();
  const { isMobile } = useResponsive();

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
        configurer: isConfigurerVisible,
        preview: isPreviewVisible
      });
      setIsCodeEditorVisible(false);
      setIsInspectorVisible(false);
      setIsNavigatorVisible(false);
      setIsConfigurerVisible(false);
      setIsPreviewVisible(false);
    } else {
      // Exiting fullscreen - restore previous states
      setIsCodeEditorVisible(preFullscreenStates.codeEditor);
      setIsInspectorVisible(preFullscreenStates.inspector);
      setIsNavigatorVisible(preFullscreenStates.navigator);
      setIsConfigurerVisible(preFullscreenStates.configurer);
      setIsPreviewVisible(preFullscreenStates.preview);
    }
    setIsFullscreen(!isFullscreen);
  };

  const { selectionMode, setSelectionMode, applyAstChangesToCode, isCodeHighlighted, clearCodeHighlight, undo, redo, isDirty, updateActiveComponentCode } = useComponentStore();

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
  const { notify } = useNotification();
  const handleApplyChanges = async () => {
    const newCode = await applyAstChangesToCode();

    if (newCode) { // This block only runs on success
      // The editor will automatically update because it's controlled by the store
      // Highlighting is now handled by useEffect based on isCodeHighlighted state
      await onRender();
    } else { // This block now runs on failure
      // Let's check the store to give a specific reason
      const { originalCode, jsxLocation } = useComponentStore.getState();
      if (!originalCode || !jsxLocation) {
        notify({ type: 'warning', title: 'Cannot apply changes', message: 'Click "Render" first to parse the component, then try again.' });
      } else {
        notify({ type: 'error', title: 'Apply failed', message: 'Failed to apply changes. Check the console for errors.' });
      }
    }
  };

  // Use mobile layout for small screens
  if (isMobile) {
    const initialView = mainSection === 'preview' ? 'canvas' : mainSection === 'code' ? 'code' : 'config';
    return <MobileLayout mainView={initialView} />;
  }

  // Desktop layout with resizable panels
  return (
    <div className={`h-full w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`} data-layout-container>
      {/* Show message when no panels are open */}
      {!isPreviewVisible && !isCodeEditorVisible && !isConfigurerVisible && !isInspectorVisible && !isNavigatorVisible ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">👀</div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">No Panels Open</h2>
            <p className="text-muted-foreground mb-4">Open a panel from the navbar to continue editing</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setIsPreviewVisible(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Open Preview
              </button>
              <button
                onClick={() => setIsCodeEditorVisible(true)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Open Code Editor
              </button>
            </div>
          </div>
        </div>
      ) : (
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

          {/* Component Canvas Panel - Conditionally rendered */}
          {isPreviewVisible && (
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
                onRender={onRender}
                isRendering={isRendering}
              />
            </Panel>
          )}

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
                      <NavigatorContainer 
                        onMinimize={() => setIsNavigatorVisible(false)}
                      />
                    </Panel>
                  )}
                </PanelGroup>
              </Panel>
            </>
          )}
        </PanelGroup>
      )}
    </div>
  );
};