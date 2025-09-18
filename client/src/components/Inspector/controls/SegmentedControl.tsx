import React from 'react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

interface SmartSegmentedControlProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string; label?: string }>;
  };
  selectedNode: SerializableElement;
  options?: Array<{ value: string; label?: string }>;
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
  selectedNode,
  options,
}) => {
  const { updateUtilityClass } = useComponentStore();

  // Find current selection from utility state
  const currentValue = selectedNode.utilityClassState?.[definition.category] || '';

  /**
   * Handles option selection changes and updates the component's utility state.
   * 
   * This function is called when the user selects a new option from the segmented control.
   * It updates the component store with the selected value, or clears the utility class
   * if an empty value is provided (allowing for "no selection" state).
   * 
   * @param {string} value - The selected option value, or empty string to clear selection
   * @returns {void}
   */
  const handleValueChange = (value: string) => {
    updateUtilityClass(selectedNode.id, definition.category, value || null);
  };

  // Use provided options or generate from definition.classes
  const controlOptions = options || definition.classes.map(cls => ({
    value: cls.class,
    label: cls.label || cls.class,
  }));

  return (
    <SegmentedControl
      value={currentValue}
      onValueChange={handleValueChange}
      options={controlOptions}
      className="w-full"
    />
  );
};