import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useComponentStore } from '@/store/componentStore';
import { StyleEditor } from './StyleEditor';
import { PropsEditor } from './PropsEditor';
import { SetupEditor } from './SetupEditor';

export interface InspectorPanelProps {
  onApplyChanges: () => void | Promise<void>;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ onApplyChanges }) => {
  const { undo, redo, historyIndex, history, isDirty } = useComponentStore();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold px-2">History</h3>
        <div className="flex space-x-2 mt-2">
          <Button onClick={undo} disabled={!canUndo} variant="outline">Undo</Button>
          <Button onClick={redo} disabled={!canRedo} variant="outline">Redo</Button>
          <Button
            onClick={() => {
              console.log('Apply Changes clicked, isDirty:', isDirty);
              void onApplyChanges();
            }}
            disabled={!isDirty}
            className={`ml-auto px-4 py-2 rounded-md font-medium transition-colors ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={isDirty ? 'Apply inspector changes into the code editor' : 'No changes to apply'}
          >
            Apply Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="style" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="props">Props</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>
        <TabsContent value="style" className="mt-4">
          <StyleEditor />
        </TabsContent>
        <TabsContent value="props" className="mt-4">
          <PropsEditor />
        </TabsContent>
        <TabsContent value="setup" className="mt-4">
          <SetupEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};
