import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SelectControlProps {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  onChange: (value: string | null) => void;
  arbitraryValue?: string | null;
  onArbitraryChange?: (value: string | null) => void;
  supportsArbitrary?: boolean;
  placeholder?: string;
}

/**
 * SelectControl component for dropdown selection of Tailwind utility classes.
 *
 * This component provides an elegant dropdown interface for selecting from predefined
 * sets of Tailwind CSS utility classes. It integrates seamlessly with the component store's
 * utility state system and provides clear visual feedback for the current selection.
 *
 * Key features:
 * - Dropdown menu interface with proper z-indexing for overlay management
 * - Automatic current selection detection and display
 * - "None" option for clearing selections and removing utility classes
 * - Support for arbitrary values when supportsArbitrary is true
 * - Consistent UI with shadcn/ui DropdownMenu components
 *
 * The component handles the complexity of option management and state synchronization
 * while providing an intuitive, accessible interface for categorical property selection
 * in the visual editor.
 *
 * @component
 * @param {SelectControlProps} props - Component props
 * @param {Array<{value: string, label: string}>} props.options - Array of available options
 * @param {string | null} props.value - Currently selected value
 * @param {(value: string | null) => void} props.onChange - Callback when selection changes
 * @param {string | null} props.arbitraryValue - Current arbitrary value
 * @param {(value: string | null) => void} props.onArbitraryChange - Callback for arbitrary value changes
 * @param {boolean} props.supportsArbitrary - Whether arbitrary values are supported
 * @param {string} props.placeholder - Placeholder text when no value is selected
 * @returns {JSX.Element} The rendered SelectControl component with dropdown selection interface
 */
export const SelectControl: React.FC<SelectControlProps> = ({
  options,
  value,
  onChange,
  arbitraryValue,
  onArbitraryChange,
  supportsArbitrary = false,
  placeholder = 'Select option'
}) => {
  const [customValue, setCustomValue] = useState(arbitraryValue || '');

  const currentOption = options.find((opt) => opt.value === value);

  const handleArbitrarySubmit = () => {
    if (customValue.trim() && onArbitraryChange) {
      onArbitraryChange(customValue.trim());
    }
  };

  return (
    <div className="space-y-2">
      {/* Preset Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            {currentOption?.label || currentOption?.value || placeholder}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 z-[100]">
          <DropdownMenuItem onClick={() => onChange(null)}>
            None
          </DropdownMenuItem>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
            >
              {option.label || option.value}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Arbitrary Value Input */}
      {supportsArbitrary && onArbitraryChange && (
        <div className="flex gap-2">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Custom value..."
            className="text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleArbitrarySubmit();
            }}
          />
          <Button onClick={handleArbitrarySubmit} size="sm" className="px-3">
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};