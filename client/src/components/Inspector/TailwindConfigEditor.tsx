import Editor from '@monaco-editor/react';
import { useTheme } from "@/contexts/ThemeContext";
import { useComponentStore } from "@/store/componentStore";
import { Palette } from "lucide-react";

/**
 * TailwindConfigEditor Component - Tailwind Configuration Editor
 *
 * Provides interface for defining Tailwind theme configuration
 * that will be used to compile Tailwind classes in the sandboxed iframe.
 *
 * @returns The rendered TailwindConfigEditor component
 */
export function TailwindConfigEditor() {
  const tailwindConfig = useComponentStore((s) => s.tailwindConfig);
  const setTailwindConfig = useComponentStore((s) => s.setTailwindConfig);
  const { theme } = useTheme();

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Palette className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-foreground">Tailwind Config</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Paste your theme object from tailwind.config.js to customize Tailwind classes.
      </p>
      <div className="border rounded-md h-48 overflow-hidden">
         <Editor
            height="100%"
            language="javascript"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={tailwindConfig}
            onChange={(value) => setTailwindConfig(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'off',
              scrollBeyondLastLine: false,
              wordWrap: 'on'
            }}
          />
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Example: <code className="bg-muted px-1 py-0.5 rounded">{'{'} extend: {'{'} colors: {'{'} primary: '#007bff' {'}'} {'}'} {'}'}</code>
      </p>
    </div>
  );
}