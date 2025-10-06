import React, { useState, useMemo } from 'react';
import { BoxModelEditor } from './BoxModelEditor';
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

interface BoxModelControlProps {
  definition: ControlDefinition;
  selectedNode: SerializableElement;
  modifierPrefix?: string;
}

/**
 * BoxModelControl component - Smart container for box model properties (margin/padding).
 *
 * This component manages multiple variants of spacing utilities (margin/padding) and provides
 * a unified interface for controlling all sides. It handles the complexity of mapping between
 * Tailwind variants and user-friendly box model controls, supporting both linked and unlinked modes.
 *
 * Key features:
 * - Manages multiple variants: all sides, top, right, bottom, left
 * - Linked/unlinked mode toggle for controlling all sides simultaneously or individually
 * - Automatic synchronization between variants and UI state
 * - Integration with useControlData hook for each variant
 *
 * The component acts as a smart wrapper around the presentational BoxModelEditor,
 * handling all data logic and state management while providing clean props to the UI component.
 *
 * @component
 * @param {BoxModelControlProps} props - Component props
 * @param {ControlDefinition} props.definition - The full definition object with variants
 * @param {SerializableElement} props.selectedNode - The currently selected component node
 * @param {string} [props.modifierPrefix] - Optional modifier prefix for class generation
 * @returns {JSX.Element} The rendered BoxModelControl with BoxModelEditor
 */
export const BoxModelControl: React.FC<BoxModelControlProps> = ({
  definition,
  selectedNode,
  modifierPrefix = ''
}) => {
  // Find the relevant variants
  const variants = useMemo(() => {
    if (!definition.variants) return {};
    const variantMap: Record<string, typeof definition.variants[0]> = {};
    for (const variant of definition.variants) {
      if (variant.label === 'All Sides') variantMap.all = variant;
      else if (variant.label === 'Top') variantMap.top = variant;
      else if (variant.label === 'Right') variantMap.right = variant;
      else if (variant.label === 'Bottom') variantMap.bottom = variant;
      else if (variant.label === 'Left') variantMap.left = variant;
    }
    return variantMap;
  }, [definition.variants]);

  // Get hook data for each variant
  const allHook = useControlData(definition, variants.all, selectedNode, modifierPrefix);
  const topHook = useControlData(definition, variants.top, selectedNode, modifierPrefix);
  const rightHook = useControlData(definition, variants.right, selectedNode, modifierPrefix);
  const bottomHook = useControlData(definition, variants.bottom, selectedNode, modifierPrefix);
  const leftHook = useControlData(definition, variants.left, selectedNode, modifierPrefix);

  // Local state for linked mode
  const [isLinked, setIsLinked] = useState(true);

  /**
   * Toggles between linked and unlinked modes.
   *
   * When switching to linked mode, sets all individual sides to the "all" value.
   * When switching to unlinked mode, keeps current values.
   */
  const handleLinkToggle = () => {
    const newIsLinked = !isLinked;
    setIsLinked(newIsLinked);

    if (newIsLinked) {
      // When linking, set individual sides to match "all" if it has a value
      const allValue = allHook.currentValue;
      if (allValue) {
        topHook.setValue(allValue);
        rightHook.setValue(allValue);
        bottomHook.setValue(allValue);
        leftHook.setValue(allValue);
      }
    }
  };

  return (
    <BoxModelEditor
      isLinked={isLinked}
      onLinkToggle={handleLinkToggle}
      valueAll={allHook.currentValue || ''}
      onAllChange={(value: string) => {
        allHook.setValue(value || null);
        if (isLinked) {
          // In linked mode, also update individual sides
          topHook.setValue(value || null);
          rightHook.setValue(value || null);
          bottomHook.setValue(value || null);
          leftHook.setValue(value || null);
        }
      }}
      valueTop={topHook.currentValue || ''}
      onTopChange={(value: string) => topHook.setValue(value || null)}
      valueRight={rightHook.currentValue || ''}
      onRightChange={(value: string) => rightHook.setValue(value || null)}
      valueBottom={bottomHook.currentValue || ''}
      onBottomChange={(value: string) => bottomHook.setValue(value || null)}
      valueLeft={leftHook.currentValue || ''}
      onLeftChange={(value: string) => leftHook.setValue(value || null)}
    />
  );
};