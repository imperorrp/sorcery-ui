import React from 'react';
import { Input } from '@/components/ui/input';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

interface NumberInputProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes?: Array<{ class: string; value: string }>;
  };
  selectedNode: SerializableElement;
  min?: number;
  max?: number;
  modifierPrefix?: string;
}

/**
 * NumberInput component for intuitive numeric value input with Tailwind utility class generation.
 * 
 * This component provides a user-friendly numeric input interface that automatically
 * converts user-entered values into appropriate Tailwind CSS utility classes. It handles
 * the complexity of parsing existing classes from component state and generating new
 * classes based on user input, supporting various numeric properties like opacity,
 * font sizes, spacing values, and other numeric Tailwind utilities.
 * 
 * Key features:
 * - Automatic parsing of existing utility classes to extract current numeric values
 * - Real-time conversion of numeric input to Tailwind class format (e.g., "50" → "opacity-50")
 * - Optional min/max value constraints for input validation
 * - Integration with component store for seamless state management
 * - Visual feedback showing current parsed value
 * - Support for complex class names with multiple dash-separated segments
 * 
 * The component intelligently handles the mapping between user-friendly numeric inputs
 * and Tailwind's naming conventions, making it easy to work with numeric properties
 * in the visual editor while maintaining consistency with the design system.
 * 
 * @component
 * @param {NumberInputProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata
 * @param {string} props.definition.category - The numeric property category (e.g., 'opacity', 'fontSize', 'leading')
 * @param {string} props.definition.label - Display label for the numeric input control
 * @param {string} props.definition.description - Descriptive text explaining the numeric control's purpose
 * @param {Array<{class: string, value: string}>} [props.definition.classes] - Optional predefined class options
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @param {number} [props.min] - Minimum allowed numeric value for input validation
 * @param {number} [props.max] - Maximum allowed numeric value for input validation
 * @returns {JSX.Element} The rendered NumberInput component with numeric input and current value display
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  definition,
  selectedNode,
  min,
  max,
  modifierPrefix = '',
}) => {
  const { updateUtilityClass } = useComponentStore();

  // Extract current numeric value from utility state
  const currentValue = selectedNode.utilityClassState?.[definition.category]?.split('-').slice(1).join('-') || '';
  const numericValue = parseInt(currentValue) || 0;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={numericValue}
          onChange={(e) => {
            /**
             * Handles numeric input changes and converts them to Tailwind utility classes.
             * 
             * This function processes user input, validates it against min/max constraints,
             * and generates the appropriate Tailwind class name. Empty values result in
             * clearing the utility class (setting it to null).
             * 
             * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
             */
            const value = e.target.value;
            const classValue = value ? `${definition.category}-${value}` : null;
            
            // Apply modifier prefix if present
            const finalClass = classValue && modifierPrefix ? `${modifierPrefix}${classValue}` : classValue;
            
            updateUtilityClass(selectedNode.id, definition.category, finalClass);
          }}
          className="text-xs w-20"
          min={min}
          max={max}
        />
        <span className="text-xs text-muted-foreground">
          Current: {numericValue}
        </span>
      </div>
    </div>
  );
};