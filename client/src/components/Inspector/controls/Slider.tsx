import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import suggestions from '@/lib/definitions/suggestions.json';

interface SliderProps {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  arbitraryValue: string | null;
  onChange: (value: string | null) => void;
  onArbitraryChange: (arbitraryValue: string | null) => void;
  supportsArbitrary: boolean;
  suggestionsSource?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * Slider component for intuitive numeric value selection with dual input methods.
 *
 * This component provides a sophisticated slider interface with both visual range slider
 * and numeric input field for precise value control. It supports arbitrary values
 * and preset options, with special handling for opacity values.
 *
 * Key features:
 * - Dual input methods: visual slider and numeric text input for flexibility
 * - Support for arbitrary values when supportsArbitrary is true
 * - Preset options dropdown for discrete values
 * - Special opacity handling with automatic percentage conversion
 * - Configurable min/max bounds and step increments
 * - Custom unit display
 *
 * @component
 * @param {SliderProps} props - Component props
 * @param {Array<{value: string, label: string}>} props.options - Array of preset options
 * @param {string | null} props.value - Currently selected preset value
 * @param {string | null} props.arbitraryValue - Current arbitrary value
 * @param {(value: string | null) => void} props.onChange - Callback for preset selection
 * @param {(arbitraryValue: string | null) => void} props.onArbitraryChange - Callback for arbitrary value
 * @param {boolean} props.supportsArbitrary - Whether arbitrary values are supported
 * @param {number} [props.min=0] - Minimum allowed value
 * @param {number} [props.max=100] - Maximum allowed value
 * @param {number} [props.step=1] - Step increment
 * @param {string} [props.unit=''] - Unit suffix
 * @returns {JSX.Element} The rendered Slider component
 */
export const Slider: React.FC<SliderProps> = ({
  options,
  value,
  arbitraryValue,
  onChange,
  onArbitraryChange,
  supportsArbitrary,
  suggestionsSource,
  min = 0,
  max = 100,
  step = 1,
  unit = ''
}) => {
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');

  // Get slider configuration from suggestions or legacy props
  const getSliderConfig = () => {
    if (suggestionsSource) {
      const suggestionArray = (suggestions as Record<string, string[]>)[suggestionsSource];
      if (suggestionArray && suggestionArray.length > 0) {
        // Strict numeric detection (avoid treating fractions like '3/2' as numeric)
        const numericRegex = /^-?\d+(?:\.\d+)?$/;
        const numericStrings = suggestionArray.filter(s => numericRegex.test(String(s)));
        const numericValues = numericStrings.map(s => Number(s)).sort((a, b) => a - b);

        if (numericValues.length > 0) {
          const min = numericValues[0];
          const max = numericValues[numericValues.length - 1];
          // Calculate step based on the smallest difference between values
          const differences = numericValues.slice(1).map((val, i) => val - numericValues[i]);
          const step = differences.length > 0 ? Math.min(...differences) : 1;

          return { min, max, step };
        }
      }
    }
    // Fallback to legacy props or defaults
    return { min, max, step };
  };

  const config = getSliderConfig();

  // Parse current value
  useEffect(() => {
    if (arbitraryValue !== null) {
      const num = parseFloat(arbitraryValue);
      if (!isNaN(num)) {
        setSliderValue(num);
        setInputValue(num.toString());
      }
    } else if (value) {
      // Parse from preset class, e.g., opacity-50 -> 50 or 0.5
      const parts = value.split('-');
      if (parts.length > 1) {
        const num = parseFloat(parts[1]);
        if (!isNaN(num)) {
          // For opacity, convert percentage to decimal
          const finalValue = value.startsWith('opacity-') ? num / 100 : num;
          setSliderValue(finalValue);
          setInputValue(finalValue.toString());
        }
      }
    } else {
      setSliderValue(0);
      setInputValue('');
    }
  }, [value, arbitraryValue]);

  const handleSliderChange = (newValue: number) => {
    setSliderValue(newValue);
    setInputValue(newValue.toString());

    if (supportsArbitrary) {
      onArbitraryChange(newValue.toString());
    } else {
      // Find closest preset
      const closest = options.reduce((prev, curr) => {
        const prevNum = parseFloat(prev.value.split('-')[1] || '0');
        const currNum = parseFloat(curr.value.split('-')[1] || '0');
        return Math.abs(currNum - newValue) < Math.abs(prevNum - newValue) ? curr : prev;
      });
      onChange(closest?.value || null);
    }
  };

  const handleInputChange = (newInputValue: string) => {
    setInputValue(newInputValue);
    const numericValue = parseFloat(newInputValue);

    if (!isNaN(numericValue) && numericValue >= config.min && numericValue <= config.max) {
      setSliderValue(numericValue);
      handleSliderChange(numericValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={sliderValue}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={config.min}
            max={config.max}
            step={config.step}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className="text-xs w-20"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};