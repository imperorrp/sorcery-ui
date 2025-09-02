import React, { useState, useRef } from 'react';
import { MonacoEditor } from './CodeEditor/MonacoEditor';
import type { MonacoEditorRef } from './CodeEditor/MonacoEditor';
import { ComponentCanvas } from './Canvas/ComponentCanvas';
import { InspectorPanel } from './Inspector/InspectorPanel';
import { ComponentTree } from '@/components/Navigator/ComponentTree';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComponentStore } from '@/store/componentStore';
import { renderCodeToAst } from '@/lib/renderer';

export const EditorLayout: React.FC = () => {
  const { theme } = useTheme();
  // Editor (code) panel width in pixels for stable, smooth dragging
  const [leftPanelWidthPx, setLeftPanelWidthPx] = useState<number | null>(null);
  const [navWidth, setNavWidth] = useState<number>(240); // px
  const HEADER_HEIGHT = 48;
  const INSPECTOR_KEY = 'inspectorHeight';
  const [inspectorHeight, setInspectorHeight] = useState<number>(384); // pixels
  const [isLeftPanelMinimized, setIsLeftPanelMinimized] = useState(false);
  const [isInspectorMinimized, setIsInspectorMinimized] = useState(false);
  const [isNavMinimized, setIsNavMinimized] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingInspector, setIsResizingInspector] = useState(false);
  const [isResizingNav, setIsResizingNav] = useState(false);
  const { selectionMode, setSelectionMode, setRenderOutput, applyAstChangesToCode, setDirty } = useComponentStore();
  const monacoEditorRef = useRef<MonacoEditorRef>(null);
  // previous height ref removed (not needed)

  const handleRender = async () => {
    if (!monacoEditorRef.current) return;
    const code = monacoEditorRef.current.getCode();
    try {
      const { runtimeAst, previewAst, jsxLocation } = await renderCodeToAst(code);
      // Update both the ASTs and code/loc snapshot in one call
      setRenderOutput(code, runtimeAst, previewAst, jsxLocation);
    } catch (error: unknown) {
      console.error('Error rendering component:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error: ${errorMessage}\n\nCheck the console for more details.`);
    }
  };

  const handleLeftResizeStart = (e: React.MouseEvent) => {
    setIsResizingLeft(true);
    e.preventDefault();
  };

  const handleInspectorResizeStart = (e: React.MouseEvent) => {
    setIsResizingInspector(true);
    e.preventDefault();
  };

  const handleNavResizeStart = (e: React.MouseEvent) => {
    setIsResizingNav(true);
    e.preventDefault();
  };

  React.useEffect(() => {
    // Initialize editor width to 50% of available space on first mount
  if (leftPanelWidthPx === null) {
      const container = document.querySelector('[data-layout-container]');
      if (container) {
        const rect = (container as HTMLElement).getBoundingClientRect();
    const navResizerW = 4; // tailwind w-1 = 4px
    const leftResizerW = 4;
    const effectiveNav = (isNavMinimized ? 40 : navWidth);
    const available = rect.width - effectiveNav - navResizerW - leftResizerW;
        const initial = Math.max(240, Math.floor(available * 0.5));
        setLeftPanelWidthPx(initial);
      }
    }

    // Load persisted inspector height on mount
    try {
      const stored = localStorage.getItem(INSPECTOR_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (!Number.isNaN(parsed)) {
          setInspectorHeight(Math.max(100, Math.min(600, parsed)));
        }
      }
    } catch {
      // ignore
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const container = document.querySelector('[data-layout-container]');
        if (container) {
          const rect = container.getBoundingClientRect();
          // Compute pixel width relative to the available space to the right of the navigator
          const navResizerW = 4; // tailwind w-1
          const leftResizerW = 4;
          const effectiveNav = (isNavMinimized ? 40 : navWidth);
          const leftEdge = rect.left + effectiveNav + navResizerW;
          const available = rect.width - effectiveNav - navResizerW - leftResizerW;
          const raw = e.clientX - leftEdge;
          const minPx = 200; // minimum editor width
          const maxPx = Math.max(minPx, available - 300); // keep at least 300px for the canvas
          const clamped = Math.max(minPx, Math.min(maxPx, raw));
          setLeftPanelWidthPx(Math.floor(clamped));
        }
      } else if (isResizingInspector) {
        const container = document.querySelector('[data-inspector-container]');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newHeight = rect.bottom - e.clientY;
          const clamped = Math.max(100, Math.min(600, newHeight));
          setInspectorHeight(clamped);
          // persist while resizing
          try {
            localStorage.setItem(INSPECTOR_KEY, String(clamped));
          } catch {
            // ignore
          }
        }
      } else if (isResizingNav) {
        const container = document.querySelector('[data-layout-container]');
        if (container) {
          const rect = container.getBoundingClientRect();
          const min = 160;
          const max = Math.min(480, rect.width * 0.4);
          const newWidth = Math.max(min, Math.min(max, e.clientX - rect.left));
          setNavWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingInspector(false);
      setIsResizingNav(false);
    };

    if (isResizingLeft || isResizingInspector || isResizingNav) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingInspector, isResizingNav, isNavMinimized, navWidth, leftPanelWidthPx]);

  // Persist inspectorHeight when it changes (and not minimized)
  React.useEffect(() => {
    if (!isInspectorMinimized) {
      try {
        localStorage.setItem(INSPECTOR_KEY, String(inspectorHeight));
      } catch {
        // ignore
      }
    }
  }, [inspectorHeight, isInspectorMinimized]);

  const handleApplyChanges = async () => {
    const maybePromise = applyAstChangesToCode?.();
    if (!maybePromise) return;
    const newCode = await maybePromise;
    if (newCode && monacoEditorRef.current) {
      monacoEditorRef.current.setCode(newCode);
      setDirty(false);
      
      // Highlight the updated JSX region using stored jsxLocation
      const { jsxLocation } = useComponentStore.getState();
      if (jsxLocation && monacoEditorRef.current.highlightRange) {
        try {
          // The ref now exposes the highlightRange function directly
          // and it handles the model logic internally.
          monacoEditorRef.current.highlightRange(jsxLocation);
        } catch (e) {
          console.error("Could not highlight changes:", e);
        }
      }
    }
  };

  return (
    <div className={`h-full flex ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`} data-layout-container>
      {/* Navigator Panel */}
      <aside
        className={`$${''} ${isNavMinimized ? 'w-10' : ''} hidden md:flex flex-col border-r ${
          theme === 'dark' ? 'bg-gray-950 text-gray-100 border-gray-800' : 'bg-gray-100 text-gray-900 border-gray-300'
        }`}
        style={{ width: isNavMinimized ? 40 : navWidth }}
      >
        <div className={`px-2 py-2 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}>
          {!isNavMinimized && <div className="text-sm font-medium">Navigator</div>}
          <button
            onClick={() => setIsNavMinimized(!isNavMinimized)}
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
      </aside>

      {/* Navigator Resizer */}
      <div
        className={`w-1 cursor-col-resize ${theme === 'dark' ? 'bg-gray-700 hover:bg-blue-500' : 'bg-gray-300 hover:bg-blue-500'}`}
        onMouseDown={handleNavResizeStart}
      />

      {/* Left Panel - Code Editor */}
      <div
        className={`flex flex-col h-full ${isLeftPanelMinimized ? 'w-12' : ''}`}
        style={{ width: isLeftPanelMinimized ? '48px' : `${leftPanelWidthPx ?? 600}px` }}
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
              <Button onClick={() => {
                handleRender();
              }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                Render
              </Button>
            </div>
          )}
          <button
            onClick={() => setIsLeftPanelMinimized(!isLeftPanelMinimized)}
            title={isLeftPanelMinimized ? 'Restore editor' : 'Minimize editor'}
            className={`flex items-center justify-center p-1 h-8 w-8 rounded-md border transition-colors ${isLeftPanelMinimized ? 'mb-2' : ''} cursor-pointer ${
              theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
            }`}
          >
            {isLeftPanelMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Monaco Editor */}
        {!isLeftPanelMinimized && <MonacoEditor ref={monacoEditorRef} />}
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
      </div>

      {/* Left Panel Resizer */}
      <div
        className={`w-1 cursor-col-resize hover:bg-blue-500 transition-colors ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
        } ${isResizingLeft ? 'bg-blue-500' : ''}`}
        onMouseDown={handleLeftResizeStart}
      />

      {/* Right Panel - Canvas and Inspector */}
      <div className="flex flex-col h-full flex-1" data-inspector-container>
        {/* Canvas Section */}
        <div className={`flex-grow flex flex-col min-h-0 ${isInspectorMinimized ? 'flex-1' : ''}`}>
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
        </div>

  {/* Resizer shown only when inspector is expanded */}
        {!isInspectorMinimized && (
          <div
            className={`h-1 cursor-row-resize hover:bg-blue-500 transition-colors ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            } ${isResizingInspector ? 'bg-blue-500' : ''}`}
            onMouseDown={handleInspectorResizeStart}
          />
        )}

        {/* Inspector wrapper: header stays inside and moves to bottom when minimized. */}
        <div
          className={`border-t relative flex-shrink-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${isResizingInspector ? '' : 'transition-all'}`}
          style={{
            height: isInspectorMinimized ? '48px' : `${inspectorHeight}px`,
            overflow: 'hidden',
          }}
        >
          {/* Inspector header (absolute) - animate top/bottom */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: isInspectorMinimized ? 'auto' : 0,
              bottom: isInspectorMinimized ? 0 : 'auto',
              transition: 'top 320ms cubic-bezier(.22,.9,.28,1), bottom 320ms cubic-bezier(.22,.9,.28,1), transform 320ms cubic-bezier(.22,.9,.28,1)',
              transform: isInspectorMinimized ? 'translateY(2px)' : 'translateY(0)',
              boxShadow: isInspectorMinimized ? 'none' : '0 -6px 18px rgba(2,6,23,0.08)',
            }}
            className={`px-3 py-2 border-b flex items-center justify-between ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
              Inspector
            </div>
            <button
              onClick={() => setIsInspectorMinimized(!isInspectorMinimized)}
              title={isInspectorMinimized ? 'Restore inspector' : 'Minimize inspector'}
              className={`flex items-center justify-center h-8 w-8 rounded-md border transition-colors cursor-pointer ${
                theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              {isInspectorMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Inspector content area sits below header; keep height constant and let wrapper clip for smooth animation */}
          <div
            style={{
              marginTop: HEADER_HEIGHT,
              height: `${inspectorHeight - HEADER_HEIGHT}px`,
              overflow: 'auto',
              pointerEvents: isInspectorMinimized ? 'none' : 'auto',
              transition: isResizingInspector ? 'none' : 'height 320ms cubic-bezier(.22,.9,.28,1)',
            }}
          >
            <InspectorPanel onApplyChanges={handleApplyChanges} />
          </div>
        </div>
      </div>
    </div>
  );
};
