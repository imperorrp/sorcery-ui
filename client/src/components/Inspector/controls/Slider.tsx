import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

interface SliderProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string }>;
  };
  selectedNode: SerializableElement;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  modifierPrefix?: string;
}

/**
 * Slider component for intuitive numeric value selection with dual input methods.
 * 
 * This component provides a sophisticated slider interface with both visual range slider
 * and numeric input field for precise value control. It features special handling for
 * opacity values (converting between 0-1 and percentage formats) and supports custom
 * units, min/max constraints, and step increments for various numeric properties.
 * 
 * Key features:
 * - Dual input methods: visual slider and numeric text input for flexibility
 * - Special opacity handling with automatic percentage conversion (0.5 ↔ 50)
 * - Configurable min/max bounds and step increments for precise control
 * - Custom unit display (px, %, em, rem, etc.) for better UX
 * - Real-time synchronization between slider and input field
 * - Automatic parsing of existing utility classes from component state
 * - Custom styled slider thumb with theme integration
 * - Bidirectional value updates maintaining consistency
 * 
 * The component intelligently handles different numeric formats and provides
 * a seamless experience for adjusting numeric CSS properties in the visual editor,
 * with special accommodations for opacity's unique 0-1 range versus percentage display.
 * 
 * @component
 * @param {SliderProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata
 * @param {string} props.definition.category - The numeric property category (e.g., 'opacity', 'width', 'fontSize')
 * @param {string} props.definition.label - Display label for the slider control
 * @param {string} props.definition.description - Descriptive text explaining the slider's purpose
 * @param {Array<{class: string, value: string}>} props.definition.classes - Array of available Tailwind classes with their values
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @param {number} [props.min=0] - Minimum allowed value for the slider range
 * @param {number} [props.max=100] - Maximum allowed value for the slider range
 * @param {number} [props.step=1] - Step increment for slider movement and input validation
 * @param {string} [props.unit=''] - Unit suffix to display next to the numeric input (e.g., 'px', '%', 'em')
 * @returns {JSX.Element} The rendered Slider component with dual input controls and custom styling
 */
export const Slider: React.FC<SliderProps> = ({
  definition,
  selectedNode,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  modifierPrefix = ''
}) => {
  const { updateUtilityClass } = useComponentStore();
  const [value, setValue] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');

  // Parse current value from utility state
  useEffect(() => {
    /**
     * Parses the current utility class and extracts the numeric value for the slider.
     * 
     * This function analyzes the existing Tailwind utility class from the component's
     * utility state and converts it to the appropriate numeric format for the slider.
     * It handles special cases like opacity values that need conversion between
     * percentage (50) and decimal (0.5) formats.
     * 
     * @returns {void}
     */
    const parseValue = () => {
      const currentClass = selectedNode.utilityClassState?.[definition.category];

      if (currentClass) {
        const classValue = currentClass.split('-')[1];
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
  }, [selectedNode.utilityClassState, definition.category]);

  /**
   * Handles slider value changes and updates the component's utility state.
   * 
   * This function processes slider input, updates both the slider value and input field,
   * and generates the appropriate Tailwind utility class. It handles special opacity
   * conversion from decimal to percentage format and ensures the component store
   * is updated with the new class.
   * 
   * @param {number} newValue - The new numeric value from the slider
   * @returns {void}
   */
  const handleSliderChange = (newValue: number) => {
    setValue(newValue);
    setInputValue(newValue.toString());

    // Generate className
    let className: string | null = null;
    if (newValue > 0) {
      if (definition.category === 'opacity') {
        // Convert to percentage for opacity (0.5 -> 50)
        const percentage = Math.round(newValue * 100);
        className = `opacity-${percentage}`;
      } else {
        className = `${definition.category}-${newValue}`;
      }
      // Apply modifier prefix
      className = modifierPrefix + className;
    }

    updateUtilityClass(selectedNode.id, definition.category, className);
  };

  /**
   * Handles numeric input field changes with validation and synchronization.
   * 
   * This function processes direct numeric input, validates the value against
   * min/max constraints, and synchronizes both the slider and input field.
   * It ensures that only valid numeric values within the allowed range are
   * accepted and propagated to the component store.
   * 
   * @param {string} newInputValue - The new value from the numeric input field
   * @returns {void}
   */
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