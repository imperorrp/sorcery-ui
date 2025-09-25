import React from 'react';
import type { SerializableElement } from '@/store/componentStore';
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
  GradientEditor,
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
  'GradientEditor': GradientEditor,
};

interface ControlDefinition {
  category: string;
  label: string;
  description: string;
  group: string;
  control?: {
    type: string;
    [key: string]: unknown;
  };
  controls?: Array<{
    type: string;
    strategy?: string;
    [key: string]: unknown;
  }>;
  strategies?: Array<{
    type: string;
    classes?: Array<{ class: string; value?: string; label?: string }>;
    generative?: { template: string; dataset: string };
    arbitrary?: { template: string };
  }>;
  classes?: Array<{ class: string; value?: string; label?: string }> | { "$ref": string };
  modifiers?: string[];
  supportsArbitrary?: boolean;
  structuralVariants?: Array<{ label: string; template: string }>;
  docUrl?: string;
}

interface ClassNameEditorProps {
  definition: ControlDefinition; // Single definition object that may have multiple controls
  selectedNode: SerializableElement;
  modifierPrefix?: string;
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
export const ClassNameEditor: React.FC<ClassNameEditorProps> = ({
  definition,
  selectedNode,
  modifierPrefix = ''
}) => {
  // Single control - render directly
  const controlDefinition = definition.control;
  if (!controlDefinition) {
    return (
      <ControlRow definition={definition} selectedNode={selectedNode}>
        <div className="text-xs p-2 bg-red-100 rounded">
          No control defined for '{definition.label}'
        </div>
      </ControlRow>
    );
  }

  const ControlComponent = controlMap[controlDefinition.type];

  if (!ControlComponent) {
    return (
      <ControlRow definition={definition} selectedNode={selectedNode}>
        <div className="text-xs p-2 bg-red-100 rounded">
          Control '{controlDefinition.type}' for '{definition.label}' is not yet implemented.
        </div>
      </ControlRow>
    );
  }

  return (
    <ControlRow definition={definition} selectedNode={selectedNode}>
      <ControlComponent
        definition={definition}
        selectedNode={selectedNode}
        modifierPrefix={modifierPrefix}
        {...controlDefinition}
      />
    </ControlRow>
  );
};