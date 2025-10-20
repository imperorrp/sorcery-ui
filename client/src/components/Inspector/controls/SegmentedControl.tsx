import React from 'react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useControlData } from '@/hooks/useControlData';
import { getCssForClass, stripVariantPrefixes } from '@/lib/themeUtils';
import type { SerializableElement } from '@/store/componentStore';
import { segmentedControlIconMap } from '../inspector-config';

interface SmartSegmentedControlProps {
  // For backward compatibility (TabbedControl usage)
  definition?: {
    category: string;
    label: string;
    description: string;
    strategies: Array<{
      type: 'list' | 'generative' | 'arbitrary';
      classes?: Array<{ class: string; value: string; label?: string }>;
      generative?: {
        template: string;
        dataset: string;
      };
      arbitrary?: {
        template: string;
      };
    }>;
  };
  variant?: {
    label: string;
    prefix: string;
    template: string;
    supportsNegative: boolean;
  };
  selectedNode?: SerializableElement;
  modifierPrefix?: string;
  
  // For new architecture (ClassNameEditor usage)
  options?: Array<{ value: string; label: string }>;
  value?: string | null;
  onChange?: (value: string | null) => void;
  resolvedTheme?: Record<string, unknown>;
}

/**
 * SmartSegmentedControl component for selecting values from predefined option sets.
 * 
 * This component provides an elegant segmented control interface for choosing between
 * multiple predefined options, commonly used for properties like text alignment,
 * flex direction, display modes, and other categorical values. It seamlessly integrates
 * with the component store's utility state system and supports both externally provided
 * options and options generated from Tailwind class definitions.
 * 
 * Key features:
 * - Dynamic option generation from Tailwind class definitions or external option arrays
 * - Automatic current value detection from component utility state
 * - Flexible option labeling with fallbacks to class names
 * - Real-time utility state synchronization
 * - Consistent UI with the SegmentedControl component
 * - Support for clearing selections (null values)
 * 
 * The component handles the complexity of option management while providing a clean,
 * intuitive interface for categorical property selection in the visual editor.
 * 
 * @component
 * @param {SmartSegmentedControlProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata and class options
 * @param {string} props.definition.category - The property category (e.g., 'textAlign', 'flexDirection', 'display')
 * @param {string} props.definition.label - Display label for the segmented control
 * @param {string} props.definition.description - Descriptive text explaining the control's purpose
 * @param {Array<{class: string, value: string, label?: string}>} props.definition.classes - Array of available Tailwind classes with optional labels
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @param {Array<{value: string, label?: string}>} [props.options] - Optional external options array to override definition.classes
 * @returns {JSX.Element} The rendered SmartSegmentedControl component with option selection interface
 */
export const SmartSegmentedControl: React.FC<SmartSegmentedControlProps> = ({
  definition,
  variant,
  selectedNode,
  options: externalOptions,
  modifierPrefix = '',
  // New architecture props
  options: resolvedOptions,
  value,
  onChange,
  resolvedTheme,
}) => {
  // Always call hook (it handles undefined definition and selectedNode)
  const hookData = useControlData(definition, variant || { label: 'Default', prefix: '', template: '{value}', supportsNegative: false }, selectedNode, modifierPrefix);
  
  // Determine which mode we're in
  const isNewArchitecture = !definition && resolvedOptions !== undefined;
  
  let controlOptions: Array<{ value: string; label: string }>;
  let currentValue: string | null | undefined;
  let handleValueChange: (value: string) => void;
  
  if (isNewArchitecture) {
    // New architecture: use provided props
    controlOptions = resolvedOptions || [];
    currentValue = value;
    handleValueChange = (val: string) => {
      if (onChange) onChange(val || null);
    };
  } else if (definition) {
    // Old architecture: use hook
    controlOptions = externalOptions || hookData.options;
    currentValue = hookData.currentValue;
    handleValueChange = (val: string) => hookData.setValue(val || null);
  } else {
    // Fallback
    controlOptions = [];
    currentValue = null;
    handleValueChange = () => {};
  }

  // Compute preview styles for options
  const optionStyles = resolvedTheme ? controlOptions.map(option => {
    const previewStyle = getCssForClass(option.value, resolvedTheme);
    return previewStyle as React.CSSProperties;
  }) : undefined;

  const optionsWithIcons = controlOptions.map((option) => {
    const baseClass = stripVariantPrefixes(option.value);
    const IconComponent = segmentedControlIconMap[baseClass];
    return {
      ...option,
      icon: IconComponent ? <IconComponent className="h-3.5 w-3.5" /> : undefined,
    };
  });

  return (
    <SegmentedControl
      value={currentValue || undefined}
      onValueChange={handleValueChange}
      options={optionsWithIcons}
      className="w-full"
      optionStyles={optionStyles}
    />
  );
};