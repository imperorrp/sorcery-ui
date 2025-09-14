import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { parseClasses, updateClassProperty, extractClassValue, createClassFromValue } from '@/lib/tailwindParser';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * ClassNameEditor Component - UI for managing element className
 *
 * Provides an input field to edit the className of the currently selected element.
 * Changes are applied to the component's AST and reflected in the preview.
 *
 * @returns The rendered ClassNameEditor component
 */
export const ClassNameEditor: React.FC = () => {
  // Use active component selectors for proper data access (same pattern as StyleEditor)
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);
  const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
  const updateNodeClassName = useComponentStore((s) => s.updateNodeClassName);

  // Use the preview AST for editing to avoid side effects (same pattern as StyleEditor)
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !componentPreviewAst) return null;

    const findNode = (node: SerializableElement): SerializableElement | null => {
      if (node.id === selectedNodeId) return node;
      if (node.props.children) {
        for (const child of node.props.children) {
          if (typeof child !== 'string') {
            const found = findNode(child);
            if (found) return found;
          }
        }
      }
      return null;
    };

    return findNode(componentPreviewAst);
  }, [selectedNodeId, componentPreviewAst]);

  // Get current className directly from the selected node (no complex parsing)
  const currentClassName = React.useMemo(() => {
    if (!selectedNode) return '';
    const className = selectedNode.props.className;
    return typeof className === 'string' ? className : '';
  }, [selectedNode]);

  // Parse the current classes into a structured object (only when needed)
  const tailwindState = React.useMemo(() => parseClasses(currentClassName), [currentClassName]);

  const handleClassNameChange = (newClassName: string) => {
    if (selectedNodeId) {
      updateNodeClassName(selectedNodeId, newClassName);
    }
  };

  const handlePropertyChange = (property: keyof Omit<typeof tailwindState, 'remainingClasses'>, value: string) => {
    if (selectedNodeId) {
      const newClassName = updateClassProperty(currentClassName, property, value);
      updateNodeClassName(selectedNodeId, newClassName);
    }
  };

  if (!selectedNode) {
    return <p className="text-sm text-muted-foreground text-center py-4">Select an element to edit its className.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="classname-input" className="text-sm font-medium">
          Class Name
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          Add CSS classes to style this element. Classes defined in Global CSS will be available here.
        </p>
      </div>

      <Input
        id="classname-input"
        type="text"
        placeholder="e.g., bg-blue-500 text-white p-4"
        value={currentClassName}
        onChange={(e) => handleClassNameChange(e.target.value)}
        className="font-mono text-sm"
      />

      <>
        {/* Separator */}
        <div className="border-t border-border my-4"></div>
          {/* Separator */}
          <div className="border-t border-border my-4"></div>

          {/* Visual Controls */}
          <div>
            <h4 className="font-medium text-sm mb-3">Visual Utilities</h4>

            {/* Spacing Section */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Padding</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 4, px-2, py-1"
                    value={tailwindState.padding ? extractClassValue(tailwindState.padding) : ''}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      const classValue = value ? createClassFromValue('padding', value) : '';
                      handlePropertyChange('padding', classValue);
                    }}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Margin</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 4, mx-2, auto"
                    value={tailwindState.margin ? extractClassValue(tailwindState.margin) : ''}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      const classValue = value ? createClassFromValue('margin', value) : '';
                      handlePropertyChange('margin', classValue);
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Colors Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Text Color</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                        {tailwindState.textColor || 'Select color'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <DropdownMenuItem onClick={() => handlePropertyChange('textColor', '')}>
                        None
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('textColor', 'text-black')}>
                        Black
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('textColor', 'text-white')}>
                        White
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('textColor', 'text-gray-500')}>
                        Gray
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('textColor', 'text-red-500')}>
                        Red
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('textColor', 'text-blue-500')}>
                        Blue
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('textColor', 'text-green-500')}>
                        Green
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Background</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                        {tailwindState.backgroundColor || 'Select color'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <DropdownMenuItem onClick={() => handlePropertyChange('backgroundColor', '')}>
                        None
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('backgroundColor', 'bg-white')}>
                        White
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('backgroundColor', 'bg-gray-100')}>
                        Light Gray
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('backgroundColor', 'bg-red-100')}>
                        Light Red
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('backgroundColor', 'bg-blue-100')}>
                        Light Blue
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('backgroundColor', 'bg-green-100')}>
                        Light Green
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Typography Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Font Size</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                        {tailwindState.fontSize || 'Select size'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontSize', '')}>
                        Default
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontSize', 'text-xs')}>
                        Extra Small
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontSize', 'text-sm')}>
                        Small
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontSize', 'text-base')}>
                        Base
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontSize', 'text-lg')}>
                        Large
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontSize', 'text-xl')}>
                        Extra Large
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Font Weight</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                        {tailwindState.fontWeight || 'Select weight'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontWeight', '')}>
                        Default
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontWeight', 'font-light')}>
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontWeight', 'font-normal')}>
                        Normal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontWeight', 'font-medium')}>
                        Medium
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePropertyChange('fontWeight', 'font-bold')}>
                        Bold
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Layout Section */}
              <div>
                <Label className="text-xs font-medium mb-1 block">Display</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      {tailwindState.display || 'Select display'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem onClick={() => handlePropertyChange('display', '')}>
                      Default
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePropertyChange('display', 'block')}>
                      Block
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePropertyChange('display', 'flex')}>
                      Flex
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePropertyChange('display', 'inline')}>
                      Inline
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePropertyChange('display', 'inline-block')}>
                      Inline Block
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePropertyChange('display', 'hidden')}>
                      Hidden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="bg-accent p-3 rounded-md border border-border">
            <p className="text-xs text-accent-foreground">
              💡 <strong>Tip:</strong> Use utility classes like <code className="bg-muted px-1 py-0.5 rounded text-xs">bg-red-500</code> or define custom classes in Global CSS.
            </p>
          </div>
        </>
    </div>
  );
};
