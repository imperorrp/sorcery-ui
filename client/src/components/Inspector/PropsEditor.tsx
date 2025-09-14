import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { useComponentStore } from '@/store/componentStore';
import { Code, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PropsEditor Component - Component Properties Configuration Panel
 *
 * Provides an interface for editing component props as JSON. Changes are applied
 * when the user clicks "Render" to update the component preview.
 *
 * @returns The rendered PropsEditor component
 */
export const PropsEditor: React.FC = () => {
  // Use active component selectors for proper data access
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const propsJson = activeComponent?.propsJson ?? '{}';
  const setPropsJson = useComponentStore((s) => s.setPropsJson);

  // Get default props for the current example
  const getDefaultPropsForExample = () => {
    // Use originalPropsJson if it exists (for components loaded from examples)
    if (activeComponent?.originalPropsJson) {
      return activeComponent.originalPropsJson;
    }

    // Fallback to hardcoded defaults for non-example components
    return '{\n  "title": "Hello World",\n  "visible": true\n}';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Code className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Props Configuration</span>
      </div>

      <div>
        <Label htmlFor="props-json" className="text-sm font-medium text-foreground">
          Component Props (JSON)
        </Label>
        <Textarea
          id="props-json"
          placeholder='{ "title": "Hello World", "visible": true, "count": 42 }'
          className="font-mono h-48 mt-2 text-sm leading-relaxed"
          value={propsJson}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPropsJson(e.target.value)}
        />
        <div className="flex flex-col gap-2 mt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <p className="text-xs text-muted-foreground flex-1 min-w-0">
            Define the data your component receives as props. Changes require clicking "Render" to apply.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="text-xs flex-shrink-0"
            onClick={() => setPropsJson(getDefaultPropsForExample())}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-accent p-3 rounded-md border border-border">
        <p className="text-xs text-accent-foreground">
          💡 <strong>Pro tip:</strong> Props are the primary way to pass data into your component.
          Use descriptive names and consider adding TypeScript interfaces for better development experience.
        </p>
      </div>
    </div>
  );
};
