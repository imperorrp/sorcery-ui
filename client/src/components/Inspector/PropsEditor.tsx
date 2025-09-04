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
        <Code className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Props Configuration</span>
      </div>

      <div>
        <Label htmlFor="props-json" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
          <p className="text-xs text-gray-500">
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

      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Pro tip:</strong> Props are the primary way to pass data into your component.
          Use descriptive names and consider adding TypeScript interfaces for better development experience.
        </p>
      </div>
    </div>
  );
};
