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
    <div className="p-4 min-w-0">
      <Tabs defaultValue="style" className="w-full">
        <TabsList className="flex w-full flex-wrap h-auto">
          <TabsTrigger value="style" className="flex items-center gap-2 flex-1 min-w-0">
            <Palette className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Style</span>
          </TabsTrigger>
          <TabsTrigger value="props" className="flex items-center gap-2 flex-1 min-w-0">
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Props</span>
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center gap-2 flex-1 min-w-0">
            <Wrench className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Setup</span>
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
