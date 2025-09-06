/**
 * Editor Layout Component - Main Application Interface
 *
 * This is the core layout component that orchestrates the entire Live Component Editor interface.
 * It manages the three-panel layout system (Navigator, Code Editor, Canvas/Inspector) and coordinates
 * all the major functionality including rendering, code editing, component inspection, and user interactions.
 *
 * Key Features:
 * - Three-panel resizable layout (Navigator, Editor, Inspector)
 * - Library panel for component selection and examples
 * - Monaco code editor integration with syntax highlighting
 * - Live component canvas with interactive selection
 * - Inspector panel for props, styles, and component settings
 * - Undo/redo functionality with history management
 * - Theme-aware styling with dark/light mode support
 * - Responsive design with panel minimization controls
 * - Persistent layout preferences using localStorage
 *
 * Architecture:
 * - Uses react-resizable-panels for smooth panel resizing
 * - Integrates with Zustand store for state management
 * - Implements custom hooks for layout management
 * - Handles complex state synchronization between panels
 * - Manages component lifecycle and rendering pipeline
 *
 * Panel Structure:
 * 1. Library Panel (leftmost): Component library and examples
 * 2. Navigator Panel: Component tree and structure navigation
 * 3. Code Editor Panel: Monaco editor for code editing
 * 4. Canvas Panel: Live component rendering and interaction
 * 5. Inspector Panel: Component properties and styling controls
 *
 * State Management:
 * - Component store integration for multi-component support
 * - Active component tracking and switching
 * - Code highlighting and selection synchronization
 * - History management for undo/redo operations
 * - Layout persistence and restoration
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

import React, { useRef, useState } from 'react';
import { MonacoEditor } from './CodeEditor/MonacoEditor';
import type { MonacoEditorRef } from './CodeEditor/MonacoEditor';
import { ComponentCanvas } from './Canvas/ComponentCanvas';
import { InspectorPanel } from './Inspector/InspectorPanel';
import { ComponentTree } from '@/components/Navigator/ComponentTree';
import { useTheme } from '@/contexts/ThemeContext';
import { Undo2, Redo2, Check, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComponentStore } from '@/store/componentStore';
import { renderCodeToAst } from '@/lib/renderer';
import { examples, multiComponentExamples } from '@/examples/examples';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { FloatingDock } from '@/components/ui/floating-dock';
import { IconCode, IconLayoutSidebar, IconTree } from '@tabler/icons-react';

/**
 * Main editor layout component that manages the entire application interface.
 *
 * This component serves as the root container for all editor functionality,
 * coordinating between the code editor, component canvas, inspector, and
 * navigation panels. It handles:
 * - Panel layout and resizing management
 * - Component rendering and code synchronization
 * - User interaction modes (selection vs interaction)
 * - Theme application and responsive design
 * - State synchronization across all panels
 *
 * @returns The complete editor layout with all panels and functionality
 */
