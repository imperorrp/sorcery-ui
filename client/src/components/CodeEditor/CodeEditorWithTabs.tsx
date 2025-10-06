/**
 * CodeEditorWithTabs - Monaco Editor with Integrated Tab System
 *
 * Combines the Monaco editor with the new ComponentTabs interface,
 * providing a modern IDE-style editing experience with component switching.
 */
import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useComponentStore, type JsxLocation } from '@/store/componentStore';
import { ComponentTabs } from './ComponentTabs';
import { MonacoEditor, type MonacoEditorRef } from './MonacoEditor';

// Define the ref interface for external access
export interface CodeEditorWithTabsRef {
  getCode: () => string;
  highlightRange: (location: JsxLocation) => void;
}

/**
 * Main CodeEditorWithTabs component
 */
export const CodeEditorWithTabs = forwardRef<CodeEditorWithTabsRef>((_props, ref) => {
  const monacoRef = useRef<MonacoEditorRef>(null);
  
  // Get active component data from store
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const updateActiveComponentCode = useComponentStore((s) => s.updateActiveComponentCode);
  
  const currentCode = activeComponent?.code ?? '';

  // Handle code changes from Monaco editor
  const handleCodeChange = (newCode: string) => {
    updateActiveComponentCode(newCode);
  };

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    getCode: () => monacoRef.current?.getCode() || '',
    highlightRange: (location: JsxLocation) => monacoRef.current?.highlightRange(location),
  }));

  return (
    <div className="flex flex-col h-full w-full">
      {/* Tab bar */}
      <ComponentTabs />
      
      {/* Monaco editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          ref={monacoRef}
          code={currentCode}
          onCodeChange={handleCodeChange}
        />
      </div>
    </div>
  );
});
