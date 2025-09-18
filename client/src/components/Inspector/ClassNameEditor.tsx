import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { commonProperties } from './inspector-config';
import { ControlRow } from './controls/ControlRow';
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
  NumberInput,
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
  controls: ControlDefinition[]; // Controls for this specific group
  group: string; // The group name (e.g., "Layout", "Typography")
}

/**
 * ClassNameEditor Component - Manages controls within a single accordion group
 *
 * This component is the brain for each accordion item in the InspectorPanel. It handles:
 * - Common vs Advanced control separation per group for better UX
 * - Quick navigation for dense categories with anchor links
 * - Enhanced ControlRow rendering with active indicators and reset functionality
 * - Dynamic control rendering based on Tailwind definitions
 * - Error handling for unimplemented control types
 *
 * @param {ControlDefinition[]} controls - Array of control definitions for this specific group
 * @param {string} group - The group name for categorization (e.g., "Layout", "Typography")
 * @returns {JSX.Element} The rendered ClassNameEditor component
 */
export const ClassNameEditor: React.FC<ClassNameEditorProps> = ({ controls, group }) => {
  const [isAdvancedVisible, setAdvancedVisible] = useState(false);

  // Get current className from the store
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);
  const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;

  // Find the selected node
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !componentPreviewAst) return null;

  /**
   * Recursively find a node by ID in the component AST
   *
   * @param {SerializableElement} node - The current node to search
   * @returns {SerializableElement | null} The found node or null if not found
   */
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

  // No local diff tracking; global baseline exists in InspectorPanel

  // Removed class tokens and diff; global display now in InspectorPanel

  // Separate controls into common and advanced for this specific group
  const { commonControls, advancedControls } = useMemo(() => {
    const commonCategories = (commonProperties as Record<string, string[]>)[group] || [];
    const common = controls.filter(c => commonCategories.includes(c.category));
    const advanced = controls.filter(c => !commonCategories.includes(c.category));
    return { commonControls: common, advancedControls: advanced };
  }, [controls, group]);

  if (!selectedNode) {
    return <p className="text-sm text-muted-foreground text-center py-4">Select an element to edit its className.</p>;
  }

  return (
    // Enforce strict flexbox layout for proper vertical stacking
  <div className="flex flex-col gap-0.5">
      {/* Quick-Nav Menu - Only show if there are many controls */}
      {controls.length > 5 && (
        <div className="flex flex-wrap gap-1 pb-2 mb-2 border-b border-border">
          {controls.map(def => (
            <a
              key={def.category}
              href={`#control-${def.category}`}
              className="px-2 py-0.5 text-xs bg-muted hover:bg-muted-foreground/20 rounded-full transition-colors"
              title={`Jump to ${def.label}`}
            >
              {def.label}
            </a>
          ))}
        </div>
      )}

    {/* Common Controls - Always Visible */}
  <div className="flex flex-col gap-0.5">
        {commonControls.map((definition) => {
          const ControlComponent = controlMap[definition.control.type];

          if (!ControlComponent) {
            return (
              <div key={definition.category} className="text-xs p-2 bg-red-100 rounded">
                Control '{definition.control.type}' for '{definition.label}' is not yet implemented.
              </div>
            );
          }

          return (
            <ControlRow
              key={definition.category}
              definition={definition}
              selectedNode={selectedNode}
            >
              <ControlComponent
                definition={definition}
                selectedNode={selectedNode}
                {...definition.control}
              />
            </ControlRow>
          );
        })}
      </div>

      {/* Advanced Controls - Toggleable */}
      {advancedControls.length > 0 && (
        <>
          {/* Show/Hide Advanced Button */}
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setAdvancedVisible(!isAdvancedVisible)}
            >
              <ChevronDown
                className={`h-3 w-3 mr-1 transition-transform ${
                  isAdvancedVisible ? 'rotate-180' : ''
                }`}
              />
              {isAdvancedVisible
                ? 'Hide Advanced'
                : `Show ${advancedControls.length} more ${group} properties`
              }
            </Button>
          </div>

          {/* Advanced Controls Section */}
          {isAdvancedVisible && (
            <div className="flex flex-col gap-0.5 pl-3 border-l border-border/60">
              {advancedControls.map((definition) => {
                const ControlComponent = controlMap[definition.control.type];

                if (!ControlComponent) {
                  return (
                    <div key={definition.category} className="text-xs p-2 bg-red-100 rounded">
                      Control '{definition.control.type}' for '{definition.label}' is not yet implemented.
                    </div>
                  );
                }

                return (
                  <ControlRow
                    key={definition.category}
                    definition={definition}
                    selectedNode={selectedNode}
                  >
                    <ControlComponent
                      definition={definition}
                      selectedNode={selectedNode}
                      {...definition.control}
                    />
                  </ControlRow>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
