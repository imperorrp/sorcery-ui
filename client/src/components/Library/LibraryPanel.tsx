/**
 * LibraryPanel.tsx
 * 
 * A dedicated panel for managing the component library with full CRUD functionality.
 * Updated to support the new project-first architecture.
 * 
 * Features:
 * - Editable project name with renameProject action
 * - Component library display with active component indication (blue dot)
 * - Save current work-in-progress code as a new component
 * - Add blank new components
 * - Rename components with double-click editing
 * - Delete components with confirmation
 * - Switch between components within the active project
 */
import React, { useState } from 'react';
import { useComponentStore } from '@/store/componentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Save, Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showNotification } from '@/components/ui/notification';

export const LibraryPanel: React.FC = () => {
  console.log('[LibraryPanel] Render');
  
  // Access state properties directly
  const activeProjectId = useComponentStore((state) => state.activeProjectId);
  const projects = useComponentStore((state) => state.projects);
  
  // Compute derived values from the accessed state
  const activeProject = activeProjectId ? projects[activeProjectId] : null;
  const activeComponent = activeProject?.activeComponentId 
    ? activeProject.components[activeProject.activeComponentId] 
    : null;
  const allComponents = activeProject ? Object.values(activeProject.components) : [];
  
  console.log('[LibraryPanel] Active project:', activeProject?.name);
  console.log('[LibraryPanel] Active component:', activeComponent?.name);
  console.log('[LibraryPanel] Components count:', allComponents.length);
  
  // Actions
  const renameProject = useComponentStore((state) => state.renameProject);
  const addComponent = useComponentStore((state) => state.addComponent);
  const setActiveComponent = useComponentStore((state) => state.setActiveComponent);
  const deleteComponent = useComponentStore((state) => state.deleteComponent);
  const updateComponentName = useComponentStore((state) => state.updateComponentName);
  const saveActiveCodeAsNewComponent = useComponentStore((state) => state.saveActiveCodeAsNewComponent);
  
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('New Saved Component');

  const handleSave = () => {
    // Open non-blocking save modal instead of native prompt
    setSaveNameInput('New Saved Component');
    setIsSaveModalOpen(true);
  };

  const handleSaveConfirm = () => {
    if (saveNameInput && saveNameInput.trim()) {
      saveActiveCodeAsNewComponent(saveNameInput.trim());
      showNotification({ type: 'success', title: 'Saved', message: `${saveNameInput.trim()} added to library`, duration: 4000 });
    }
    setIsSaveModalOpen(false);
    setSaveNameInput('New Saved Component');
  };

  const handleSaveCancel = () => {
    setIsSaveModalOpen(false);
    setSaveNameInput('New Saved Component');
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
    if (allComponents.length <= 1) {
      showNotification({ type: 'warning', title: 'Cannot delete component', message: 'You must have at least one component in a project.' });
      return;
    }

    // Use notification with action button to confirm deletion (non-blocking)
    showNotification({
      type: 'warning',
      title: 'Confirm delete',
      message: `Click Confirm to delete "${componentName}".`,
      action: {
        label: 'Confirm',
        callback: () => {
          try {
            deleteComponent(componentId);
            showNotification({ type: 'success', title: 'Deleted', message: `${componentName} deleted`, duration: 4000 });
          } catch (err) {
            showNotification({ type: 'error', title: 'Delete failed', message: String(err) });
          }
        }
      }
    });
  };

  const handleProjectNameEdit = () => {
    if (activeProject) {
      setProjectNameInput(activeProject.name);
      setIsEditingProjectName(true);
    }
  };

  const handleProjectNameSubmit = () => {
    if (activeProject && projectNameInput.trim()) {
      renameProject(activeProject.id, projectNameInput.trim());
    }
    setIsEditingProjectName(false);
    setProjectNameInput('');
  };

  const handleProjectNameCancel = () => {
    setIsEditingProjectName(false);
    setProjectNameInput('');
  };

  if (!activeProject) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No active project
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-2 h-full flex flex-col bg-card">
        {/* Project Name Header */}
        <div className="mb-3 pb-2 border-b border-border">
          {isEditingProjectName ? (
            <div className="flex items-center gap-1">
              <Input
                type="text"
                value={projectNameInput}
                onChange={(e) => setProjectNameInput(e.target.value)}
                onBlur={handleProjectNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleProjectNameSubmit();
                  if (e.key === 'Escape') handleProjectNameCancel();
                }}
                className="h-7 text-sm font-semibold flex-1"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleProjectNameSubmit}
              >
                <Check className="h-3.5 w-3.5 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleProjectNameCancel}
              >
                <X className="h-3.5 w-3.5 text-red-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <h3 className="text-sm font-semibold text-foreground truncate flex-1">
                {activeProject.name}
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleProjectNameEdit}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rename project</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Component Library Header */}
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
          <h4 className="text-xs font-medium text-muted-foreground">
            COMPONENTS ({allComponents.length})
          </h4>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 p-0" 
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save current code as new component</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 p-0" 
                onClick={addComponent}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add blank component</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Save modal (non-blocking) */}
      <Dialog open={isSaveModalOpen} onOpenChange={(v) => !v && setIsSaveModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save component</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <Input
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveConfirm();
                if (e.key === 'Escape') handleSaveCancel();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleSaveCancel}>Cancel</Button>
            <Button onClick={handleSaveConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Component List */}
      <div className="space-y-1 grow overflow-auto bg-card">
        {allComponents.map((component) => {
          const isActive = activeComponent?.id === component.id;
          
          return (
            <div
              key={component.id}
              className={cn(
                'group w-full flex justify-between items-center text-left px-2 py-1.5 rounded-md cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground' 
                  : 'hover:bg-accent hover:text-accent-foreground bg-card'
              )}
              onClick={() => setActiveComponent(component.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Active indicator - blue dot */}
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                )}
                
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
                    className="h-6 text-xs flex-1"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span 
                    className="truncate flex-1 text-sm text-foreground"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleRename(component.id, component.name);
                    }}
                    title="Double-click to rename"
                  >
                    {component.name}
                  </span>
                )}
              </div>
              
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
          );
        })}
      </div>
    </div>
    </TooltipProvider>
  );
};
