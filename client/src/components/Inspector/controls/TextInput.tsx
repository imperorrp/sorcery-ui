import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TextInputProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes?: Array<{ class: string; value: string }>;
  };
  currentClassName: string;
  onChange: (property: string, value: string) => void;
}

/**
 * TextInput component for entering text values that are converted to Tailwind utility classes
 * Provides a simple text input interface for category-specific text-based properties
 * @param {TextInputProps} props - Component props
 * @param {Object} props.definition - Definition object containing category, label, description, and optional classes
 * @param {string} props.definition.category - The text category (fontFamily, content, etc.)
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Description text for the control
 * @param {Array} [props.definition.classes] - Optional array of available classes
 * @param {string} props.currentClassName - Current className string to parse current value from
 * @param {Function} props.onChange - Callback function called when text value changes, receives property and class value
 * @returns {JSX.Element} The TextInput component
 */
export const TextInput: React.FC<TextInputProps> = ({
  definition,
  currentClassName,
  onChange,
}) => {
  // Extract current value from className (simplified)
  const currentValue = currentClassName.split(' ').find(cls =>
    cls.startsWith(definition.category.replace(/([A-Z])/g, '-$1').toLowerCase())
  )?.split('-').slice(1).join('-') || '';

  return (
    <div>
      <Label className="text-xs font-medium mb-1 block">
        {definition.label}
      </Label>
      <Input
        type="text"
        placeholder="Enter value..."
        value={currentValue}
        onChange={(e) => {
          const value = e.target.value.trim();
          const classValue = value ? `${definition.category}-${value}` : '';
          onChange(definition.category, classValue);
        }}
        className="text-xs"
      />
      <p className="text-xs text-muted-foreground mt-1">
        {definition.description}
      </p>
    </div>
  );
};