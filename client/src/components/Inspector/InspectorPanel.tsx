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
        <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger
            value="style"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Palette className="h-4 w-4" />
            <span className="font-medium">Style</span>
          </TabsTrigger>
          <TabsTrigger
            value="props"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Settings className="h-4 w-4" />
            <span className="font-medium">Props</span>
          </TabsTrigger>
          <TabsTrigger
            value="setup"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm rounded-md transition-all"
          >
            <Wrench className="h-4 w-4" />
            <span className="font-medium">Setup</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Visual Styling</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Customize the appearance of selected elements with colors, fonts, and layout properties.
            </p>
          </div>
          <StyleEditor />
        </TabsContent>

        <TabsContent value="props" className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Component Properties</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Define the data and configuration that your component receives as props.
            </p>
          </div>
          <PropsEditor />
        </TabsContent>

        <TabsContent value="setup" className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Environment Setup</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Configure context wrappers and external dependencies for your component.
            </p>
          </div>
          <SetupEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};
