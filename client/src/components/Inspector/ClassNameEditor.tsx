import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import {
  SelectControl,
  BoxModelEditor,
  ColorPicker,
  Slider,
  ShadowEditor,
  Toggle,
  SmartSegmentedControl,
  SizeInput,
  TextInput,
  NumberInput
} from './controls';

// Control map to connect control.type strings to React components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const controlMap: Record<string, React.ComponentType<any>> = {
  'Select': SelectControl,
  'BoxModelEditor': BoxModelEditor,
  'ColorPicker': ColorPicker,
  'Slider': Slider,
  'ShadowEditor': ShadowEditor,
  'Toggle': Toggle,
  'SegmentedControl': SmartSegmentedControl,
  'SizeInput': SizeInput,
  'TextInput': TextInput,
  'NumberInput': NumberInput,
};

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

interface ClassNameEditorProps {
  controls: ControlDefinition[]; // Array of control definitions from tailwind-inspector.json
}

/**
 * ClassNameEditor Component - UI for managing element className
 *
 * Provides an input field to edit the className of the currently selected element.
 * Changes are applied to the component's AST and reflected in the preview.
 * Supports definition-driven controls for visual editing of Tailwind classes.
 *
 * @param controls - Array of control definitions for various Tailwind properties
 * @returns The rendered ClassNameEditor component
 */
export const ClassNameEditor: React.FC<ClassNameEditorProps> = ({ controls }) => {
  // Use active component selectors for proper data access
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);
  const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
  const updateNodeClassName = useComponentStore((s) => s.updateNodeClassName);

  // Find the selected node
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

  // Get current className
  const currentClassName = React.useMemo(() => {
    if (!selectedNode) return '';
    const className = selectedNode.props.className;
    return typeof className === 'string' ? className : '';
  }, [selectedNode]);

  /**
   * Handles changes to the className input field
   *
   * @param newClassName - The new className string to apply to the selected element
   */
  const handleClassChange = (newClassName: string) => {
    if (selectedNodeId) {
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
        onChange={(e) => handleClassChange(e.target.value)}
        className="font-mono text-sm"
      />

      {/* Definition-Driven Controls */}
      <div className="space-y-4">
        {controls.map((definition) => {
          const ControlComponent = controlMap[definition.control.type];

          if (!ControlComponent) {
            return (
              <div key={definition.category} className="text-xs p-2 bg-red-100 rounded">
                Control '{definition.control.type}' for '{definition.label}' is not yet implemented.
              </div>
            );
          }

          return (
            <div key={definition.category}>
              <Label className="text-xs font-medium mb-1 block">
                {definition.label}
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                {definition.description}
              </p>
              <ControlComponent
                definition={definition}
                currentClassName={currentClassName}
                onClassChange={handleClassChange}
                {...definition.control}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
