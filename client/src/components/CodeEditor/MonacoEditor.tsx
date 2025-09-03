import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';
import { useComponentStore } from '@/store/componentStore';
import type { JsxLocation } from '@/store/componentStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpenCheck, Check } from 'lucide-react';
import { examples } from '@/examples/examples';

export interface MonacoEditorProps {
  onChange?: (value: string) => void;
}

export interface MonacoEditorRef {
  getCode: () => string;
  setCode: (code: string) => void;
  highlightRange: (location: JsxLocation) => void;
}

export const MonacoEditor = forwardRef<MonacoEditorRef, MonacoEditorProps>(({ onChange }, ref) => {
  const [code, setCode] = useState(examples['Default'].code);
  const { theme } = useTheme();
  const { setPropsJson, setDependencies } = useComponentStore();
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // Example presets for quick testing
  const [selectedExample, setSelectedExample] = useState<keyof typeof examples>('Default');

  const handleSelectExample = (key: keyof typeof examples) => {
    setSelectedExample(key);
    const ex = examples[key];
    setCode(ex.code);
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
  };

  useImperativeHandle(ref, () => ({
    getCode: () => code,
    setCode: (newCode: string) => setCode(newCode),
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

  // Listen for apply-code events to update editor content
  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ code: string }>;
      if (ce.detail && typeof ce.detail.code === 'string') {
        setCode(ce.detail.code);
      }
    };
    window.addEventListener('apply-code', handler as EventListener);
    return () => window.removeEventListener('apply-code', handler as EventListener);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className='flex items-center justify-between px-2 py-1 border-b'>
        <span className='text-sm text-gray-600 dark:text-gray-400'>TSX Editor</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='flex items-center gap-2'>
              <BookOpenCheck className='h-4 w-4' />
              <span>Load an example</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white dark:bg-gray-800 border shadow-lg">
            {Object.keys(examples).map((key) => {
              const example = examples[key as keyof typeof examples];
              const isSelected = selectedExample === key;
              return (
                <DropdownMenuItem 
                  key={key} 
                  onSelect={() => handleSelectExample(key as keyof typeof examples)}
                  className={isSelected ? 'bg-accent' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{key}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({example.description})
                    </span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-grow overflow-hidden">
        <Editor
          height="100%"
          language="typescript"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(value) => {
            const code = value || '';
            setCode(code);
            onChange?.(code); // Call the onChange prop when user types
          }}
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