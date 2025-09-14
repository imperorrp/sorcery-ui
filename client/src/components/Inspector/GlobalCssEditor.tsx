import Editor from '@monaco-editor/react';
import { useTheme } from "@/contexts/ThemeContext";
import { useComponentStore } from "@/store/componentStore";
import { Palette } from "lucide-react";

/**
 * GlobalCssEditor Component - Global CSS Configuration Panel
 *
 * Provides interface for defining global CSS styles and utility classes
 * that will be available in the sandboxed iframe.
 *
 * @returns The rendered GlobalCssEditor component
 */
export function GlobalCssEditor() {
  const globalCss = useComponentStore((s) => s.globalCss);
  const setGlobalCss = useComponentStore((s) => s.setGlobalCss);
  const { theme } = useTheme();

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Palette className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-foreground">Global CSS</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Define global CSS styles and utility classes that will be available in the sandboxed iframe.
      </p>
      <div className="border rounded-md h-48 overflow-hidden">
         <Editor
            height="100%"
            language="css"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={globalCss}
            onChange={(value) => setGlobalCss(value || '')}
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
        Example: <code className="bg-muted px-1 py-0.5 rounded">.my-class {'{'} color: red; {'}'}</code>
      </p>
    </div>
  );
}