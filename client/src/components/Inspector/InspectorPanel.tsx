import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StyleEditor } from './StyleEditor';
import { PropsEditor } from './PropsEditor';
import { SetupEditor } from './SetupEditor';
import { Palette, Settings, Wrench } from 'lucide-react';

/**
 * InspectorPanel component that provides a tabbed interface for editing component properties.
 * Contains tabs for Style, Props, and Setup editors.
 *
 * @returns The rendered InspectorPanel component
 */
export const InspectorPanel: React.FC = () => {
  return (
    <div className="p-4">
      <Tabs defaultValue="style" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="font-medium">Style</span>
          </TabsTrigger>
          <TabsTrigger value="props" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="font-medium">Props</span>
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="font-medium">Setup</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Visual Styling</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Customize the appearance of selected elements with colors, fonts, and layout properties.
            </p>
          </div>
          <StyleEditor />
        </TabsContent>

        <TabsContent value="props" className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Component Properties</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Define the data and configuration that your component receives as props.
            </p>
          </div>
          <PropsEditor />
        </TabsContent>

        <TabsContent value="setup" className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Environment Setup</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Configure context wrappers and external dependencies for your component.
            </p>
          </div>
          <SetupEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};
