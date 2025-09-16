import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * ColorPicker Component - A simple color picker UI component
 *
 * Provides a button that opens a popover with a color input for selecting colors.
 * Used in definition-driven controls for Tailwind color properties.
 *
 * @param value - The current color value (e.g., '#ff0000' or 'red-500')
 * @param onChange - Callback function called when color changes
 * @param placeholder - Placeholder text for the color input
 * @returns The rendered ColorPicker component
 */
interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  placeholder?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '',
  onChange,
  placeholder = 'Select color'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Handles color selection from the input
   *
   * @param event - The change event from the color input
   */
  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    onChange?.(newColor);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <div
            className="w-4 h-4 rounded border mr-2"
            style={{ backgroundColor: value }}
          />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <input
          type="color"
          value={value.startsWith('#') ? value : '#000000'}
          onChange={handleColorChange}
          className="w-8 h-8 border rounded cursor-pointer"
        />
      </PopoverContent>
    </Popover>
  );
};