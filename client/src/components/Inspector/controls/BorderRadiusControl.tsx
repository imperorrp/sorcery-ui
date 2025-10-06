import React, { useState, useMemo } from 'react';
import { BorderRadiusEditor } from './BorderRadiusEditor';
import { useControlData } from '@/hooks/useControlData';
import type { SerializableElement } from '@/store/componentStore';

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
}

interface BorderRadiusControlProps {
  definition: ControlDefinition;
  selectedNode: SerializableElement;
  modifierPrefix?: string;
}

/**
 * BorderRadiusControl component - Smart container for border radius properties.
 *
 * This component manages multiple variants of border radius utilities and provides
 * a unified interface for controlling corner radii. It handles the complexity of mapping
 * between Tailwind variants and user-friendly corner controls, supporting both linked
 * and unlinked modes.
 *
 * Key features:
 * - Manages border radius variants: all corners, top-left, top-right, bottom-right, bottom-left
 * - Linked/unlinked mode toggle for controlling all corners simultaneously or individually
 * - Automatic synchronization between variants and UI state
 * - Integration with useControlData hook for each variant
 *
 * The component acts as a smart wrapper around the presentational BorderRadiusEditor,
 * handling all data logic and state management while providing clean props to the UI component.
 *
 * @component
 * @param {BorderRadiusControlProps} props - Component props
 * @param {ControlDefinition} props.definition - The full definition object with variants
 * @param {SerializableElement} props.selectedNode - The currently selected component node
 * @param {string} [props.modifierPrefix] - Optional modifier prefix for class generation
 * @returns {JSX.Element} The rendered BorderRadiusControl with BorderRadiusEditor
 */
export const BorderRadiusControl: React.FC<BorderRadiusControlProps> = ({
  definition,
  selectedNode,
  modifierPrefix = ''
}) => {
  // Find the relevant variants
  const variants = useMemo(() => {
    if (!definition.variants) return {};
    const variantMap: Record<string, typeof definition.variants[0]> = {};
    for (const variant of definition.variants) {
      if (variant.label === 'All Corners') variantMap.all = variant;
      else if (variant.label === 'Top-Left Corner') variantMap.topLeft = variant;
      else if (variant.label === 'Top-Right Corner') variantMap.topRight = variant;
      else if (variant.label === 'Bottom-Right Corner') variantMap.bottomRight = variant;
      else if (variant.label === 'Bottom-Left Corner') variantMap.bottomLeft = variant;
    }
    return variantMap;
  }, [definition]);

  // Get hook data for each variant
  const allHook = useControlData(definition, variants.all, selectedNode, modifierPrefix);
  const topLeftHook = useControlData(definition, variants.topLeft, selectedNode, modifierPrefix);
  const topRightHook = useControlData(definition, variants.topRight, selectedNode, modifierPrefix);
  const bottomRightHook = useControlData(definition, variants.bottomRight, selectedNode, modifierPrefix);
  const bottomLeftHook = useControlData(definition, variants.bottomLeft, selectedNode, modifierPrefix);

  // Local state for linked mode
  const [isLinked, setIsLinked] = useState(true);

  /**
   * Toggles between linked and unlinked modes.
   *
   * When switching to linked mode, sets all corners to the "all" value.
   * When switching to unlinked mode, keeps current values.
   */
  const handleLinkToggle = () => {
    const newIsLinked = !isLinked;
    setIsLinked(newIsLinked);

    if (newIsLinked) {
      // When linking, set individual corners to match "all" if it has a value
      const allValue = allHook.currentValue;
      if (allValue) {
        topLeftHook.setValue(allValue);
        topRightHook.setValue(allValue);
        bottomRightHook.setValue(allValue);
        bottomLeftHook.setValue(allValue);
      }
    }
  };

  return (
    <BorderRadiusEditor
      isLinked={isLinked}
      onLinkToggle={handleLinkToggle}
      valueAll={allHook.currentValue || ''}
      onAllChange={(value: string) => {
        allHook.setValue(value || null);
        if (isLinked) {
          // In linked mode, also update individual corners
          topLeftHook.setValue(value || null);
          topRightHook.setValue(value || null);
          bottomRightHook.setValue(value || null);
          bottomLeftHook.setValue(value || null);
        }
      }}
      valueTopLeft={topLeftHook.currentValue || ''}
      onTopLeftChange={(value: string) => topLeftHook.setValue(value || null)}
      valueTopRight={topRightHook.currentValue || ''}
      onTopRightChange={(value: string) => topRightHook.setValue(value || null)}
      valueBottomRight={bottomRightHook.currentValue || ''}
      onBottomRightChange={(value: string) => bottomRightHook.setValue(value || null)}
      valueBottomLeft={bottomLeftHook.currentValue || ''}
      onBottomLeftChange={(value: string) => bottomLeftHook.setValue(value || null)}
    />
  );
};