import React from 'react';
import type { SerializableElement } from '@/store/componentStore';
import { useComponentStore } from '@/store/componentStore';
import { ControlRow } from './controls/ControlRow';
import { UtilityControlFactory } from './controls/UtilityControlFactory';

interface ControlDefinition {
  category: string;
  label: string;
  description: string;
  group: string;
  control?: {
    type: string;
    [key: string]: unknown;
  };
  variants?: Array<{
    label: string;
    prefix: string;
    template: string;
    supportsNegative: boolean;
  }>;
  valueSets?: Array<{
    type: string;
    options?: Array<{ class: string; value?: string; label?: string }>;
    source?: string;
    examples?: string[];
    typeHint?: string;
    placeholder?: string;
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
 * This component acts as the orchestration layer for a single utility row in the
 * InspectorPanel. It delegates UI rendering to the `UtilityControlFactory` while
 * coordinating control state with `ControlRow` so that each utility appears as a
 * cohesive unit regardless of how many variants it exposes.
 *
 * Responsibilities:
 * - Normalize Tailwind control definitions, ensuring a default variant exists
 * - Compute active state across all variants for a given utility
 * - Provide a single reset handler that clears every related utility class
 * - Render the appropriate control grouping via `UtilityControlFactory`
 * - Supply metadata (active state, reset) to `ControlRow` for consistent UX
 *
 * @param {ControlDefinition} definition - Utility definition describing control behaviour
 * @param {SerializableElement} selectedNode - The currently selected node within the canvas
 * @param {string} [modifierPrefix] - Optional prefix applied to generated utility classes
 * @returns {JSX.Element} The rendered ClassNameEditor component
 */
export const ClassNameEditor: React.FC<ClassNameEditorProps> = ({
  definition,
  selectedNode,
  modifierPrefix = '',
}) => {
  const updateUtilityClass = useComponentStore((state) => state.updateUtilityClass);

  const variants = React.useMemo(() => {
    if (definition.variants && definition.variants.length > 0) {
      return definition.variants;
    }
    return [
      {
        label: 'Default',
        prefix: '',
        template: '{value}',
        supportsNegative: false,
      },
    ];
  }, [definition.variants]);

  const stateKeys = React.useMemo(() => {
    const keys = variants.map(
      (variant) => `${definition.category}-${variant.label.toLowerCase().replace(/\s+/g, '-')}`
    );
    keys.push(definition.category);
    return Array.from(new Set(keys));
  }, [definition.category, variants]);

  const isActive = React.useMemo(() => {
    if (!selectedNode) return false;
    return stateKeys.some((key) => Boolean(selectedNode.utilityClassState?.[key]));
  }, [selectedNode, stateKeys]);

  // Compute the current class (string) shown in the control row. If multiple
  // variant keys exist, prefer the first non-empty one; otherwise fall back to
  // the raw category key.
  const currentClass = React.useMemo(() => {
    if (!selectedNode) return null;
    for (const key of stateKeys) {
      const cls = selectedNode.utilityClassState?.[key];
      if (cls) return cls;
    }
    return null;
  }, [selectedNode, stateKeys]);

  const handleReset = React.useCallback(() => {
    if (!selectedNode) return;
    for (const key of stateKeys) {
      updateUtilityClass(selectedNode.id, key, null);
    }
  }, [selectedNode, stateKeys, updateUtilityClass]);

  return (
    <ControlRow definition={definition} isActive={isActive} onReset={handleReset} currentClass={currentClass}>
      <UtilityControlFactory
        definition={definition}
        selectedNode={selectedNode}
        modifierPrefix={modifierPrefix}
      />
    </ControlRow>
  );
};