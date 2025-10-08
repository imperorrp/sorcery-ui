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
 * ColorPicker component for intuitive color selection in the visual editor.
 *
 * This is a "dumb" presentational component. It receives keyword options and color swatches
 * and is responsible for rendering the UI and reporting user selections. All theme-aware
 * logic is handled by its parent.
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
        colors={colors}
        previewKind={previewKind}
        swatchTemplate={swatchTemplate}
      />

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