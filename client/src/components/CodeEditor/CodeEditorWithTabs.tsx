/**
 * CodeEditorWithTabs - Monaco Editor with Integrated Tab System
 *
 * Combines the Monaco editor with the ComponentTabs interface, providing a modern
 * IDE-style editing experience with seamless component switching.
 */
import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { JsxLocation } from '@/store/types';
import { ComponentTabs } from './ComponentTabs';
import { MonacoEditor, type MonacoEditorRef } from './MonacoEditor';

/**
 * Ref interface for external access to editor methods
 */
export interface CodeEditorWithTabsRef {
  getCode: () => string;
  highlightRange: (location: JsxLocation) => void;
}

/**
 * CodeEditorWithTabs - Main component combining Monaco editor with tab navigation
 *
 * Provides a unified editing interface with tab-based component switching and
 * Monaco editor integration. Handles code changes and exposes methods for
 * external access through ref forwarding.
 */
export const CodeEditorWithTabs = forwardRef<CodeEditorWithTabsRef>((_props, ref) => {
  const monacoRef = useRef<MonacoEditorRef>(null);

  // Access active component directly through project structure to avoid getter function issues
  const activeComponent = useComponentStore((s) => {
    const { activeProjectId, projects } = s;
    if (!activeProjectId) return null;
    const project = projects[activeProjectId];
    if (!project?.activeComponentId) return null;
    return project.components[project.activeComponentId] ?? null;
  });

  const updateActiveComponentCode = useComponentStore((s) => s.updateActiveComponentCode);

  const currentCode = activeComponent?.code ?? '';

  /**
   * Handle code changes from Monaco editor
   * Updates the active component's code in the store
   */
  const handleCodeChange = (newCode: string) => {
    updateActiveComponentCode(newCode);
  };

  // Expose methods through ref for external access
  useImperativeHandle(ref, () => ({
    getCode: () => monacoRef.current?.getCode() || '',
    highlightRange: (location: JsxLocation) => monacoRef.current?.highlightRange(location),
  }));

  return (
    <div className="flex flex-col h-full w-full">
      {/* Component tab navigation bar */}
      <ComponentTabs />

      {/* Monaco editor container */}
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
