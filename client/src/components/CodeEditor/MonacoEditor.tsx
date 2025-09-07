/**
 * Monaco Code Editor - Advanced Code Editing Interface
 *
 * Monaco Editor wrapper with TypeScript/JSX support, syntax highlighting,
 * and code range highlighting for component inspection.
 *
 * FEATURES:
 * - TypeScript and JSX syntax highlighting and validation
 * - Controlled editor state with external code management
 * - Code range highlighting for JSX element inspection
 * - Integration with component store for multi-component support
 *
 * @version 1.2.0
 */
import { forwardRef, useImperativeHandle, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';
import type { JsxLocation } from '@/store/componentStore';
import { useComponentStore } from '@/store/componentStore';
// import type { ComponentData } from '@/store/componentStore';

// Define the component's props
export interface MonacoEditorProps {
  code: string; // The editor's content is now a prop
  onCodeChange: (newCode: string) => void; // A callback to update the store
}

export interface MonacoEditorRef {
  getCode: () => string;
  highlightRange: (location: JsxLocation) => void;
}

export const MonacoEditor = forwardRef<MonacoEditorRef, MonacoEditorProps>(
  ({ code, onCodeChange }, ref) => {
  const { theme } = useTheme();
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // For new tab bar
  const updateActiveComponentCode = useComponentStore((s) => s.updateActiveComponentCode);

  // Handle code changes from Monaco editor
  const handleCodeChange = (newCode: string) => {
    updateActiveComponentCode(newCode);
    onCodeChange(newCode);
  };

  useImperativeHandle(ref, () => ({
    getCode: () => editorRef.current?.getValue() || '',
    highlightRange: (location: JsxLocation) => {
      const editor = editorRef.current;
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;

      // Convert character offsets (start/end) to line/column positions
      const startPosition = model.getPositionAt(location.start);
      const endPosition = model.getPositionAt(location.end);

      // Monaco is exposed globally by @monaco-editor/react as window.monaco
      const monacoApi = (window as unknown as { monaco: typeof import('monaco-editor') }).monaco;
      const monacoRange = new monacoApi.Range(
        startPosition.lineNumber,
        startPosition.column,
        endPosition.lineNumber,
        endPosition.column
      );
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: monacoRange,
          options: {
            isWholeLine: false,
            className: 'code-highlight',
          },
        },
      ]);
      editor.revealRangeInCenter(monacoRange, 1);
    },
  }));
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    // Monaco configuration for JSX/TS support
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: 'React.createElement',
      reactNamespace: 'React',
      allowNonTsExtensions: true,
      allowJs: true,
      target: monaco.languages.typescript.ScriptTarget.Latest,
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Monaco editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language="typescript"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(value) => handleCodeChange(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
            },
          }}
          onMount={handleEditorMount}
        />
      </div>
    </div>
  );
});