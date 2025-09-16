import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker';
import { updateClassProperty } from '@/lib/tailwindParser';
import datasets from '../../../lib/definitions/datasets.json';

interface SmartColorPickerProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: { "$ref": string } | Array<{ class: string; value: string; label?: string }>;
  };
  currentClassName: string;
  onClassChange: (newClassName: string) => void;
}

/**
 * SmartColorPicker component for selecting colors from predefined palettes or custom definitions
 * Supports both direct class arrays and references to datasets.json for color options
 * @param {SmartColorPickerProps} props - Component props
 * @param {Object} props.definition - Definition object containing category, label, description, and classes
 * @param {string} props.definition.category - The category (text-color, background-color, etc.)
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Description text for the control
 * @param {Object|Array} props.definition.classes - Either a $ref to datasets.json or direct array of color classes
 * @param {string} props.currentClassName - Current className string to parse current color from
 * @param {Function} props.onClassChange - Callback function called when color selection changes
 * @returns {JSX.Element} The SmartColorPicker component
 */
export const SmartColorPicker: React.FC<SmartColorPickerProps> = ({
  definition,
  currentClassName,
  onClassChange,
}) => {
  // Resolve colors from $ref or use direct classes array
  const colors = useMemo(() => {
    if ('$ref' in definition.classes) {
      // Load from datasets.json and transform to ColorOption format
      const dataset = datasets[definition.classes.$ref as keyof typeof datasets];
      if (Array.isArray(dataset)) {
        return dataset.map(item => ({
          name: item.label || item.class,
          className: item.class,
          hex: item.value.startsWith('#') ? item.value : undefined
        }));
      }
      return [];
    } else {
      // Use direct classes array and transform to ColorOption format
      return definition.classes.map(item => ({
        name: item.label || item.class,
        className: item.class,
        hex: item.value.startsWith('#') ? item.value : undefined
      }));
    }
  }, [definition.classes]);

  // Find current color class
  const currentClass = useMemo(() => {
    return currentClassName.split(' ').find(cls =>
      colors.some(color => color.className === cls)
    ) || '';
  }, [currentClassName, colors]);

  const handleColorChange = (colorClass: string) => {
    const newClassName = updateClassProperty(currentClassName, definition.category, colorClass);
    onClassChange(newClassName);
  };

  return (
    <div>
      <Label className="text-xs font-medium mb-2 block">
        {definition.label}
      </Label>
      <ColorSwatchPicker
        value={currentClass}
        onValueChange={handleColorChange}
        colors={colors}
        type={definition.category.includes('text') ? 'text' : 'background'}
      />
      <p className="text-xs text-muted-foreground mt-1">
        {definition.description}
      </p>
    </div>
  );
};