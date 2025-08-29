import React, { useState, useRef } from 'react';
import { MonacoEditor } from './CodeEditor/MonacoEditor';
import type { MonacoEditorRef } from './CodeEditor/MonacoEditor';
import { ComponentCanvas } from './Canvas/ComponentCanvas';
import { InspectorPanel } from './Inspector/InspectorPanel';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComponentStore } from '@/store/componentStore';
import { renderCodeToAst } from '@/lib/renderer';

export const EditorLayout: React.FC = () => {
  const { theme } = useTheme();
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const HEADER_HEIGHT = 48;
  const INSPECTOR_KEY = 'inspectorHeight';
  const [inspectorHeight, setInspectorHeight] = useState<number>(384); // pixels
  const [isLeftPanelMinimized, setIsLeftPanelMinimized] = useState(false);
  const [isInspectorMinimized, setIsInspectorMinimized] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingInspector, setIsResizingInspector] = useState(false);
  const { setAst } = useComponentStore();
  const monacoEditorRef = useRef<MonacoEditorRef>(null);
  // previous height ref removed (not needed)

  const handleRender = (code: string) => {
    try {
      const ast = renderCodeToAst(code);
      setAst(ast);
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

  React.useEffect(() => {
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
          const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
          setLeftPanelWidth(Math.max(20, Math.min(80, newWidth)));
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
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingInspector(false);
    };

    if (isResizingLeft || isResizingInspector) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingInspector]);

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

  return (
    <div
      className={`h-full flex ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
      data-layout-container
    >
      {/* Left Panel - Code Editor */}
      <div
        className={`flex flex-col h-full transition-all duration-200 ${
          isLeftPanelMinimized ? 'w-12' : ''
        }`}
        style={{ width: isLeftPanelMinimized ? '48px' : `${leftPanelWidth}%` }}
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
                const code = monacoEditorRef.current?.getCode();
                if (code) {
                  handleRender(code);
                }
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
            <div
              className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}
              style={{ writingMode: 'vertical-lr' as React.CSSProperties['writingMode'], textOrientation: 'mixed' as unknown as string }}
            >
              Code Editor
            </div>
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
            {/* Inspector toggle belongs to the Inspector area; keep canvas header minimal */}
            <div />
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
          className={`border-t relative flex-shrink-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{
            maxHeight: isInspectorMinimized ? '48px' : `${inspectorHeight}px`,
            transition: 'max-height 320ms cubic-bezier(.22,.9,.28,1)',
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
            }}
          >
            <InspectorPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
