import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useComponentStore } from "@/store/componentStore"
import { X, Plus, Package } from "lucide-react"
import { useState } from "react";

/**
 * DependenciesEditor Component - External Dependencies Configuration Panel
 *
 * Provides interface for managing external CDN dependencies for components.
 * Supports adding and removing CDN URLs that will be loaded in the preview iframe.
 *
 * @returns The rendered DependenciesEditor component
 */
export function DependenciesEditor() {
  const activeComponent = useComponentStore((s) => {
    const { activeProjectId, projects } = s;
    if (!activeProjectId) return null;
    const project = projects[activeProjectId];
    if (!project?.activeComponentId) return null;
    return project.components[project.activeComponentId] ?? null;
  });
  
  const dependencies = activeComponent?.dependencies ?? [];
  const addDependency = useComponentStore((s) => s.addDependency);
  const removeDependency = useComponentStore((s) => s.removeDependency);
  const [newDep, setNewDep] = useState('');

  const handleAddDep = () => {
    if (newDep && !dependencies.includes(newDep)) {
      addDependency(newDep);
      setNewDep('');
    }
  };

  return (
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
          className="flex-1 text-sm min-w-0"
          onKeyPress={(e) => e.key === 'Enter' && handleAddDep()}
        />
        <Button onClick={handleAddDep} size="sm" className="px-3 flex-shrink-0">
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
  );
}