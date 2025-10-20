import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * SegmentedControl Component - A horizontal control for selecting between multiple options
 *
 * Displays a row of buttons where only one can be selected at a time.
 * Commonly used for switching between different modes or views.
 *
 * @param value - The currently selected option value
 * @param onValueChange - Callback function called when an option is selected
 * @param options - Array of options to display
 * @param className - Additional CSS classes for styling
 * @param size - Size variant of the buttons ('sm', 'default', 'lg')
 * @returns The rendered SegmentedControl component
 */
interface SegmentedControlOption {
  value: string;
  label?: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SegmentedControlOption[];
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  optionStyles?: React.CSSProperties[];
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  value,
  onValueChange,
  options,
  className,
  size = 'sm',
  optionStyles,
}) => {
  return (
    <div className={cn("flex rounded-md border border-border bg-background p-1", className)}>
      {options.map((option, index) => (
        <Button
          key={option.value}
          variant="ghost"
          size={size}
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-xs font-medium transition-all",
            "border border-transparent hover:border-border/70",
            "hover:bg-muted/70 hover:text-foreground",
            value === option.value && "bg-primary text-primary-foreground shadow-sm border-primary",
            index === 0 && "rounded-l-md",
            index === options.length - 1 && "rounded-r-md",
            index > 0 && index < options.length - 1 && "rounded-none border-x-0"
          )}
          style={optionStyles?.[index]}
          onClick={() => onValueChange(option.value)}
        >
          <div className="flex items-center gap-1.5">
            {option.icon}
            {option.label && <span>{option.label}</span>}
          </div>
        </Button>
      ))}
    </div>
  );
};