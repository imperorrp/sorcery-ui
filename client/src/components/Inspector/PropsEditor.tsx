import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '../ui/textarea';
import { useComponentStore } from '@/store/componentStore';

export const PropsEditor: React.FC = () => {
  const { propsJson, setPropsJson } = useComponentStore();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="props-json">Component Props (JSON)</Label>
        <Textarea
          id="props-json"
          placeholder='{ "title": "Hello", "visible": true }'
          className="font-mono h-48 mt-2"
          value={propsJson}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPropsJson(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-2">
          Provide a JSON object for the root component's props. Click "Render" again to apply.
        </p>
      </div>
    </div>
  );
};
