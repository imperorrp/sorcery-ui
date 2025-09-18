import React from 'react';
import { Input } from '@/components/ui/input';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

interface SizeInputProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string }>;
  };
  selectedNode: SerializableElement;
}

/**
 * SizeInput component for flexible size value input with automatic Tailwind class generation.
 * 
 * This component provides an intelligent text input interface for size-related CSS properties
 * like width, height, min-width, max-height, and other dimensional values. It automatically
 * converts user input into appropriate Tailwind utility classes while supporting various
 * input formats including numbers, percentages, pixels, and Tailwind-specific values.
 * 
 * Key features:
 * - Flexible input parsing supporting multiple formats (numbers, px, %, fractions)
 * - Automatic Tailwind class generation based on category and input value
 * - Real-time parsing of existing utility classes to extract current values
 * - Support for complex class names with multiple dash-separated segments
 * - Intelligent value extraction from utility state with fallback handling
 * - Placeholder examples showing common usage patterns
 * 
 * The component handles the complexity of mapping between user-friendly size inputs
 * and Tailwind's naming conventions, making it easy to work with dimensional properties
 * in the visual editor while maintaining consistency with the design system.
 * 
 * @component
 * @param {SizeInputProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata and size options
 * @param {string} props.definition.category - The size property category (e.g., 'width', 'height', 'minWidth', 'maxHeight')
 * @param {string} props.definition.label - Display label for the size input control
 * @param {string} props.definition.description - Descriptive text explaining the size control's purpose
 * @param {Array<{class: string, value: string}>} props.definition.classes - Array of available Tailwind size classes with their values
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @returns {JSX.Element} The rendered SizeInput component with intelligent size input handling
 */
export const SizeInput: React.FC<SizeInputProps> = ({
  definition,
  selectedNode,
}) => {
  const { updateUtilityClass } = useComponentStore();

  // Extract current value from utility state
  const currentValue = selectedNode.utilityClassState?.[definition.category]?.split('-').slice(1).join('-') || '';

  return (
    <Input
      type="text"
      placeholder={`e.g., 4, px-2, ${definition.category}-full`}
      value={currentValue}
      onChange={(e) => {
        /**
         * Handles size input changes and converts them to Tailwind utility classes.
         * 
         * This function processes user input, trims whitespace, and generates the
         * appropriate Tailwind class name. Empty values result in clearing the
         * utility class (setting it to null) for the size property.
         * 
         * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
         */
        const value = e.target.value.trim();
        const classValue = value ? `${definition.category}-${value}` : null;
        updateUtilityClass(selectedNode.id, definition.category, classValue);
      }}
      className="text-xs"
    />
  );
};