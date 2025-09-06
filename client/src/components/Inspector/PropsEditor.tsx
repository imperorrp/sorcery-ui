import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { useComponentStore } from '@/store/componentStore';
import { Code, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PropsEditor: React.FC = () => {
  // Use active component selectors for proper data access
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const propsJson = activeComponent?.propsJson ?? '{}';
  const setPropsJson = useComponentStore((s) => s.setPropsJson);

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
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Define the data your component receives as props. Changes require clicking "Render" to apply.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setPropsJson('{\n  "title": "Hello World",\n  "visible": true\n}')}
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
