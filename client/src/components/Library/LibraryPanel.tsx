/**
 * LibraryPanel.tsx
 * 
 * A dedicated panel for managing the component library with full CRUD functionality.
 * This component provides a powerful interface for creating, renaming, deleting, and 
 * saving components in the user's library.
 * 
 * Features:
 * - Component library display with active component indication
 * - Save current work-in-progress code as a new component
 * - Add blank new components
 * - Rename components with double-click editing
 * - Delete components with confirmation
 * - Switch between components
 */
import React, { useState } from 'react';
import { useComponentStore } from '@/store/componentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LibraryPanel: React.FC = () => {
  const { 
    components, 
    activeComponentId, 
    addComponent, 
    setActiveComponent, 
    deleteComponent, 
    updateComponentName, 
    saveActiveCodeAsNewComponent 
  } = useComponentStore();
  
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const handleSave = () => {
    const name = prompt("Enter a name for the new component:", "New Saved Component");
    if (name && name.trim()) {
      saveActiveCodeAsNewComponent(name.trim());
    }
  };

  const handleRename = (componentId: string, currentName: string) => {
    setRenamingId(componentId);
    setNewName(currentName);
  };

  const handleRenameSubmit = () => {
    if (renamingId && newName.trim()) {
      updateComponentName(renamingId, newName.trim());
    }
    setRenamingId(null);
    setNewName('');
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setNewName('');
  };

  const handleDelete = (componentId: string, componentName: string) => {
    if (Object.keys(components).length <= 1) {
      alert("Cannot delete the last component. You must have at least one component.");
      return;
    }
    
    if (confirm(`Delete "${componentName}"? This action cannot be undone.`)) {
      deleteComponent(componentId);
    }
  };

  return (
    <div className="p-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-300 dark:border-gray-700">
        <h3 className="text-sm font-semibold">Component Library</h3>
        <div className="flex gap-1">
          <Button 
            title="Save current code as new component" 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button 
            title="Add blank component" 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={addComponent}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Component List */}
      <div className="space-y-1 flex-grow overflow-auto">
        {Object.values(components).map((component) => (
          <div
            key={component.id}
            className={cn(
              'group w-full flex justify-between items-center text-left text-sm px-2 py-1.5 rounded-md cursor-pointer transition-colors',
              activeComponentId === component.id 
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            onClick={() => setActiveComponent(component.id)}
          >
            {renamingId === component.id ? (
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') handleRenameCancel();
                }}
                className="h-6 text-xs flex-1 mr-2"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                className="truncate flex-1"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleRename(component.id, component.name);
                }}
                title="Double-click to rename"
              >
                {component.name}
              </span>
            )}
            
            {renamingId !== component.id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleDelete(component.id, component.name);
                }}
                title="Delete component"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
