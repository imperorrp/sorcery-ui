import React from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

/**
 * SizeInput Component - An input control for size values with unit selection
 *
 * Allows input of numeric values with optional unit selection (px, rem, em, etc.).
 * Used in definition-driven controls for size-related properties like width, height, padding, etc.
 *
 * @param value - The current size value (e.g., '16px', '1rem')
 * @param onValueChange - Callback function called when value changes
 * @param label - Label text for the control
 * @param placeholder - Placeholder text for the input
 * @param className - Additional CSS classes for styling
 * @returns The rendered SizeInput component
 */
interface SizeInputProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const SizeInput: React.FC<SizeInputProps> = ({
  value = '',
  onValueChange,
  label,
  placeholder = 'Enter size...',
  className,
}) => {
  const units = ['px', 'rem', 'em', '%', 'vh', 'vw'];

  /**
   * Handles input value changes
   *
   * @param inputValue - The new input value
   */
  const handleValueChange = (inputValue: string) => {
    // If the value ends with a unit, keep it as is
    // Otherwise, assume px if it's a number
    if (inputValue && /^\d+$/.test(inputValue)) {
      onValueChange(`${inputValue}px`);
    } else {
      onValueChange(inputValue);
    }
  };

  /**
   * Handles unit selection changes
   *
   * @param unit - The selected unit
   */
  const handleUnitChange = (unit: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    onValueChange(`${numericValue}${unit}`);
  };

  const numericValue = value.replace(/[^\d.]/g, '');
  const currentUnit = value.replace(/[\d.]/g, '') || 'px';

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        <Input
          type="number"
          value={numericValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <select
          value={currentUnit}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {units.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};