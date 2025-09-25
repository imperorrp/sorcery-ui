import React, { useRef, useState } from 'react';
import { MonacoEditor, type MonacoEditorRef } from './CodeEditor/MonacoEditor';
import { ComponentCanvas } from './Canvas/ComponentCanvas';
import { InspectorPanel } from './Inspector/InspectorPanel';
import { ComponentTree } from '@/components/Navigator/ComponentTree';
import { useTheme } from '@/contexts/ThemeContext';
import { Undo2, Redo2, Check, Maximize2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpenCheck } from 'lucide-react';
import { useComponentStore, type ComponentData } from '@/store/componentStore';
import { renderCodeToAst } from '@/lib/renderer';
import { examples, multiComponentExamples } from '@/examples/examples';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { ComponentTabs } from './CodeEditor/ComponentTabs';
import { FloatingDock } from '@/components/ui/floating-dock';
import { IconCode, IconLayoutSidebar, IconTree, IconBox, IconPalette, IconSettings } from '@tabler/icons-react';
import { ConfigurerPanel } from './Inspector/ConfigurerPanel';

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

  const { selectionMode, setSelectionMode, setRenderOutput, applyAstChangesToCode, isCodeHighlighted, clearCodeHighlight, undo, redo, isDirty, updateActiveComponentCode, loadExampleSet } = useComponentStore();

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

  const monacoEditorRef = useRef<MonacoEditorRef>(null);
  const canUndo = activeHistoryIndex > 0;
  const canRedo = activeHistoryIndex < activeHistory.length - 1;

  /**
   * Handle example selection from the dropdown menu
   * Supports both single-component and multi-component examples
   *
   * @param {string} key - The key of the selected example
   */
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
      // Replace the whole component library with this single-example component
      const newId = `example-${key}`;
  const singleComp: Partial<ComponentData> = {
        id: newId,
        name: key,
        code: ex.code,
        propsJson: ex.props ? JSON.stringify(ex.props, null, 2) : '{}',
        dependencies: ex.dependency ? (Array.isArray(ex.dependency) ? ex.dependency : [ex.dependency]) : [],
      };
      // loadExampleSet will replace the entire components map and set active component
      loadExampleSet({ [newId]: singleComp }, newId);
    }
  };

  /**
   * Handle component rendering from the current code
   * Parses the code, generates ASTs, and updates the component preview
   */
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
                        <div className="h-full flex flex-col">
                        <PanelHeader title="Code Editor" icon={<IconCode className="h-5 w-5" />}>
                          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant='outline' size='sm' className='flex items-center gap-2 overflow-hidden whitespace-nowrap flex-none'>
                                  <BookOpenCheck className='h-4 w-4 flex-shrink-0' />
                                  <span className='ml-1 text-sm truncate min-w-0 overflow-hidden whitespace-nowrap'>Examples</span>
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
                                    <DropdownMenuItem key={key} onSelect={() => handleExampleSelect(key)}>
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
                                  <DropdownMenuItem key={key} onSelect={() => handleExampleSelect(key)} className="font-medium">
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
                            <Button onClick={handleRender} size="default" variant="default" className="ml-2 flex items-center gap-2 overflow-hidden whitespace-nowrap flex-none">
                              <Play className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate min-w-0 overflow-hidden whitespace-nowrap">Render</span>
                            </Button>
                          </div>
                        </PanelHeader>
                        {/* Tabs should remain visible even when no component is open */}
                        <ComponentTabs />
                        <div className={`flex-grow overflow-hidden border-r ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
                          {activeComponent ? (
                            <MonacoEditor
                              ref={monacoEditorRef}
                              code={activeCode}
                              onCodeChange={handleCodeChange}
                            />
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                              <h3 className="mb-2 text-sm font-semibold">No component open</h3>
                              <p className="text-xs">Open a component from the Library or load an Example to begin editing.</p>
                            </div>
                          )}
                        </div>
                      </div>
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
                    <div className="h-full flex flex-col">
                      <PanelHeader title="Configurer" icon={<IconSettings className="h-5 w-5" />} />
                      <div className={`flex-grow overflow-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                        <ConfigurerPanel />
                      </div>
                    </div>
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
          <div className="h-full flex flex-col">
            <PanelHeader title="Component Preview" icon={<IconBox className="h-5 w-5" />}>
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <Button
                  onClick={() => setSelectionMode(selectionMode === 'interact' ? 'select' : 'interact')}
                  variant={selectionMode === 'select' ? 'default' : 'outline'}
                  size="sm"
                  title={
                    selectionMode === 'select'
                      ? 'Selection mode: Click to select elements. Click to toggle off.'
                      : 'Interaction mode: Click to interact. Toggle to enable selection mode.'
                  }
                  className="flex items-center gap-2 overflow-hidden whitespace-nowrap flex-none"
                >
                  <span className="truncate min-w-0 overflow-hidden whitespace-nowrap">{selectionMode === 'select' ? 'Selection Mode' : 'Interaction Mode'}</span>
                </Button>
                <Button
                  onClick={handleFullscreenToggle}
                  variant="outline"
                  size="sm"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="flex items-center overflow-hidden whitespace-nowrap flex-none"
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
                        <PanelHeader title="Style Editor" icon={<IconPalette className="h-5 w-5" />}>
                          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                            <Button
                              onClick={undo}
                              disabled={!canUndo}
                              size="sm"
                              variant="outline"
                              title="Undo last change"
                              className="overflow-hidden whitespace-nowrap flex-1 min-w-0"
                            >
                              <Undo2 className="h-4 w-4 flex-shrink-0" />
                            </Button>
                            <Button
                              onClick={redo}
                              disabled={!canRedo}
                              size="sm"
                              variant="outline"
                              title="Redo last change"
                              className="overflow-hidden whitespace-nowrap flex-1 min-w-0"
                            >
                              <Redo2 className="h-4 w-4 flex-shrink-0" />
                            </Button>
                            <Button
                              onClick={() => {
                                // Apply Changes clicked
                                void handleApplyChanges();
                              }}
                              disabled={!isDirty}
                              size="sm"
                              title={isDirty ? 'Apply inspector changes into the code editor' : 'No changes to apply'}
                              className="px-2 sm:px-3 flex items-center gap-2 overflow-hidden whitespace-nowrap flex-none"
                            >
                              <Check className="h-4 w-4 flex-shrink-0" />
                              {/* prefer nowrap label so it remains visible until space truly runs out */}
                              <span className="hidden sm:inline whitespace-nowrap">Apply Changes</span>
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
                      <PanelHeader title="Navigator" icon={<IconTree className="h-5 w-5" />} />
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