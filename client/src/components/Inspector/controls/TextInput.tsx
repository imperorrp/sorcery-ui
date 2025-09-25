import React from 'react';
import { Input } from '@/components/ui/input';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

interface TextInputProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes?: Array<{ class: string; value: string }>;
  };
  selectedNode: SerializableElement;
  modifierPrefix?: string;
  isArbitrary?: boolean;
}

/**
 * TextInput component for flexible text value input with automatic Tailwind class generation.
 * 
 * This component provides a straightforward text input interface for text-based CSS properties
 * that require custom values rather than predefined options. It automatically converts user
 * input into appropriate Tailwind utility classes while supporting various text formats
 * for properties like font families, content values, custom spacing, and other text-based
 * CSS attributes.
 * 
 * Key features:
 * - Flexible text input supporting custom values and complex strings
 * - Automatic Tailwind class generation based on category and input value
 * - Real-time parsing of existing utility classes to extract current values
 * - Support for complex class names with multiple dash-separated segments
 * - Intelligent value extraction from utility state with fallback handling
 * - Trimmed input processing to handle whitespace gracefully
 * - Placeholder guidance for user input expectations
 * 
 * The component handles the complexity of mapping between user-friendly text inputs
 * and Tailwind's naming conventions, making it easy to work with text-based properties
 * in the visual editor while maintaining consistency with the design system.
 * 
 * @component
 * @param {TextInputProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata
 * @param {string} props.definition.category - The text property category (e.g., 'fontFamily', 'content', 'spacing')
 * @param {string} props.definition.label - Display label for the text input control
 * @param {string} props.definition.description - Descriptive text explaining the text control's purpose
 * @param {Array<{class: string, value: string}>} [props.definition.classes] - Optional array of suggested text classes
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @returns {JSX.Element} The rendered TextInput component with intelligent text input handling
 */
export const TextInput: React.FC<TextInputProps> = ({
  definition,
  selectedNode,
  modifierPrefix = '',
  isArbitrary = false,
}) => {
  const { updateUtilityClass } = useComponentStore();

  // Extract current value from utility state
  const currentValue = selectedNode.utilityClassState?.[definition.category];
  let displayValue = '';

  if (currentValue) {
    if (isArbitrary) {
      // For arbitrary values, extract the value from [brackets]
      const match = currentValue.match(/\[([^\]]+)\]$/);
      displayValue = match ? match[1] : '';
    } else {
      // For regular values, extract after the first dash
      displayValue = currentValue.split('-').slice(1).join('-');
    }
  }

  return (
    <Input
      type="text"
      placeholder={isArbitrary ? "Enter custom value..." : "Enter value..."}
      value={displayValue}
      onChange={(e) => {
        /**
         * Handles text input changes and converts them to Tailwind utility classes.
         * 
         * This function processes user input, trims whitespace, and generates the
         * appropriate Tailwind class name. Empty values result in clearing the
         * utility class (setting it to null) for the text property.
         * 
         * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
         */
        const value = e.target.value.trim();
        let classValue = null;

        if (value) {
          if (isArbitrary) {
            // For arbitrary values, wrap in square brackets
            classValue = `${definition.category}-[${value}]`;
          } else {
            // For regular values, use dash separator
            classValue = `${definition.category}-${value}`;
          }
        }
        
        // Apply modifier prefix if present
        const finalClass = classValue && modifierPrefix ? `${modifierPrefix}${classValue}` : classValue;
        
        updateUtilityClass(selectedNode.id, definition.category, finalClass);
      }}
      className="text-xs"
    />
  );
};