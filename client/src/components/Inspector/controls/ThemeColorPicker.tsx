import React from 'react';
import { ColorPicker } from './ColorPicker';
import { useComponentStore } from '@/store/componentStore';
import { resolveThemeColors, convertThemeColorsToOptions } from '@/lib/themeUtils';

interface ThemeColorPickerProps {
  options: Array<{ value: string; label: string }>; // Keyword options from valueSets
  value: string | null;
  arbitraryValue: string | null;
  onChange: (value: string | null) => void;
  onArbitraryChange?: (arbitraryValue: string | null) => void; // Made optional
  supportsArbitrary: boolean;
  previewKind?: string;
  placeholder?: string; // Placeholder for arbitrary input
  swatchTemplate?: string; // e.g. 'bg-{value}' to build full utility class
  currentOpacity: number | null;
  onOpacityChange?: (opacity: number | null) => void;
}

/**
 * ThemeColorPicker component - Smart wrapper around ColorPicker that resolves the user's theme.
 *
 * This component handles theme resolution and color palette generation, providing a live
 * reflection of the user's Tailwind config. It converts the resolved theme colors into
 * ColorOption[] format and passes them to the dumb ColorPicker component.
 */
export const ThemeColorPicker: React.FC<ThemeColorPickerProps> = (props) => {
  const tailwindConfig = useComponentStore((state) => state.tailwindConfig);

  // Debug log: raw tailwindConfig string length
  // ...existing code...

  // Resolve the user's theme colors
  const themeColors = React.useMemo(() => {
    const resolved = resolveThemeColors(tailwindConfig);
    return resolved;
  }, [tailwindConfig]);

  // Convert to ColorOption[] for the UI
  const colorOptions = React.useMemo(() => {
    const opts = convertThemeColorsToOptions(themeColors);
    return opts;
  }, [themeColors]);

  return (
    <ColorPicker
      {...props}
      colors={colorOptions}
      previewKind={props.previewKind as 'text' | 'background' | 'border' | 'outline' | 'caret' | undefined}
    />
  );
};