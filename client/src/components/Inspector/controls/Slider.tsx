import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateClassProperty } from '@/lib/tailwindParser';

interface SliderProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string }>;
  };
  currentClassName: string;
  onClassChange: (newClassName: string) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * Slider component for selecting numeric values with visual slider and numeric input
 * Supports special handling for opacity values and custom units with comprehensive controls
 * @param {SliderProps} props - Component props
 * @param {Object} props.definition - Definition object containing category, label, description, and classes
 * @param {string} props.definition.category - The slider category (opacity, width, etc.)
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Description text for the control
 * @param {Array} props.definition.classes - Array of available classes
 * @param {string} props.currentClassName - Current className string to parse current value from
 * @param {Function} props.onClassChange - Callback function called when slider value changes
 * @param {number} [props.min=0] - Minimum slider value
 * @param {number} [props.max=100] - Maximum slider value
 * @param {number} [props.step=1] - Step increment for slider
 * @param {string} [props.unit=''] - Unit string to display (px, %, etc.)
 * @returns {JSX.Element} The Slider component
 */
export const Slider: React.FC<SliderProps> = ({
  definition,
  currentClassName,
  onClassChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
}) => {
  const [value, setValue] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');

  // Parse current value from className
  useEffect(() => {
    const parseValue = () => {
      const classes = currentClassName.split(' ').filter(Boolean);

      // Look for the property class
      const propertyClass = classes.find(cls => cls.startsWith(`${definition.category}-`));

      if (propertyClass) {
        const classValue = propertyClass.split('-')[1];
        // Handle special cases like opacity-50 (50 = 0.5)
        if (definition.category === 'opacity') {
          const numericValue = parseInt(classValue) / 100;
          setValue(numericValue);
          setInputValue(numericValue.toString());
        } else {
          const numericValue = parseFloat(classValue);
          setValue(numericValue);
          setInputValue(classValue);
        }
      } else {
        setValue(0);
        setInputValue('');
      }
    };

    parseValue();
  }, [currentClassName, definition.category]);

  const handleSliderChange = (newValue: number) => {
    setValue(newValue);
    setInputValue(newValue.toString());

    // Generate className
    let className = '';
    if (newValue > 0) {
      if (definition.category === 'opacity') {
        // Convert to percentage for opacity (0.5 -> 50)
        const percentage = Math.round(newValue * 100);
        className = `opacity-${percentage}`;
      } else {
        className = `${definition.category}-${newValue}`;
      }
    }

    // Use updateClassProperty to get the full updated className
    const newClassName = updateClassProperty(currentClassName, definition.category, className);
    onClassChange(newClassName);
  };

  const handleInputChange = (newInputValue: string) => {
    setInputValue(newInputValue);
    const numericValue = parseFloat(newInputValue);

    if (!isNaN(numericValue) && numericValue >= min && numericValue <= max) {
      setValue(numericValue);
      handleSliderChange(numericValue);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">{definition.label}</Label>

      <div className="space-y-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className="text-xs w-20"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{definition.description}</p>

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