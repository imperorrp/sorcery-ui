import { useState, forwardRef, useImperativeHandle } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';
import { useComponentStore } from '@/store/componentStore';

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
  const { setPropsJson, setDependencies } = useComponentStore();

  // Example presets for quick testing
  const examples: Record<string, { code: string; props?: object; dependency?: string }> = {
    BasicCounter: { code: initialCode },
    UsesProps: {
      code: `
export default function Greeter(props) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Hello, {props.name || 'stranger'}!</h2>
      <p>Age: {props.age ?? 'unknown'}</p>
    </div>
  );
}
`,
      props: { name: 'Ada', age: 28 },
    },
    LodashSum: {
      code: `// @ts-nocheck
// Requires lodash (UMD) - window._ becomes available after script loads
export default function SumList() {
  const nums = [1,2,3,4,5];
  const total = (typeof window !== 'undefined' && window._) ? window._.sum(nums) : '_.sum not loaded yet';
  return (
    <div style={{ padding: 20 }}>
      <h2>Lodash Sum</h2>
      <p>Numbers: {JSON.stringify(nums)}</p>
      <p>Total: {String(total)}</p>
    </div>
  );
}
`,
      dependency: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
    },
  };

  const [selectedExample, setSelectedExample] = useState<keyof typeof examples>('BasicCounter');

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
      <div className="flex items-center gap-2 px-2 py-1 border-b">
        <label className="text-xs text-gray-500">Examples:</label>
        <select
          className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800"
          value={selectedExample}
          onChange={(e) => handleSelectExample(e.target.value as keyof typeof examples)}
        >
          {Object.keys(examples).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>
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