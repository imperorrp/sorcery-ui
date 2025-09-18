import React, { useMemo } from 'react';
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import datasets from '../../../lib/definitions/datasets.json';

interface SmartColorPickerProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: { "$ref": string } | Array<{ class: string; value: string; label?: string }>;
  };
  selectedNode: SerializableElement;
}

/**
 * SmartColorPicker component for intuitive color selection in the visual editor.
 * 
 * This component provides a sophisticated color selection interface that supports
 * multiple data sources and seamlessly integrates with the component store's utility
 * state system. It handles both predefined color palettes and custom color definitions,
 * offering a unified interface for text colors, background colors, and other color properties.
 * 
 * Key features:
 * - Dynamic color palette loading from datasets.json via $ref references
 * - Support for direct class arrays in definition objects
 * - Automatic color type detection (text vs background) based on category
 * - Real-time utility state synchronization with component store
 * - Hex color value extraction for visual swatch display
 * - Graceful fallback handling for missing or invalid color data
 * 
 * The component transforms color definitions into a consistent format for the
 * ColorSwatchPicker UI component, handling the complexity of different data
 * sources while providing a simple, consistent user experience.
 * 
 * @component
 * @param {SmartColorPickerProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata and color data
 * @param {string} props.definition.category - Color category (e.g., 'text-color', 'background-color', 'border-color')
 * @param {string} props.definition.label - Display label for the color picker control
 * @param {string} props.definition.description - Descriptive text explaining the color control's purpose
 * @param {Object|Array} props.definition.classes - Color data source - either {$ref: string} to datasets.json or direct array of color objects
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @returns {JSX.Element} The rendered SmartColorPicker component with color swatch interface
 */
export const SmartColorPicker: React.FC<SmartColorPickerProps> = ({
  definition,
  selectedNode,
}) => {
  const { updateUtilityClass } = useComponentStore();

  // Resolve colors from $ref or use direct classes array
  const colors = useMemo(() => {
    /**
     * Resolves color options from either a datasets.json reference or direct class array.
     * 
     * This function handles the complexity of different color data sources, transforming
     * them into a consistent format for the ColorSwatchPicker component. It supports
     * both $ref references to external datasets and inline class definitions.
     * 
     * @returns {Array<{name: string, className: string, hex?: string}>} Array of color options with name, className, and optional hex value
     */
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

  // Find current color class from utility state
  const currentClass = useMemo(() => {
    /**
     * Retrieves the currently selected color class from the component's utility state.
     * 
     * This memoized value tracks the active color class for the current category,
     * providing the selected value to the ColorSwatchPicker component for proper
     * visual indication and state management.
     * 
     * @returns {string} The current color class name, or empty string if none selected
     */
    return selectedNode.utilityClassState?.[definition.category] || '';
  }, [selectedNode.utilityClassState, definition.category]);

  /**
   * Handles color selection changes and updates the component's utility state.
   * 
   * This function is called when the user selects a new color from the swatch picker.
   * It updates the component store with the new color class, or clears the color
   * if an empty value is provided (allowing for "no color" state).
   * 
   * @param {string} colorClass - The selected color class name, or empty string to clear
   * @returns {void}
   */
  const handleColorChange = (colorClass: string) => {
    updateUtilityClass(selectedNode.id, definition.category, colorClass || null);
  };

  return (
    <div>
      <ColorSwatchPicker
        value={currentClass}
        onValueChange={handleColorChange}
        colors={colors}
        type={definition.category.includes('text') ? 'text' : 'background'}
      />
    </div>
  );
};