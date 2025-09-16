import React from 'react';
import { Label } from './label';
import { cn } from '@/lib/utils';

/**
 * SelectControl Component - A dropdown select control for choosing from predefined options
 *
 * Provides a styled select dropdown with label and value display.
 * Used in definition-driven controls for properties with multiple predefined values.
 *
 * @param value - The currently selected value
 * @param onValueChange - Callback function called when selection changes
 * @param options - Array of options to display in the dropdown
 * @param placeholder - Placeholder text when no value is selected
 * @param label - Label text for the control
 * @param className - Additional CSS classes for styling
 * @returns The rendered SelectControl component
 */
interface SelectControlOption {
  value: string;
  label: string;
}

interface SelectControlProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectControlOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export const SelectControl: React.FC<SelectControlProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  label,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
        </Label>
      )}
      <select
        value={value || ''}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};