import React from 'react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';
import type { ColorOption } from '@/lib/colorConstants';

/**
 * ColorSwatchPicker Component - A grid of color swatches for selecting colors
 *
 * Displays a grid of color options as clickable buttons with tooltips.
 * Supports both text and background color types with visual previews.
 *
 * @param value - The currently selected color class name
 * @param onValueChange - Callback function called when a color is selected
 * @param colors - Array of color options to display
 * @param className - Additional CSS classes for styling
 * @param type - Type of color selection ('text' or 'background')
 * @returns The rendered ColorSwatchPicker component
 */
interface ColorSwatchPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  colors: ColorOption[];
  className?: string;
  type?: 'text' | 'background';
}

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  value,
  onValueChange,
  colors,
  className,
  type = 'background',
}) => {
  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-7 gap-1 p-1", className)}>
        {colors.map((color) => (
          <Tooltip key={color.className}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-6 h-6 p-0 rounded border-2 hover:border-gray-400 transition-colors overflow-hidden",
                  value === color.className && "border-blue-500 ring-1 ring-blue-500"
                )}
                onClick={() => onValueChange(color.className)}
              >
                {type === 'text' ? (
                  // For text colors, show a sample text with the color on white background
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <span className={cn("text-xs font-bold", color.className)}>A</span>
                  </div>
                ) : (
                  // For background colors, apply the color directly
                  <div className={cn("w-full h-full", color.className)} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{color.name}</p>
              {color.hex && <p className="text-xs font-mono">{color.hex}</p>}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};