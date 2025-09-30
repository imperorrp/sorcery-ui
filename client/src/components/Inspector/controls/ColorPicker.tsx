import React, { useState } from 'react';
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColorPickerProps {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  onChange: (value: string | null) => void;
  onArbitraryChange: (arbitraryValue: string | null) => void;
  supportsArbitrary: boolean;
  previewKind?: 'text' | 'background' | 'border' | 'outline' | 'caret';
}

/**
 * ColorPicker component for intuitive color selection in the visual editor.
 *
 * This component provides a sophisticated color selection interface that supports
 * multiple data sources and seamlessly integrates with the component store's utility
 * state system. It handles both predefined color palettes and custom color definitions,
 * offering a unified interface for text colors, background colors, and other color properties.
 *
 * Key features:
 * - Dynamic color palette loading from strategies
 * - Support for direct class arrays in definition objects
 * - Automatic color type detection (text vs background) based on category
 * - Real-time utility state synchronization with component store
 * - Hex color value extraction for visual swatch display
 * - Custom color input for arbitrary values
 * - Graceful fallback handling for missing or invalid color data
 *
 * The component transforms color definitions into a consistent format for the
 * ColorSwatchPicker UI component, handling the complexity of different data
 * sources while providing a simple, consistent user experience.
 *
 * @component
 * @param {ColorPickerProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata
 * @param {string} props.definition.category - Color category (e.g., 'text-color', 'background-color', 'border-color')
 * @param {string} props.definition.label - Display label for the color picker control
 * @param {string} props.definition.description - Descriptive text explaining the color control's purpose
 * @param {any} props.selectedNode - The currently selected component node being edited
 * @returns {JSX.Element} The rendered ColorPicker component with color swatch interface
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  options,
  value,
  onChange,
  onArbitraryChange,
  supportsArbitrary,
  previewKind = 'background'
}) => {
  const [customValue, setCustomValue] = useState('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Convert options to color format expected by ColorSwatchPicker
  const colors = options.map(option => ({
    name: option.label,
    className: option.value,
  }));

  const handleCustomColor = () => {
    if (customValue.trim()) {
      onArbitraryChange(customValue.trim());
      setIsCustomOpen(false);
      setCustomValue('');
    }
  };

  return (
    <div className="space-y-2">
      <ColorSwatchPicker
        value={value || ''}
        onValueChange={onChange}
        colors={colors}
        previewKind={previewKind}
      />

      {supportsArbitrary && (
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
      )}
    </div>
  );
};