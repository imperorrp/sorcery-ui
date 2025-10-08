import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const extractKeyword = (value: string): string => {
  if (!value) return '';
  const colonIndex = value.lastIndexOf(':');
  const base = colonIndex >= 0 ? value.slice(colonIndex + 1) : value;
  const arbitraryMatch = base.match(/\[(.+)\]/);
  if (arbitraryMatch) return arbitraryMatch[1];
  const dashIndex = base.indexOf('-');
  if (dashIndex === -1) return base;
  return base.slice(dashIndex + 1);
};

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
  placeholder = "Custom value..."
}) => {
  const [customValue, setCustomValue] = useState(arbitraryValue || '');

  useEffect(() => {
    setCustomValue(arbitraryValue || '');
  }, [arbitraryValue]);

  const keywordOptions = useMemo(
    () =>
      options.map((option) => ({
        ...option,
        keyword: extractKeyword(option.value),
      })),
    [options]
  );

  const allOptions = keywordOptions;

  const handlePresetClick = (optionValue: string) => {
    // Clear any arbitrary value first to avoid race where clearing overwrites the preset
    onArbitraryChange?.(null);
    onChange(optionValue);
    setCustomValue('');
  };

  const handleClearSelection = () => {
    onChange(null);
    onArbitraryChange?.(null);
    setCustomValue('');
  };

  const handleArbitrarySubmit = () => {
    if (customValue.trim() && onArbitraryChange) {
      const trimmed = customValue.trim();
      onChange(null);
      onArbitraryChange(trimmed);
      setCustomValue(trimmed);
    }
  };

  return (
    <div className="space-y-2">
      {/* All Options */}
      <div className="flex items-center gap-1 flex-wrap">
        {allOptions.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            className="text-xs px-2 py-1 h-auto"
            onClick={() => handlePresetClick(option.value)}
            title={option.label !== option.keyword ? option.label : undefined}
          >
                              <span className="font-mono">{option.label}</span>
          </Button>
        ))}

        {/* Clear/None Button */}
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1 h-auto text-muted-foreground hover:text-foreground"
            onClick={handleClearSelection}
          >
            ✕
          </Button>
        )}
      </div>

      {/* Arbitrary Value Input */}
      {supportsArbitrary && onArbitraryChange && (
        <div className="flex gap-2">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder={placeholder}
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