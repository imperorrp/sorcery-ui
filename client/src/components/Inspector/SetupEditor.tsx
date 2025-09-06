import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useComponentStore } from "@/store/componentStore"
import { X, Plus, Package, Code2 } from "lucide-react"
import Editor from '@monaco-editor/react';
import React from "react"
import { useTheme } from "@/contexts/ThemeContext";

export function SetupEditor() {
  // Use active component selectors for proper data access
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const dependencies = activeComponent?.dependencies ?? [];
  const wrapperCode = activeComponent?.wrapperCode ?? '';
  const addDependency = useComponentStore((s) => s.addDependency);
  const removeDependency = useComponentStore((s) => s.removeDependency);
  const setWrapperCode = useComponentStore((s) => s.setWrapperCode);
  const [newDep, setNewDep] = React.useState('');
  const { theme } = useTheme();

  const handleAddDep = () => {
    if (newDep && !dependencies.includes(newDep)) {
      addDependency(newDep);
      setNewDep('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Context Wrapper Section */}
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

      {/* Dependencies Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium text-foreground">External Dependencies</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Add CDN URLs for external libraries your component needs. These will be loaded in the preview iframe.
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            id="deps-input"
            placeholder="https://cdn.skypack.dev/framer-motion"
            value={newDep}
            onChange={e => setNewDep(e.target.value)}
            className="flex-1 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddDep()}
          />
          <Button onClick={handleAddDep} size="sm" className="px-3">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {dependencies.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No dependencies added yet</p>
          ) : (
            dependencies.map(dep => (
              <div key={dep} className="flex items-center justify-between bg-muted p-2 rounded text-xs group hover:bg-muted/80 transition-colors">
                <span className="truncate font-mono text-xs text-foreground">{dep}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeDependency(dep)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="bg-accent p-3 rounded-md border border-border mt-4">
          <p className="text-xs text-accent-foreground">
            💡 <strong>Popular CDNs:</strong> Skypack, UNPKG, jsDelivr, or CDNJS for reliable package hosting.
          </p>
        </div>
      </div>
    </div>
  )
}
