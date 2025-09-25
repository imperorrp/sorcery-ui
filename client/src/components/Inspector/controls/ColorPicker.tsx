import React, { useMemo, useState } from 'react';
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import datasets from '../../../lib/definitions/datasets.json';

interface SmartColorPickerProps {
  definition: {
    category: string;
    label: string;
    description: string;
    strategies: Array<{
      type: 'list' | 'generative' | 'arbitrary';
      classes?: Array<{ class: string; value?: string; label?: string }>;
      generative?: {
        template: string;
        dataset: string;
      };
      arbitrary?: {
        template: string;
      };
    }>;
  };
  selectedNode: SerializableElement;
  modifierPrefix?: string;
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
  modifierPrefix = ''
}) => {
  const { updateUtilityClass } = useComponentStore();
  const [customValue, setCustomValue] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Resolve colors from strategies
  const colors = useMemo(() => {
    /**
     * Resolves color options from strategies array.
     * 
     * This function processes the strategies array to extract color options,
     * supporting both list and generative strategies for comprehensive color palettes.
     * 
     * @returns {Array<{name: string, className: string, hex?: string}>} Array of color options
     */
    const allColors: Array<{name: string, className: string, hex?: string}> = [];

    for (const strategy of definition.strategies) {
      if (strategy.type === 'list' && strategy.classes) {
        // Add list strategy colors
        const listColors = strategy.classes.map(item => ({
          name: item.label || item.class,
          className: item.class,
          hex: item.value && item.value.startsWith('#') ? item.value : undefined
        }));
        allColors.push(...listColors);
      } else if (strategy.type === 'generative' && strategy.generative) {
        // Add generative strategy colors from dataset
        const dataset = datasets[strategy.generative.dataset as keyof typeof datasets];
        if (Array.isArray(dataset)) {
          const generatedColors = dataset.map((item: { class: string; value?: string; label?: string }) => {
            // Apply the template to create the final class name
            const finalClassName = strategy.generative!.template.replace('{value}', item.class);
            
            return {
              name: item.label || item.class,
              className: finalClassName,
              hex: item.value && item.value.startsWith('#') ? item.value : undefined
            };
          });
          allColors.push(...generatedColors);
        }
      }
      // Skip arbitrary strategies for color swatches
    }

    return allColors;
  }, [definition.strategies]);

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
    const finalClass = colorClass ? modifierPrefix + colorClass : null;
    updateUtilityClass(selectedNode.id, definition.category, finalClass);
  };

  /**
   * Handles custom color input and applies arbitrary color value.
   */
  const handleCustomColor = () => {
    if (customValue.trim()) {
      const val = customValue.trim();
      // Prefer arbitrary strategy template when present
      const arbitraryStrategy = definition.strategies.find(
        (s): s is { type: 'arbitrary'; arbitrary: { template: string } } => s.type === 'arbitrary' && !!s.arbitrary
      );
      const generativeStrategy = definition.strategies.find(
        (s): s is { type: 'generative'; generative: { template: string; dataset: string } } =>
          s.type === 'generative' && !!s.generative
      );

      let baseClass: string;
      if (arbitraryStrategy) {
        baseClass = arbitraryStrategy.arbitrary.template.replace('{value}', `[${val}]`);
      } else if (generativeStrategy) {
        baseClass = generativeStrategy.generative.template.replace('{value}', val);
      } else {
        // Fallback based on common category naming
        const cat = definition.category.toLowerCase();
        if (cat.includes('text')) baseClass = `text-[${val}]`;
        else if (cat.includes('background')) baseClass = `bg-[${val}]`;
        else if (cat.includes('border')) baseClass = `border-[${val}]`;
        else if (cat.includes('outline')) baseClass = `outline-[${val}]`;
        else if (cat.includes('caret')) baseClass = `caret-[${val}]`;
        else baseClass = `[color:${val}]`;
      }

      const finalClass = modifierPrefix + baseClass;
      updateUtilityClass(selectedNode.id, definition.category, finalClass);
      setIsCustomOpen(false);
      setCustomValue('');
    }
  };

  return (
    <div className="space-y-2">
      <ColorSwatchPicker
        value={currentClass}
        onValueChange={handleColorChange}
        colors={colors}
        previewKind={
          definition.category.includes('text')
            ? 'text'
            : definition.category.includes('outline')
            ? 'outline'
            : definition.category.includes('caret')
            ? 'caret'
            : definition.category.includes('border')
            ? 'border'
            : 'background'
        }
      />
      
      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full text-xs">
            Custom...
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Color</label>
            <Input
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="#ff0000, rgb(255,0,0), etc."
              className="text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomColor();
              }}
            />
            <Button onClick={handleCustomColor} size="sm" className="w-full">
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};