import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useComponentStore } from '@/store/componentStore';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { FloatingDock } from '@/components/ui/floating-dock';
import { useNotification } from '@/components/ui/notification';
import { IconCode, IconLayoutSidebar, IconTree, IconPalette } from '@tabler/icons-react';
import { InspectorContainer } from './containers/InspectorContainer';
import { NavigatorContainer } from './containers/NavigatorContainer';
import { CodeEditorContainer } from './containers/CodeEditorContainer';
import { CanvasContainer } from './containers/CanvasContainer';
import { ConfigurerContainer } from './containers/ConfigurerContainer';

/**
 * Main editor layout component that manages the entire application interface.
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
 * @author Sorcery UI Team
 * @returns {JSX.Element} The complete editor layout with all panels and functionality
 */
export const EditorLayout: React.FC = () => {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Panel visibility state for dock system
  const [isCodeEditorVisible, setIsCodeEditorVisible] = useState(true);
  const [isInspectorVisible, setIsInspectorVisible] = useState(true);
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(true);
  const [isConfigurerVisible, setIsConfigurerVisible] = useState(true);

  // Remember panel states before entering fullscreen
  const [preFullscreenStates, setPreFullscreenStates] = useState({
    codeEditor: true,
    inspector: true,
    navigator: true,
    configurer: true
  });

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

  const {
    selectionMode,
    setSelectionMode,
    applyAstChangesToCode,
    isCodeHighlighted,
    clearCodeHighlight,
    undo,
    redo,
    isDirty,
    updateActiveComponentCode,
    renderActiveComponent,
    isRendering,
  } = useComponentStore();

  // Get the active component - access state directly through project structure
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
      await renderActiveComponent();
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
            onRender={renderActiveComponent}
            isRendering={isRendering}
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

      {/* Floating Dock for Panel Controls */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50">
        <FloatingDock
          items={[
            {
              title: isCodeEditorVisible ? "Hide Code Editor" : "Show Code Editor",
              icon: <IconCode className={`h-full w-full ${isCodeEditorVisible ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-300'}`} />,
              onClick: () => setIsCodeEditorVisible(!isCodeEditorVisible),
              isActive: isCodeEditorVisible,
            },
            {
              title: isConfigurerVisible ? "Hide Configurer" : "Show Configurer",
              icon: <IconLayoutSidebar className={`h-full w-full ${isConfigurerVisible ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-300'}`} />,
              onClick: () => setIsConfigurerVisible(!isConfigurerVisible),
              isActive: isConfigurerVisible,
            },
            {
              title: isInspectorVisible ? "Hide Style Editor" : "Show Style Editor",
              icon: <IconPalette className={`h-full w-full ${isInspectorVisible ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-300'}`} />,
              onClick: () => setIsInspectorVisible(!isInspectorVisible),
              isActive: isInspectorVisible,
            },
            {
              title: isNavigatorVisible ? "Hide Navigator" : "Show Navigator",
              icon: <IconTree className={`h-full w-full ${isNavigatorVisible ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-300'}`} />,
              onClick: () => setIsNavigatorVisible(!isNavigatorVisible),
              isActive: isNavigatorVisible,
            },
          ]}
        />
      </div>
    </div>
  );
};