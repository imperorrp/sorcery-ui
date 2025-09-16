import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { StyleEditor } from './StyleEditor';
import { ClassNameEditor } from './ClassNameEditor';
import { Layers, Brush, Search } from 'lucide-react';

// Import the definitions from tailwind-inspector.json
import tailwindInspectorDefinitions from '../../lib/definitions/tailwind-inspector.json';

interface ControlDefinition {
  category: string;
  label: string;
  description: string;
  group: string;
  control: {
    type: string;
    [key: string]: unknown;
  };
  classes: Array<{ class: string; value: string; label?: string }> | { "$ref": string };
  modifiers: string[];
}

/**
 * InspectorPanel component that provides a tabbed interface for editing component properties.
 * Contains tabs for Style and Classes editors.
 *
 * @returns The rendered InspectorPanel component
 */
export const InspectorPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter definitions based on search query
  const filteredControls = useMemo(() => {
    // Convert object to array of definitions
    const definitionsArray = Object.entries(tailwindInspectorDefinitions).map(([category, definition]) => ({
      category,
      ...definition
    })) as ControlDefinition[];

    if (!searchQuery.trim()) {
      return definitionsArray;
    }

    const query = searchQuery.toLowerCase();
    return definitionsArray.filter(definition =>
      definition.label.toLowerCase().includes(query) ||
      definition.description.toLowerCase().includes(query) ||
      definition.category.toLowerCase().includes(query) ||
      definition.group.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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
              Apply CSS classes to selected elements using definition-driven controls.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          </div>

          <ClassNameEditor controls={filteredControls} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
