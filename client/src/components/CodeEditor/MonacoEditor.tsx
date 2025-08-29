import { useState, forwardRef, useImperativeHandle } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';

export interface MonacoEditorRef {
  getCode: () => string;
  setCode: (code: string) => void;
}

// The initialCode with useState is a great test case.
const initialCode = `
// Paste your React component here
// Make sure it's a single default export

function MyComponent() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '24px', color: '#333', marginBottom: '1rem' }}>
        Hello World!
      </h1>
      <p style={{ marginBottom: '1rem' }}>
        This is your component. Click 'Render' to see it above.
      </p>
      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Count: {count}
      </button>
    </div>
  );
}

export default MyComponent;
`;

export const MonacoEditor = forwardRef<MonacoEditorRef>((_, ref) => {
  const [code, setCode] = useState(initialCode);
  const { theme } = useTheme();

  useImperativeHandle(ref, () => ({
    getCode: () => code,
    setCode: (newCode: string) => setCode(newCode),
  }));

  const handleEditorMount: OnMount = (_editor, monaco) => {
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
      <div className="flex-grow overflow-hidden">
        <Editor
          height="100%"
          language="typescript"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(value) => setCode(value || '')}
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