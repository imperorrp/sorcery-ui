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
import { LibraryPanel } from '@/components/Library/LibraryPanel';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Undo2, Redo2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComponentStore } from '@/store/componentStore';
import { renderCodeToAst } from '@/lib/renderer';
import { useResizableLayout } from '@/hooks/useResizableLayout';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { examples, multiComponentExamples } from '@/examples/examples';

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
  
  // Library panel state
  const [libraryPanelWidth, setLibraryPanelWidth] = useState(250);
  const [isLibraryPanelMinimized, setIsLibraryPanelMinimized] = useState(false);
  const [isResizingLibrary, setIsResizingLibrary] = useState(false);
  
  const {
    navPanelSize,
    editorPanelSize,
    inspectorPanelSize,
    isLeftPanelMinimized,
    isInspectorMinimized,
    isNavMinimized,
    handleNavLayoutChange,
    handleMainLayoutChange,
    toggleLeftPanel,
    toggleInspector,
    toggleNav,
    HEADER_HEIGHT,
  } = useResizableLayout();

  const { selectionMode, setSelectionMode, setRenderOutput, applyAstChangesToCode, isCodeHighlighted, jsxLocation, clearCodeHighlight, undo, redo, isDirty, updateActiveComponentCode, setPropsJson, setDependencies, loadExampleSet } = useComponentStore();
  
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

  // Library panel resize handlers
  const toggleLibraryPanel = () => {
    setIsLibraryPanelMinimized(!isLibraryPanelMinimized);
  };

  const handleLibraryResizeStart = (e: React.MouseEvent) => {
    setIsResizingLibrary(true);
    e.preventDefault();
  };

  // Mouse move and up handlers for library panel resizing
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLibrary) {
        const newWidth = Math.max(200, Math.min(400, e.clientX));
        setLibraryPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLibrary(false);
    };

    if (isResizingLibrary) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLibrary, setLibraryPanelWidth]);

  // Persistent highlighting effect
  React.useEffect(() => {
    if (isCodeHighlighted && jsxLocation && monacoEditorRef.current?.highlightRange) {
      try {
        monacoEditorRef.current.highlightRange(jsxLocation);
      } catch (e) {
        console.error("Could not highlight changes:", e);
      }
    }
  }, [isCodeHighlighted, jsxLocation]);

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
    <div className={`h-full flex ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`} data-layout-container>
      {/* 1. New Library Panel */}
      <aside 
        className={`flex flex-col border-r ${theme === 'dark' ? 'bg-gray-950 text-gray-100 border-gray-800' : 'bg-gray-100 text-gray-900 border-gray-300'}`}
        style={{ width: isLibraryPanelMinimized ? 40 : libraryPanelWidth }}
      >
        <div className={`px-2 py-2 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}>
          {!isLibraryPanelMinimized && <div className="text-sm font-medium">Library</div>}
          <button
            onClick={toggleLibraryPanel}
            className={`h-7 w-7 rounded border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-200'}`}
            title={isLibraryPanelMinimized ? 'Expand library' : 'Minimize library'}
          >
            {isLibraryPanelMinimized ? <ChevronRight className="h-4 w-4 mx-auto" /> : <ChevronLeft className="h-4 w-4 mx-auto" />}
          </button>
        </div>
        {!isLibraryPanelMinimized && (
          <div className="flex-1 overflow-hidden">
            <LibraryPanel />
          </div>
        )}
        {isLibraryPanelMinimized && (
          <div className="flex-1 flex items-center justify-center">
            {(() => {
              const styleObj: React.CSSProperties = {
                writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
              } as React.CSSProperties;
              (styleObj as unknown as Record<string, unknown>)['textOrientation'] = 'mixed';
              return (
                <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`} style={styleObj}>
                  Library
                </div>
              );
            })()}
          </div>
        )}
      </aside>

      {/* Library Resize Handle */}
      <div 
        className={`w-1 cursor-col-resize transition-colors ${
          theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
        }`}
        onMouseDown={handleLibraryResizeStart}
      />

      {/* 2. Center Panel (contains old navigator, editor, and inspector panels) */}
      <main className="flex flex-1 min-w-0">
        <PanelGroup
          direction="horizontal"
          onLayout={handleNavLayoutChange}
          className="h-full"
        >
          {/* Navigator Panel */}
          <Panel
            defaultSize={navPanelSize}
            minSize={isNavMinimized ? 2 : 15}
            maxSize={isNavMinimized ? 2 : 35}
            collapsible={true}
            collapsedSize={2}
            className={`flex flex-col border-r ${theme === 'dark' ? 'bg-gray-950 text-gray-100 border-gray-800' : 'bg-gray-100 text-gray-900 border-gray-300'}`}
          >
            <div className={`px-2 py-2 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}>
              {!isNavMinimized && <div className="text-sm font-medium">Navigator</div>}
              <button
                onClick={toggleNav}
                className={`h-7 w-7 rounded border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-200'}`}
                title={isNavMinimized ? 'Expand navigator' : 'Minimize navigator'}
              >
                {isNavMinimized ? <ChevronRight className="h-4 w-4 mx-auto" /> : <ChevronLeft className="h-4 w-4 mx-auto" />}
              </button>
            </div>
            {!isNavMinimized && (
              <div className="flex-1 overflow-auto p-2">
                <ComponentTree />
              </div>
            )}
            {isNavMinimized && (
              <div className="flex-1 flex items-center justify-center">
                {(() => {
                  const styleObj: React.CSSProperties = {
                    writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
                  } as React.CSSProperties;
                  (styleObj as unknown as Record<string, unknown>)['textOrientation'] = 'mixed';
                  return (
                    <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`} style={styleObj}>
                      Navigator
                    </div>
                  );
                })()}
              </div>
            )}
          </Panel>

          {/* Navigator Resize Handle */}
          <PanelResizeHandle className={`w-1 cursor-col-resize transition-colors ${
            theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
          }`} />

          {/* Main Content Area */}
          <Panel defaultSize={100 - navPanelSize} minSize={50}>
            <PanelGroup direction="horizontal" onLayout={handleMainLayoutChange}>
              {/* Code Editor Panel */}
              <Panel
                defaultSize={editorPanelSize}
                minSize={isLeftPanelMinimized ? 3 : 25}
                maxSize={isLeftPanelMinimized ? 3 : 75}
                collapsible={true}
                collapsedSize={3}
                className="flex flex-col h-full"
              >
                {/* Header with minimize button */}
                <div className={`flex-shrink-0 p-2 flex justify-between items-center border-b ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                } ${isLeftPanelMinimized ? 'flex-col' : ''}`}>
                  {!isLeftPanelMinimized && (
                    <div className="flex justify-between items-center w-full">
                      <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        Code Editor
                      </h3>
                      <Button onClick={handleRender} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                        Render
                      </Button>
                    </div>
                  )}
                  <button
                    onClick={toggleLeftPanel}
                    title={isLeftPanelMinimized ? 'Restore editor' : 'Minimize editor'}
                    className={`flex items-center justify-center p-1 h-8 w-8 rounded-md border transition-colors ${isLeftPanelMinimized ? 'mb-2' : ''} cursor-pointer ${
                      theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {isLeftPanelMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </button>
                </div>

                {/* Monaco Editor */}
                {!isLeftPanelMinimized && (
                  <MonacoEditor
                    ref={monacoEditorRef}
                    code={activeCode}
                    onCodeChange={handleCodeChange}
                    onExampleSelect={handleExampleSelect}
                    examples={examples as Record<string, { code: string; description?: string; props?: Record<string, unknown>; dependency?: string }>}
                    multiComponentExamples={multiComponentExamples}
                  />
                )}
                {isLeftPanelMinimized && (
                  <div className="flex items-center justify-center h-full w-full">
                    {(() => {
                      const styleObj: React.CSSProperties = {
                        writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
                      } as React.CSSProperties;
                      (styleObj as unknown as Record<string, unknown>)['textOrientation'] = 'mixed';
                      return (
                        <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`} style={styleObj}>
                          Code Editor
                        </div>
                      );
                    })()}
                  </div>
                )}
              </Panel>

              {/* Code Editor Resize Handle */}
              <PanelResizeHandle className={`w-1 cursor-col-resize transition-colors ${
                theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
              }`} />

              {/* Right Panel - Canvas and Inspector */}
              <Panel defaultSize={inspectorPanelSize} minSize={25} className="flex flex-col h-full">
                <PanelGroup direction="vertical">
                  {/* Canvas Section */}
                  <Panel
                    defaultSize={isInspectorMinimized ? 100 : 70}
                    minSize={30}
                    className="flex flex-col"
                  >
                    {/* Canvas Header */}
                    <div className={`px-4 py-3 border-b shadow-sm flex justify-between items-center ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                      <div>
                        <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                          Component Canvas
                        </h2>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Rendered component will appear here
                        </p>
                      </div>
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
                      </div>
                    </div>

                    {/* Canvas Content */}
                    <div className="flex-grow p-4 overflow-auto">
                      <ComponentCanvas />
                    </div>
                  </Panel>

                  {/* Inspector Section */}
                  {!isInspectorMinimized && (
                    <>
                      {/* Inspector Resize Handle */}
                      <PanelResizeHandle className={`h-1 cursor-row-resize transition-colors ${
                        theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'
                      }`} />

                      {/* Inspector Panel */}
                      <Panel
                        defaultSize={30}
                        minSize={20}
                        maxSize={60}
                        className={`border-t relative flex-shrink-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                      >
                        {/* Inspector header */}
                        <div
                          className={`px-3 py-2 border-b flex items-center justify-between ${
                            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            Inspector
                          </div>
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
                            <button
                              onClick={toggleInspector}
                              title={isInspectorMinimized ? 'Restore inspector' : 'Minimize inspector'}
                              className={`flex items-center justify-center h-8 w-8 rounded-md border transition-colors cursor-pointer ${
                                theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inspector content */}
                        <div
                          style={{
                            height: `calc(100% - ${HEADER_HEIGHT}px)`,
                            overflow: 'auto',
                          }}
                        >
                          <InspectorPanel />
                        </div>
                      </Panel>
                    </>
                  )}
                </PanelGroup>

                {/* Minimized Inspector Toggle */}
                {isInspectorMinimized && (
                  <div className={`border-t flex justify-center py-2 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                    <button
                      onClick={toggleInspector}
                      title="Restore inspector"
                      className={`flex items-center justify-center h-8 w-8 rounded-md border transition-colors cursor-pointer ${
                        theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
};
