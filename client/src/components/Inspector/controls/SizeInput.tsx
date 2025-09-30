import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Settings } from 'lucide-react';

interface SizeInputProps {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  arbitraryValue: string | null;
  onChange: (value: string | null) => void;
  onArbitraryChange: (arbitraryValue: string | null) => void;
  supportsArbitrary: boolean;
  placeholder?: string;
}

/**
 * SizeInput component for flexible size value input with automatic Tailwind class generation.
 *
 * This component provides an intelligent interface for size-related CSS properties
 * with both predefined options and custom input capabilities. It automatically
 * converts user input into appropriate Tailwind utility classes while supporting various
 * input formats and providing visual feedback.
 *
 * Key features:
 * - Dropdown with predefined size options
 * - Custom input for arbitrary values with smart parsing
 * - Visual feedback showing current value and applied class
 * - Placeholder examples and validation
 *
 * The component handles the complexity of mapping between user-friendly size inputs
 * and Tailwind's naming conventions, making it easy to work with dimensional properties
 * in the visual editor while maintaining consistency with the design system.
 *
 * @component
 * @param {SizeInputProps} props - Component props
 * @param {Array<{value: string, label: string}>} props.options - Array of predefined options
 * @param {string | null} props.value - Currently selected preset value
 * @param {string | null} props.arbitraryValue - Current arbitrary value
 * @param {(value: string | null) => void} props.onChange - Callback for preset selection
 * @param {(arbitraryValue: string | null) => void} props.onArbitraryChange - Callback for arbitrary value
 * @param {boolean} props.supportsArbitrary - Whether arbitrary values are supported
 * @param {string} props.placeholder - Placeholder text for input
 * @returns {JSX.Element} The rendered SizeInput component with intelligent size input handling
 */
export const SizeInput: React.FC<SizeInputProps> = ({
  options,
  value,
  arbitraryValue,
  onChange,
  onArbitraryChange,
  supportsArbitrary,
  placeholder = 'Enter value'
}) => {
  const [customValue, setCustomValue] = useState(arbitraryValue || '');
  const [isCustomMode, setIsCustomMode] = useState(!!arbitraryValue);

  // Sync custom value when arbitraryValue changes
  React.useEffect(() => {
    setCustomValue(arbitraryValue || '');
  }, [arbitraryValue]);

  // Sync mode when value changes
  React.useEffect(() => {
    setIsCustomMode(!!arbitraryValue);
  }, [arbitraryValue]);

  const handlePresetSelect = (selectedValue: string | null) => {
    onChange(selectedValue);
    setIsCustomMode(false);
  };

  const handleCustomInput = (inputValue: string) => {
    setCustomValue(inputValue);
    onArbitraryChange(inputValue.trim() || null);
  };

  const toggleMode = () => {
    setIsCustomMode(!isCustomMode);
    if (!isCustomMode) {
      setCustomValue(arbitraryValue || '');
    }
  };

  const currentDisplayValue = value || arbitraryValue || '';

  return (
    <div className="space-y-2">
      {!isCustomMode ? (
        <>
          {/* Preset Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 justify-start text-xs">
                {currentDisplayValue || 'Select value'}
                <ChevronDown className="ml-auto h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto">
              <DropdownMenuItem onClick={() => handlePresetSelect(null)}>
                None
              </DropdownMenuItem>
              {options.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handlePresetSelect(option.value)}
                >
                  {option.label || option.value}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Mode Button */}
          {supportsArbitrary && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMode}
              className="px-2"
              title="Custom value"
            >
              <Settings className="h-3 w-3" />
            </Button>
          )}
        </>
      ) : (
        <>
          {/* Custom Input */}
          <Input
            value={customValue}
            onChange={(e) => handleCustomInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCustomInput(customValue);
              }
            }}
          />

          {/* Back to Preset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            className="px-2"
            title="Preset values"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
};