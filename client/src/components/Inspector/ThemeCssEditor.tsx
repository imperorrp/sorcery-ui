import Editor from '@monaco-editor/react';
import { useTheme } from "@/contexts/ThemeContext";
import { useComponentStore } from "@/store/componentStore";
import { Palette } from "lucide-react";

/**
 * ThemeCssEditor Component - Theme CSS Configuration Panel
 *
 * Provides interface for defining global styles and CSS variables for themes,
 * like those from globals.css in a shadcn/ui project.
 *
 * @returns The rendered ThemeCssEditor component
 */
export function ThemeCssEditor() {
  const themeCss = useComponentStore((s) => s.themeCss);
  const setThemeCss = useComponentStore((s) => s.setThemeCss);
  const { theme } = useTheme();

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Palette className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-foreground">Theme CSS</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Define global styles and CSS variables for your theme, like those from globals.css in a shadcn/ui project.
      </p>
      <div className="border rounded-md h-48 overflow-hidden">
         <Editor
            height="100%"
            language="css"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={themeCss}
            onChange={(value) => setThemeCss(value || '')}
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