/**
 * ComponentLibrary.tsx
 * 
 * This component displays the list of components in the user's library and provides
 * functionality to add new components and switch between them. It serves as the main
 * control panel for managing multiple components in the Live Component Editor.
 * 
 * Features:
 * - Display all components in the library
 * - Visual indication of the currently active component
 * - Add new component button
 * - Switch between components by clicking
 */
import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ComponentLibrary: React.FC = () => {
  const { components, activeComponentId, addComponent, setActiveComponent } = useComponentStore();

  return (
    <div className="p-2 border-b border-gray-300 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Components</h3>
        <Button variant="ghost" size="sm" onClick={addComponent}>
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        {Object.values(components).map((component) => (
          <button
            key={component.id}
            onClick={() => setActiveComponent(component.id)}
            className={cn(
              'w-full text-left text-sm px-2 py-1 rounded-md truncate',
              activeComponentId === component.id
                ? 'bg-blue-600/20 text-blue-800 dark:text-blue-300'
                : 'hover:bg-gray-200 dark:hover:bg-gray-800'
            )}
          >
            {component.name}
          </button>
        ))}
      </div>
    </div>
  );
};
