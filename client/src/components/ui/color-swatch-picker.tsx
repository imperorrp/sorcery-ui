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
  swatchTemplate?: string; // optional template to build full utility (e.g., 'bg-{value}')
  /**
   * previewKind controls how the swatch is visually rendered so utilities that don't affect background directly
   * (like outline-*, caret-*) can still be previewed.
   */
  previewKind?: 'text' | 'background' | 'outline' | 'caret' | 'border';
}

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  value,
  onValueChange,
  colors,
  className,
  swatchTemplate,
  previewKind = 'background',
}) => {
  // Normalize a potentially modifier-prefixed or utility-prefixed class (e.g., hover:bg-red-500 or bg-red-500)
  // so selection comparison works against raw tokens like 'red-500'.
  const stripUtilityPrefix = (s?: string | null) => {
    if (!s) return undefined;
    // Remove state/responsive prefixes (e.g., hover:, md:)
    const afterModifiers = s.includes(':') ? s.split(':').pop() || s : s;
    // Remove common utility prefixes to get the bare token (e.g., bg-, text-, border-)
    return afterModifiers.replace(/^(bg|text|border|caret|outline|fill|stroke)-/, '');
  };
  const normalizedValue = stripUtilityPrefix(value);

  // Build a visible preview element for caret colors by mapping to a background sample
  const caretPreview = (className: string) => {
    // Extract token after prefix (e.g., caret-red-500 -> red-500, caret-inherit -> inherit)
    const token = className.replace(/^caret-/, '');
    const bgClass = `bg-${token}`; // e.g., bg-red-500, bg-transparent, bg-current, bg-inherit
    return (
      <div className="w-full h-full bg-white flex items-center justify-center">
        <div className={cn("w-[2px] h-4", bgClass)} />
      </div>
    );
  };

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
                  normalizedValue === stripUtilityPrefix(color.className) && "border-blue-500 ring-1 ring-blue-500"
                )}
                onClick={() => {
                  const token = stripUtilityPrefix(color.className) || color.className;
                  if (swatchTemplate) {
                    const full = swatchTemplate.replace('{value}', token);
                    onValueChange(full);
                  } else {
                    onValueChange(token);
                  }
                }}
              >
                {previewKind === 'text' && (
                  // For text colors, show a sample text with the color on white background
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <span
                      className={cn("text-[10px] font-bold", color.hex ? "" : color.className)}
                      style={color.hex ? { color: color.hex } : undefined}
                    >
                      A
                    </span>
                  </div>
                )}
                {previewKind === 'background' && (
                  // For background colors, apply the color directly using hex if available, otherwise use className
                  <div
                    className={cn("w-full h-full", color.hex ? "" : color.className)}
                    style={color.hex ? { backgroundColor: color.hex } : undefined}
                  />
                )}
                {previewKind === 'outline' && (
                  // For outline colors, render a box with a visible outline using the color class
                  <div
                    className={cn("w-full h-full bg-white", "outline-2 outline-offset-0", color.hex ? "" : color.className)}
                    style={color.hex ? { outlineColor: color.hex } : undefined}
                  />
                )}
                {previewKind === 'border' && (
                  // For border colors, render a box with a visible border using the color class
                  <div
                    className={cn("w-full h-full bg-white", "border-2 border-solid", color.hex ? "" : color.className)}
                    style={color.hex ? { borderColor: color.hex } : undefined}
                  />
                )}
                {previewKind === 'caret' && caretPreview(color.className)}
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