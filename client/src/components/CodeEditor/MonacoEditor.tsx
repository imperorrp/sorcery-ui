/**
 * Monaco Code Editor - Advanced Code Editing Interface
 *
 * Monaco Editor wrapper with TypeScript/JSX support, syntax highlighting,
 * example loading, and code range highlighting for component inspection.
 *
 * FEATURES:
 * - TypeScript and JSX syntax highlighting and validation
 * - Controlled editor state with external code management
 * - Example loading system with categorized dropdown (Single/Multi Component)
 * - Code range highlighting for JSX element inspection
 * - Integration with component store for multi-component example loading
 *
 * EXAMPLE SYSTEM (v1.2):
 * - Single Component Examples: Basic templates for individual development
 * - Multi Component Examples: Complex setups with parent-child relationships
 * - Missing Component Demo: Showcases automatic mock generation system
 * - Categorized dropdown with clear visual separation
 */
import { forwardRef, useImperativeHandle, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';
import type { JsxLocation } from '@/store/componentStore';
// Import UI components for the new header
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BookOpenCheck } from 'lucide-react';
import { useComponentStore } from '@/store/componentStore';
import type { ComponentData } from '@/store/componentStore';

// Define the component's props
export interface MonacoEditorProps {
  code: string; // The editor's content is now a prop
  onCodeChange: (newCode: string) => void; // A callback to update the store
  onExampleSelect: (exampleKey: string) => void;
  examples: Record<string, { code: string; description?: string; props?: Record<string, unknown>; dependency?: string }>;
  multiComponentExamples?: Record<string, { activeId: string; components: unknown[] }>;
}

export interface MonacoEditorRef {
  getCode: () => string;
  highlightRange: (location: JsxLocation) => void;
}

export const MonacoEditor = forwardRef<MonacoEditorRef, MonacoEditorProps>(
  ({ code, onCodeChange, onExampleSelect, examples, multiComponentExamples }, ref) => {
  const { theme } = useTheme();
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // Handler for loading example sets
  const handleSelectExampleSet = (key: string) => {
    if (multiComponentExamples && multiComponentExamples[key]) {
      const set = multiComponentExamples[key];
      const { loadExampleSet } = useComponentStore.getState();
      loadExampleSet(set.components as ComponentData[], set.activeId);
    }
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
    <div className="flex flex-col h-full">
      {/* The new stateless header from our previous step */}
      <div className='flex items-center justify-between px-2 py-1 border-b'>
        <span className='text-sm text-muted-foreground'>TSX Editor</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='flex items-center gap-2'>
              <BookOpenCheck className='h-4 w-4' />
              <span>Examples</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-background border border-border shadow-lg">
            <DropdownMenuLabel>Load an Example</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
              Single Component
            </DropdownMenuLabel>
            {Object.keys(examples).map((key) => {
              const example = examples[key];
              return (
                <DropdownMenuItem key={key} onSelect={() => onExampleSelect(key)}>
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
              <DropdownMenuItem key={key} onSelect={() => handleSelectExampleSet(key)} className="font-medium">
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
      </div>

      <div className="flex-grow overflow-hidden">
        <Editor
          height="100%"
          language="typescript"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          // The editor is now fully controlled. `value` prop is used.
          value={code}
          // The `onChange` handler now calls the prop to update the central store.
          onChange={(value) => onCodeChange(value || '')}
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