export const EditorLayout: React.FC = () => {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Panel visibility state for dock system
  const [isCodeEditorVisible, setIsCodeEditorVisible] = useState(true);
  const [isInspectorVisible, setIsInspectorVisible] = useState(true);
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(true);
  
  // Remember panel states before entering fullscreen
  const [preFullscreenStates, setPreFullscreenStates] = useState({
    codeEditor: true,
    inspector: true,
    navigator: true
  });
  
  // Handle fullscreen toggle - hide/show all panels
  const handleFullscreenToggle = () => {
    if (!isFullscreen) {
      // Entering fullscreen - remember current states and hide all panels
      setPreFullscreenStates({
        codeEditor: isCodeEditorVisible,
        inspector: isInspectorVisible,
        navigator: isNavigatorVisible
      });
      setIsCodeEditorVisible(false);
      setIsInspectorVisible(false);
      setIsNavigatorVisible(false);
    } else {
      // Exiting fullscreen - restore previous states
      setIsCodeEditorVisible(preFullscreenStates.codeEditor);
      setIsInspectorVisible(preFullscreenStates.inspector);
      setIsNavigatorVisible(preFullscreenStates.navigator);
    }
    setIsFullscreen(!isFullscreen);
  };
  
  const { selectionMode, setSelectionMode, setRenderOutput, applyAstChangesToCode, isCodeHighlighted, clearCodeHighlight, undo, redo, isDirty, updateActiveComponentCode, setPropsJson, setDependencies, loadExampleSet } = useComponentStore();
  
  // ▼▼▼ THIS IS THE FIX ▼▼▼
  // Create selectors to get the data for the *active* component.
  const activeComponent = useComponentStore((state) =>
    state.activeComponentId ? state.components[state.activeComponentId] : null
  );
  const activeCode = activeComponent?.code ?? '';
  const activeHistory = activeComponent?.history ?? [];
  const activeHistoryIndex = activeComponent?.historyIndex ?? 0;
  // ▲▲▲ END OF FIX ▲▲▲
  
  // Handle code changes from the editor
  const handleCodeChange = (newCode: string) => {
    updateActiveComponentCode(newCode);
    // If the user types, clear the highlight
    if (isCodeHighlighted) {
      clearCodeHighlight();
    }
  };

  const monacoEditorRef = useRef<MonacoEditorRef>(null);
  const canUndo = activeHistoryIndex > 0;
  const canRedo = activeHistoryIndex < activeHistory.length - 1;

  // Move examples data and handler logic here
  const handleExampleSelect = (key: string) => {
    // Handle multi-component examples
    if (multiComponentExamples[key]) {
      const multiExample = multiComponentExamples[key];
      loadExampleSet(multiExample.components, multiExample.activeId);
      return;
    }

    // Handle regular examples
    const ex = examples[key as keyof typeof examples];
    if (ex) {
      updateActiveComponentCode(ex.code);
      if (ex.props) {
        setPropsJson(JSON.stringify(ex.props, null, 2));
      } else {
        setPropsJson('{}');
      }
      if (ex.dependency) {
        setDependencies([ex.dependency]);
      } else {
        setDependencies([]);
      }
    }
  };

  const handleRender = async () => {
    if (!monacoEditorRef.current) return;
    // Get the most up-to-date code directly from the editor instance.
    const code = monacoEditorRef.current.getCode();
    if (!code) {
      alert("Code editor is empty.");
      return;
    }
    try {
      // Get the state at the moment of rendering
      const { components, activeComponentId } = useComponentStore.getState();

      if (!activeComponentId) {
        alert("No active component selected.");
        return;
      }

      // Get the props for the *active* component
      const activeComponentPropsJson = components[activeComponentId]?.propsJson || '{}';

      // Get the full component library from the store
      const { runtimeAst, previewAst, jsxLocation } = await renderCodeToAst(
        code,
        components,
        activeComponentPropsJson // Pass the props string here
      );
      // The setRenderOutput action (which we refactored) will correctly
      // place this data into the active component's state slice.
      setRenderOutput(code, runtimeAst, previewAst, jsxLocation);
    } catch (error: unknown) {
      console.error('Error rendering component:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error: ${errorMessage}\n\nCheck the console for more details.`);
    }
  };

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
        {/* Code Editor Panel - Conditionally rendered */}
        {isCodeEditorVisible && (
          <>
            <Panel 
              id="code-editor"
              defaultSize={35} 
              minSize={20}
              order={1}
            >
              <div className="h-full flex flex-col">
                <PanelHeader title="Code Editor">
                  <Button onClick={handleRender} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                    Render
                  </Button>
                </PanelHeader>
                <div className={`flex-grow overflow-hidden border-r ${theme === 'dark' ? 'bg-gray-950 text-gray-100 border-gray-800' : 'bg-gray-100 text-gray-900 border-gray-300'}`}>
                  <MonacoEditor
                    ref={monacoEditorRef}
                    code={activeCode}
                    onCodeChange={handleCodeChange}
                    onExampleSelect={handleExampleSelect}
                    examples={examples as Record<string, { code: string; description?: string; props?: Record<string, unknown>; dependency?: string }>}
                    multiComponentExamples={multiComponentExamples}
                  />
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className={`w-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'}`} />
          </>
        )}

        {/* Component Canvas Panel - Always visible */}
        <Panel 
          id="component-canvas"
          defaultSize={isFullscreen ? 100 : (isCodeEditorVisible ? 45 : 65)} 
          minSize={30}
          order={2}
        >
          <div className="h-full flex flex-col">
            <PanelHeader title="Component Canvas">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSelectionMode(selectionMode === 'interact' ? 'select' : 'interact')}
                  aria-pressed={selectionMode === 'select'}
                  className={
                    selectionMode === 'select'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : `${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'}`
                  }
                  title={
                    selectionMode === 'select'
                      ? 'Selection mode: Click to select elements. Click to toggle off.'
                      : 'Interaction mode: Click to interact. Toggle to enable selection mode.'
                  }
                >
                  {selectionMode === 'select' ? 'Selection Mode' : 'Interaction Mode'}
                </Button>
                <Button
                  onClick={handleFullscreenToggle}
                  variant="outline"
                  size="sm"
                  className={`${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </PanelHeader>
            <div className="flex-grow p-4 overflow-auto">
              <ComponentCanvas />
            </div>
          </div>
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
                      <div className="h-full flex flex-col">
                        <PanelHeader title="Inspector">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={undo}
                              disabled={!canUndo}
                              size="sm"
                              variant="outline"
                              className={`h-8 px-2 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}
                              title="Undo last change"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={redo}
                              disabled={!canRedo}
                              size="sm"
                              variant="outline"
                              className={`h-8 px-2 ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}
                              title="Redo last change"
                            >
                              <Redo2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => {
                                console.log('Apply Changes clicked, isDirty:', isDirty);
                                void handleApplyChanges();
                              }}
                              disabled={!isDirty}
                              size="sm"
                              className={`h-8 px-3 ${isDirty ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                              title={isDirty ? 'Apply inspector changes into the code editor' : 'No changes to apply'}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Apply Changes
                            </Button>
                          </div>
                        </PanelHeader>
                        <div className={`flex-grow overflow-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                          <InspectorPanel />
                        </div>
                      </div>
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
                    <div className="h-full flex flex-col">
                      <PanelHeader title="Navigator" />
                      <div className={`flex-grow overflow-auto p-2 ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
                        <ComponentTree />
                      </div>
                    </div>
                  </Panel>
                )}
              </PanelGroup>
            </Panel>
          </>
        )}
      </PanelGroup>

      {/* Floating Dock for Panel Controls */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <FloatingDock
          items={[
            {
              title: isCodeEditorVisible ? "Hide Code Editor" : "Show Code Editor",
              icon: <IconCode className={`h-full w-full ${isCodeEditorVisible ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-300'}`} />,
              onClick: () => setIsCodeEditorVisible(!isCodeEditorVisible),
              isActive: isCodeEditorVisible,
            },
            {
              title: isInspectorVisible ? "Hide Inspector" : "Show Inspector",
              icon: <IconLayoutSidebar className={`h-full w-full ${isInspectorVisible ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-300'}`} />,
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
