import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StyleEditor } from './StyleEditor';
import { ClassNameEditor } from './ClassNameEditor';
import { Layers, Brush } from 'lucide-react';

/**
 * InspectorPanel component that provides a tabbed interface for editing component properties.
 * Contains tabs for Style and Classes editors.
 *
 * @returns The rendered InspectorPanel component
 */
export const InspectorPanel: React.FC = () => {
  return (
    <div className="p-4 min-w-0">
      <Tabs defaultValue="style" className="w-full">
        <TabsList className="flex w-full flex-wrap h-auto">
          <TabsTrigger value="style" className="flex items-center gap-2 flex-1 min-w-0">
            <Brush className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Style</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2 flex-1 min-w-0">
            <Layers className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Classes</span>
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

        <TabsContent value="classes" className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">CSS Classes</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Apply CSS classes to selected elements. Define utility classes in the Global CSS section.
            </p>
          </div>
          <ClassNameEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};
