import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useComponentStore } from '@/store/componentStore';
import { StyleEditor } from './StyleEditor';
import { PropsEditor } from './PropsEditor';
import { SetupEditor } from './SetupEditor';

export const InspectorPanel: React.FC = () => {
  const { undo, redo, historyIndex, history } = useComponentStore();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold px-2">History</h3>
        <div className="flex space-x-2 mt-2">
          <Button onClick={undo} disabled={!canUndo} variant="outline">Undo</Button>
          <Button onClick={redo} disabled={!canRedo} variant="outline">Redo</Button>
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
