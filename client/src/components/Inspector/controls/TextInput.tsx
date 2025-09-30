import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface TextInputProps {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  arbitraryValue: string | null;
  onChange: (value: string | null) => void;
  onArbitraryChange: (arbitraryValue: string | null) => void;
  supportsArbitrary: boolean;
  placeholder?: string;
}

/**
 * TextInput component for flexible text value input with preset and arbitrary value support.
 *
 * This component provides a straightforward text input interface for text-based CSS properties.
 * It supports both preset options and arbitrary values.
 *
 * Key features:
 * - Text input with preset and arbitrary value support
 * - Automatic synchronization with current values
 * - Placeholder guidance for user input
 *
 * @component
 * @param {TextInputProps} props - Component props
 * @param {Array<{value: string, label: string}>} props.options - Array of preset options
 * @param {string | null} props.value - Currently selected preset value
 * @param {string | null} props.arbitraryValue - Current arbitrary value
 * @param {(value: string | null) => void} props.onChange - Callback for preset selection
 * @param {(arbitraryValue: string | null) => void} props.onArbitraryChange - Callback for arbitrary value
 * @param {boolean} props.supportsArbitrary - Whether arbitrary values are supported
 * @param {string} props.placeholder - Placeholder text for input
 * @returns {JSX.Element} The rendered TextInput component
 */
export const TextInput: React.FC<TextInputProps> = ({
  options,
  value,
  arbitraryValue,
  onChange,
  onArbitraryChange,
  supportsArbitrary,
  placeholder = "Enter value..."
}) => {
  const [inputValue, setInputValue] = useState<string>('');

  // Parse current value
  useEffect(() => {
    if (arbitraryValue !== null) {
      setInputValue(arbitraryValue);
    } else if (value) {
      // Extract text part from class like 'font-family-arial' -> 'arial'
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
      onArbitraryChange(newValue.trim() || null);
    } else {
      // For non-arbitrary, try to find matching preset or set custom
      const trimmed = newValue.trim();
      const preset = options.find(opt => opt.value.includes(trimmed));
      if (preset) {
        onChange(preset.value);
      } else if (trimmed) {
        // Create a class if no preset matches
        onChange(trimmed);
      } else {
        onChange(null);
      }
    }
  };

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={inputValue}
      onChange={(e) => handleInputChange(e.target.value)}
      className="text-xs"
    />
  );
};