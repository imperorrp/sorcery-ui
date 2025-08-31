import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useComponentStore } from "@/store/componentStore"
import { X } from "lucide-react"
import Editor from '@monaco-editor/react';
import React from "react"
import { useTheme } from "@/contexts/ThemeContext";

export function SetupEditor() {
  const { dependencies, addDependency, removeDependency, wrapperCode, setWrapperCode } = useComponentStore();
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
      <div>
        <Label>Context Wrapper</Label>
        <p className="text-xs text-gray-500 mb-2">Define a component to wrap your main component. Use `__{'{children}'}__` as the placeholder.</p>
        <div className="border border-gray-300 dark:border-gray-700 rounded-md h-48">
           <Editor
              height="100%"
              language="typescript"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={wrapperCode}
              onChange={(value) => setWrapperCode(value || '')}
              options={{ minimap: { enabled: false }, fontSize: 12 }}
            />
        </div>
      </div>
      <div>
        <Label htmlFor="deps-input">Dependencies (CDN URLs)</Label>
        <div className="flex space-x-2 mt-2">
          <Input id="deps-input" placeholder="https://cdn.skypack.dev/framer-motion" value={newDep} onChange={e => setNewDep(e.target.value)} />
          <Button onClick={handleAddDep}>Add</Button>
        </div>
        <div className="space-y-2 mt-4">
          {dependencies.map(dep => (
            <div key={dep} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
              <span className="truncate">{dep}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDependency(dep)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
