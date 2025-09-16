import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SizeInputProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string }>;
  };
  currentClassName: string;
  onChange: (property: string, value: string) => void;
}

/**
 * SizeInput component for entering size-related values with category-specific formatting
 * Provides a text input for size values that are converted to appropriate Tailwind classes
 * @param {SizeInputProps} props - Component props
 * @param {Object} props.definition - Definition object containing category, label, description, and classes
 * @param {string} props.definition.category - The size category (width, height, etc.)
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Description text for the control
 * @param {Array} props.definition.classes - Array of available size classes
 * @param {string} props.currentClassName - Current className string to parse current value from
 * @param {Function} props.onChange - Callback function called when value changes, receives property and class value
 * @returns {JSX.Element} The SizeInput component
 */
export const SizeInput: React.FC<SizeInputProps> = ({
  definition,
  currentClassName,
  onChange,
}) => {
  // Extract current value from className (simplified - would need proper parsing)
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
        placeholder={`e.g., 4, px-2, ${definition.category}-full`}
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