import React from 'react';
import { Label } from './label';
import { cn } from '@/lib/utils';

/**
 * ShadowEditor Component - A control for selecting and customizing box shadows
 *
 * Provides options for different shadow intensities and allows custom shadow values.
 * Used in definition-driven controls for Tailwind shadow utilities.
 *
 * @param value - The currently selected shadow value
 * @param onValueChange - Callback function called when shadow changes
 * @param label - Label text for the control
 * @param className - Additional CSS classes for styling
 * @returns The rendered ShadowEditor component
 */
interface ShadowEditorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const ShadowEditor: React.FC<ShadowEditorProps> = ({
  value = '',
  onValueChange,
  label = 'Shadow',
  className,
}) => {
  const shadowOptions = [
    { value: 'shadow-none', label: 'None' },
    { value: 'shadow-sm', label: 'Small' },
    { value: 'shadow', label: 'Default' },
    { value: 'shadow-md', label: 'Medium' },
    { value: 'shadow-lg', label: 'Large' },
    { value: 'shadow-xl', label: 'Extra Large' },
    { value: 'shadow-2xl', label: '2X Large' },
  ];

  /**
   * Handles shadow selection from the dropdown
   *
   * @param shadowValue - The selected shadow class
   */
  const handleShadowChange = (shadowValue: string) => {
    onValueChange(shadowValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">
        {label}
      </Label>
      <select
        value={value}
        onChange={(e) => handleShadowChange(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Select shadow...</option>
        {shadowOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Preview of the selected shadow */}
      <div className="p-4 bg-background border border-border rounded-md">
        <div className={cn('w-16 h-16 bg-primary rounded-md mx-auto', value)} />
      </div>
    </div>
  );
};