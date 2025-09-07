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
import { examples } from '@/examples/examples';

// Type helper to convert examples to Monaco format
const convertExamples = (exampleSet: typeof examples) => {
  return Object.fromEntries(
    Object.entries(exampleSet).map(([key, example]) => [
      key,
      {
        code: example.code,
        description: example.description,
        props: example.props as Record<string, unknown>,
        dependency: example.dependency,
      },
    ])
  );
};

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
  const convertedExamples = convertExamples(examples);

  // Handle code changes from Monaco editor
  const handleCodeChange = (newCode: string) => {
    updateActiveComponentCode(newCode);
  };

  // Handle example selection
  const handleExampleSelect = (exampleKey: string) => {
    const example = examples[exampleKey];
    if (example && activeComponent) {
      updateActiveComponentCode(example.code);
      // If example has props, could update props too
      // if (example.props) {
      //   setPropsJson(JSON.stringify(example.props, null, 2));
      // }
    }
  };

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    getCode: () => monacoRef.current?.getCode() || '',
    highlightRange: (location: JsxLocation) => monacoRef.current?.highlightRange(location),
  }));

  return (
    <div className="flex flex-col h-full w-full">
      {/* Tab bar */}
      <ComponentTabs 
        examples={convertedExamples}
        onExampleSelect={handleExampleSelect}
      />
      
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
