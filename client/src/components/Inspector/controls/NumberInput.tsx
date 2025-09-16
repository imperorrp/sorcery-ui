import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumberInputProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes?: Array<{ class: string; value: string }>;
  };
  currentClassName: string;
  onChange: (property: string, value: string) => void;
  min?: number;
  max?: number;
}

/**
 * NumberInput component for entering numeric values with optional min/max constraints
 * Converts numeric input to appropriate Tailwind utility classes based on category
 * @param {NumberInputProps} props - Component props
 * @param {Object} props.definition - Definition object containing category, label, description, and optional classes
 * @param {string} props.definition.category - The numeric category (opacity, fontSize, etc.)
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Description text for the control
 * @param {Array} [props.definition.classes] - Optional array of available classes
 * @param {string} props.currentClassName - Current className string to parse current value from
 * @param {Function} props.onChange - Callback function called when value changes, receives property and class value
 * @param {number} [props.min] - Minimum allowed value
 * @param {number} [props.max] - Maximum allowed value
 * @returns {JSX.Element} The NumberInput component
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  definition,
  currentClassName,
  onChange,
  min,
  max,
}) => {
  // Extract current numeric value from className
  const currentValue = currentClassName.split(' ').find(cls =>
    cls.startsWith(definition.category.replace(/([A-Z])/g, '-$1').toLowerCase())
  )?.split('-').slice(1).join('-') || '';

  const numericValue = parseInt(currentValue) || 0;

  return (
    <div>
      <Label className="text-xs font-medium mb-1 block">
        {definition.label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={numericValue}
          onChange={(e) => {
            const value = e.target.value;
            const classValue = value ? `${definition.category}-${value}` : '';
            onChange(definition.category, classValue);
          }}
          className="text-xs w-20"
          min={min}
          max={max}
        />
        <span className="text-xs text-muted-foreground">
          Current: {numericValue}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {definition.description}
      </p>
    </div>
  );
};