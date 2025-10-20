import React, { useState } from 'react';
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import type { ColorOption } from '@/lib/colorConstants';

// The component now receives a fully-formed `ColorOption` array.
interface ColorPickerProps {
  options: Array<{ value: string; label: string }>; // Keyword options from valueSets
  colors: ColorOption[]; // Color swatches from theme
  value: string | null;
  onChange: (value: string | null) => void;
  onArbitraryChange?: (arbitraryValue: string | null) => void; // Made optional
  supportsArbitrary: boolean;
  previewKind?: 'text' | 'background' | 'border' | 'outline' | 'caret';
  placeholder?: string; // Placeholder for arbitrary input
  swatchTemplate?: string; // e.g. 'bg-{value}' to build full utility class
  currentOpacity: number | null;
  onOpacityChange?: (opacity: number | null) => void;
}

/**
 * ColorPicker Component - Advanced color selection interface for Tailwind utilities
 *
 * This component provides a comprehensive color selection interface that combines
 * keyword options (transparent, current, inherit), color swatches from theme palettes,
 * opacity controls, and arbitrary value input. It supports different preview modes
 * for various CSS properties (background, text, border, etc.).
 *
 * Features:
 * - Keyword color options for semantic values
 * - Collapsible color swatch grid with theme-aware colors
 * - Opacity slider with Tailwind-compatible increments
 * - Arbitrary color input for custom values
 * - Multiple preview modes for different CSS properties
 * - Smart collapse behavior for large color palettes
 *
 * @param {Array<{value: string, label: string}>} options - Keyword color options (transparent, current, etc.)
 * @param {ColorOption[]} colors - Color swatches from theme palettes
 * @param {string | null} value - Currently selected color value
 * @param {function} onChange - Callback when a preset color is selected
 * @param {function} onArbitraryChange - Callback for arbitrary color input
 * @param {boolean} supportsArbitrary - Whether arbitrary color input is enabled
 * @param {string} previewKind - Preview mode: 'text', 'background', 'border', 'outline', 'caret'
 * @param {string} placeholder - Placeholder text for arbitrary input field
 * @param {string} swatchTemplate - Template for building full utility classes (e.g., 'bg-{value}')
 * @param {number | null} currentOpacity - Current opacity value (0-100)
 * @param {function} onOpacityChange - Callback when opacity changes
 * @returns {JSX.Element} The ColorPicker component
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  options,
  colors,
  value,
  onChange,
  onArbitraryChange,
  supportsArbitrary,
  previewKind = 'background',
  placeholder = 'Custom color...'
  , swatchTemplate,
  currentOpacity,
  onOpacityChange
}) => {
  // ...existing code...
  const [customValue, setCustomValue] = useState('');
  const [showAllColors, setShowAllColors] = useState(false);
  const collapseThreshold = 35;
  const shouldCollapse = colors.length > collapseThreshold;
  const visibleColors = shouldCollapse && !showAllColors ? colors.slice(0, collapseThreshold) : colors;
  const remainingColorCount = Math.max(colors.length - collapseThreshold, 0);

  React.useEffect(() => {
    setShowAllColors(false);
  }, [colors]);

  React.useEffect(() => {
    setCustomValue('');
  }, [value]); // Clear custom input when a preset is selected

  const handleArbitrarySubmit = () => {
    if (customValue.trim() && onArbitraryChange) {
      onArbitraryChange(customValue.trim());
      setCustomValue('');
    }
  };

  return (
    <div className="space-y-2">
      {/* Keyword options (like transparent, current, inherit) */}
      {options.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {options.map((option) => (
            <Button
              key={option.value}
              variant={value === option.value ? 'default' : 'outline'}
              size="sm"
              className="text-xs px-2 py-1 h-auto"
              onClick={() => onChange(option.value)}
              title={option.label}
            >
              <span className="font-mono">{option.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Color swatches */}
      <ColorSwatchPicker
        value={value || ''}
        onValueChange={(val) => {
          // ColorSwatchPicker now emits either a raw token (e.g., 'red-500') or a
          // full utility class when provided a swatchTemplate; just forward it.
          onChange(val || null);
        }}
        colors={visibleColors}
        previewKind={previewKind}
        swatchTemplate={swatchTemplate}
      />

      {shouldCollapse && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllColors((prev) => !prev)}
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {showAllColors ? 'Show fewer colors' : `Show ${remainingColorCount} more`}
        </Button>
      )}

      {/* Opacity slider */}
      {(value || currentOpacity !== null) && onOpacityChange && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Opacity: {currentOpacity ?? 100}%</label>
          <Slider
            value={[currentOpacity ?? 100]}
            onValueChange={(vals) => onOpacityChange(vals[0])}
            min={0}
            max={100}
            step={5} // Tailwind opacity uses 0,5,10,...,100 increments
            className="w-full"
          />
        </div>
      )}

      {/* Arbitrary value input - inline like other controls */}
      {supportsArbitrary && onArbitraryChange && (
        <div className="flex gap-2">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder={placeholder}
            className="text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleArbitrarySubmit();
            }}
          />
          <Button onClick={handleArbitrarySubmit} size="sm" className="px-3">
            Apply
          </Button>
        </div>
      )}
    </div>
  );
};