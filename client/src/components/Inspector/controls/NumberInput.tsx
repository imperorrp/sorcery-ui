import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface NumberInputProps {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  arbitraryValue: string | null;
  onChange: (value: string | null) => void;
  onArbitraryChange: (arbitraryValue: string | null) => void;
  supportsArbitrary: boolean;
  min?: number;
  max?: number;
}

/**
 * NumberInput component for intuitive numeric value input with preset and arbitrary value support.
 *
 * This component provides a user-friendly numeric input interface that supports both
 * preset options and arbitrary values. It displays the current value and allows
 * users to input custom numeric values when arbitrary values are supported.
 *
 * Key features:
 * - Support for preset options and arbitrary values
 * - Numeric input with min/max validation
 * - Automatic synchronization with current values
 * - Clean, simple interface for numeric properties
 *
 * @component
 * @param {NumberInputProps} props - Component props
 * @param {Array<{value: string, label: string}>} props.options - Array of preset options
 * @param {string | null} props.value - Currently selected preset value
 * @param {string | null} props.arbitraryValue - Current arbitrary value
 * @param {(value: string | null) => void} props.onChange - Callback for preset selection
 * @param {(arbitraryValue: string | null) => void} props.onArbitraryChange - Callback for arbitrary value
 * @param {boolean} props.supportsArbitrary - Whether arbitrary values are supported
 * @param {number} [props.min] - Minimum allowed value
 * @param {number} [props.max] - Maximum allowed value
 * @returns {JSX.Element} The rendered NumberInput component
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  options,
  value,
  arbitraryValue,
  onChange,
  onArbitraryChange,
  supportsArbitrary,
  min,
  max
}) => {
  const [inputValue, setInputValue] = useState<string>('');

  // Parse current value
  useEffect(() => {
    if (arbitraryValue !== null) {
      setInputValue(arbitraryValue);
    } else if (value) {
      // Extract numeric part from class like 'opacity-50' -> '50'
      const parts = value.split('-');
      if (parts.length > 1) {
        setInputValue(parts.slice(1).join('-'));
      }
    } else {
      setInputValue('');
    }
  }, [value, arbitraryValue]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);

    if (supportsArbitrary) {
      onArbitraryChange(newValue || null);
    } else {
      // For non-arbitrary, find closest preset or set to null
      const num = parseFloat(newValue);
      if (!isNaN(num)) {
        const closest = options.reduce((prev, curr) => {
          const prevNum = parseFloat(prev.value.split('-')[1] || '0');
          const currNum = parseFloat(curr.value.split('-')[1] || '0');
          return Math.abs(currNum - num) < Math.abs(prevNum - num) ? curr : prev;
        });
        onChange(closest?.value || null);
      } else {
        onChange(null);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          className="text-xs w-20"
          min={min}
          max={max}
        />
        <span className="text-xs text-muted-foreground">
          Current: {inputValue || 'none'}
        </span>
      </div>
    </div>
  );
};