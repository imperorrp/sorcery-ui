import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropsEditor } from './PropsEditor';
import { ThemeCssEditor } from './ThemeCssEditor';
import { TailwindConfigEditor } from './TailwindConfigEditor';
import { ContextWrapperEditor } from './ContextWrapperEditor';
import { DependenciesEditor } from './DependenciesEditor';
import { Settings, Package, WrapText, FileCode } from 'lucide-react';

/**
 * ConfigurerPanel component that provides a tabbed interface for component configuration.
 * Contains tabs for Props, Theme CSS, Context Wrapper, and External Dependencies editors.
 *
 * @returns The rendered ConfigurerPanel component
 */
export const ConfigurerPanel: React.FC = () => {
  return (
    <div className="p-4 min-w-0">
      <Tabs defaultValue="props" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="props" className="flex items-center gap-2 flex-1 min-w-0">
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Props</span>
          </TabsTrigger>
          <TabsTrigger value="css" className="flex items-center gap-2 flex-1 min-w-0">
            <FileCode className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Theme CSS</span>
          </TabsTrigger>
          <TabsTrigger value="wrapper" className="flex items-center gap-2 flex-1 min-w-0">
            <WrapText className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Wrapper</span>
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="flex items-center gap-2 flex-1 min-w-0">
            <Package className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Deps</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="props" className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Component Properties</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Define the data and configuration that your component receives as props.
            </p>
          </div>
          <PropsEditor />
        </TabsContent>

        <TabsContent value="css" className="mt-6">
          <Tabs defaultValue="theme-css" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="theme-css" className="flex items-center gap-2 flex-1 min-w-0">
                <FileCode className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium truncate">CSS Variables</span>
              </TabsTrigger>
              <TabsTrigger value="tailwind-config" className="flex items-center gap-2 flex-1 min-w-0">
                <FileCode className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium truncate">Tailwind Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="theme-css" className="mt-4">
              <ThemeCssEditor />
            </TabsContent>

            <TabsContent value="tailwind-config" className="mt-4">
              <TailwindConfigEditor />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="wrapper" className="mt-6">
          <ContextWrapperEditor />
        </TabsContent>

        <TabsContent value="dependencies" className="mt-6">
          <DependenciesEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};