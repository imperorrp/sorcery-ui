import Editor from '@monaco-editor/react';
import { useTheme } from "@/contexts/ThemeContext";
import { useComponentStore } from "@/store/componentStore";
import { Code2 } from "lucide-react";

/**
 * ContextWrapperEditor Component - Context Wrapper Configuration Panel
 *
 * Provides interface for defining a React component to wrap the main component.
 * Supports Monaco editor for wrapper code with TypeScript syntax highlighting.
 *
 * @returns The rendered ContextWrapperEditor component
 */
export function ContextWrapperEditor() {
  const activeComponent = useComponentStore((s) => {
    const { activeProjectId, projects } = s;
    if (!activeProjectId) return null;
    const project = projects[activeProjectId];
    if (!project?.activeComponentId) return null;
    return project.components[project.activeComponentId] ?? null;
  });
  
  const wrapperCode = activeComponent?.wrapperCode ?? '';
  const setWrapperCode = useComponentStore((s) => s.setWrapperCode);
  const { theme } = useTheme();

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Code2 className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium text-foreground">Context Wrapper</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Define a React component to wrap your main component. Use <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{children}'}</code> as placeholder for your component.
      </p>
      <div className="border rounded-md h-48 overflow-hidden">
         <Editor
            height="100%"
            language="typescript"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={wrapperCode}
            onChange={(value) => setWrapperCode(value || '')}
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
        Example: <code className="bg-muted px-1 py-0.5 rounded">{'<ThemeProvider theme="dark">{children}</ThemeProvider>'}</code>
      </p>
    </div>
  );
}