import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import suggestions from '@/lib/definitions/suggestions.json';
import { getCssForClass, stripVariantPrefixes } from '@/lib/themeUtils';
import { cn } from '@/lib/utils';

/**
 * ComboBoxWithSlider component - Advanced control combining preset selection with slider input.
 *
 * This component provides a sophisticated interface that combines preset button selection
 * with slider-based numeric input, supporting both keyword-based presets and arbitrary values.
 * It intelligently handles different data types (numeric, fractions) and provides seamless
 * synchronization between visual controls and utility class generation.
 *
 * Key features:
 * - Preset button selection with visual feedback for active states
 * - Intelligent slider configuration based on suggestion data sources
 * - Support for numeric ranges and fraction-based values
 * - Arbitrary value input with type-aware validation
 * - Dual-mode slider: index-based for keywords, value-based for numbers
 * - Automatic synchronization between slider, input, and preset selection
 * - Type-hinted input fields (number vs text) based on data characteristics
 *
 * The component handles complex state management to ensure that preset selection,
 * slider movement, and arbitrary input remain synchronized while providing clear
 * visual feedback about the current selection state.
 *
 * @component
 * @param {ComboBoxWithSliderProps} props - Component props
 * @param {Array<{value: string, label: string}>} props.options - Array of preset options with values and labels
 * @param {string | null} props.value - Currently selected preset value
 * @param {string | null} props.arbitraryValue - Current arbitrary/custom value
 * @param {(value: string | null) => void} props.onChange - Callback when preset selection changes
 * @param {(arbitraryValue: string | null) => void} props.onArbitraryChange - Callback when arbitrary value changes
 * @param {boolean} props.supportsArbitrary - Whether arbitrary values are supported
 * @param {string} [props.suggestionsSource] - Key for suggestion data source from suggestions.json
 * @param {string} [props.typeHint] - Hint for input type (number, length, etc.)
 * @param {string} [props.placeholder] - Placeholder text for input fields
 * @param {number} [props.min=0] - Minimum value for numeric sliders
 * @param {number} [props.max=100] - Maximum value for numeric sliders
 * @param {number} [props.step=1] - Step increment for numeric sliders
 * @param {string} [props.unit] - Unit suffix for display
 * @param {string} [props.dataType] - Additional data type information
 * @returns {JSX.Element} The rendered ComboBoxWithSlider component with combined preset and slider controls
 */

interface ComboBoxWithSliderProps {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  arbitraryValue: string | null;
  onChange: (value: string | null) => void;
  onArbitraryChange: (arbitraryValue: string | null) => void;
  supportsArbitrary: boolean;
  suggestionsSource?: string;
  typeHint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  dataType?: string;
  resolvedTheme?: Record<string, unknown>;
}

const numericRegex = /^-?\d+(?:\.\d+)?$/;
const fractionRegex = /^\d+\/\d+$/;

const extractKeyword = (value: string): string => {
  if (!value) return '';
  const colonIndex = value.lastIndexOf(':');
  const base = colonIndex >= 0 ? value.slice(colonIndex + 1) : value;
  const arbitraryMatch = base.match(/\[(.+)\]/);
  if (arbitraryMatch) return arbitraryMatch[1];
  const dashIndex = base.indexOf('-');
  if (dashIndex === -1) return base;
  return base.slice(dashIndex + 1);
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface SliderConfig {
  mode: 'numeric' | 'fraction';
  values: string[];
  numbers?: number[];
  min: number;
  max: number;
  step: number;
  indexByValue: Map<string, number>;
}

type OptionMeta = {
  value: string;
  label: string;
  keyword: string;
};

const createNumericConfig = (rawValues: string[]): SliderConfig | null => {
  const uniqueValues = Array.from(new Set(rawValues));
  const numericEntries = uniqueValues
    .map((str) => ({ keyword: str, numeric: Number(str) }))
    .filter((entry) => !Number.isNaN(entry.numeric))
    .sort((a, b) => a.numeric - b.numeric);

  if (numericEntries.length < 2) return null;

  const min = numericEntries[0].numeric;
  const max = numericEntries[numericEntries.length - 1].numeric;
  const differences = numericEntries
    .slice(1)
    .map((entry, index) => entry.numeric - numericEntries[index].numeric);
  const step = differences.length > 0 ? Math.min(...differences) : 1;

  const values = numericEntries.map((entry) => entry.keyword);
  const numbers = numericEntries.map((entry) => entry.numeric);
  const indexByValue = new Map<string, number>();
  values.forEach((value, idx) => indexByValue.set(value, idx));

  return {
    mode: 'numeric',
    values,
    numbers,
    min,
    max,
    step,
    indexByValue,
  };
};

const createFractionConfig = (rawValues: string[]): SliderConfig | null => {
  const uniqueValues: string[] = [];
  rawValues.forEach((value) => {
    if (!uniqueValues.includes(value)) {
      uniqueValues.push(value);
    }
  });

  if (uniqueValues.length < 2) return null;

  const indexByValue = new Map<string, number>();
  uniqueValues.forEach((value, idx) => indexByValue.set(value, idx));

  return {
    mode: 'fraction',
    values: uniqueValues,
    min: 0,
    max: uniqueValues.length - 1,
    step: 1,
    indexByValue,
  };
};

export const ComboBoxWithSlider: React.FC<ComboBoxWithSliderProps> = ({
  options,
  value,
  arbitraryValue,
  onChange,
  onArbitraryChange,
  supportsArbitrary,
  suggestionsSource,
  typeHint,
  placeholder,
  min = 0,
  max = 100,
  step = 1,
  resolvedTheme,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const sliderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const suggestionConfig = useMemo<SliderConfig | null>(() => {
    if (!suggestionsSource) return null;
    const suggestionArray = (suggestions as Record<string, string[] | undefined>)[suggestionsSource];
    if (!suggestionArray || suggestionArray.length === 0) return null;

    const numericCandidates = suggestionArray.filter((item) => numericRegex.test(String(item)));
    if (numericCandidates.length >= 2) {
      return createNumericConfig(numericCandidates);
    }

    const fractionCandidates = suggestionArray.filter((item) => fractionRegex.test(String(item)));
    if (fractionCandidates.length >= 2) {
      return createFractionConfig(fractionCandidates);
    }

    return null;
  }, [suggestionsSource]);

  const optionMetadata = useMemo<OptionMeta[]>(
    () =>
      options.map((option) => {
        const keyword = extractKeyword(option.value) || option.label || option.value;
        return { ...option, keyword };
      }),
    [options]
  );

  const dedupedOptions = useMemo(() => {
    const seen = new Set<string>();
    return optionMetadata.filter((opt) => {
      if (seen.has(opt.keyword)) return false;
      seen.add(opt.keyword);
      return true;
    });
  }, [optionMetadata]);

  const keywordToOption = useMemo(() => {
    const map = new Map<string, OptionMeta>();
    optionMetadata.forEach((opt) => {
      if (!map.has(opt.keyword)) {
        map.set(opt.keyword, opt);
      }
      if (opt.label && !map.has(opt.label)) {
        map.set(opt.label, opt);
      }
    });
    return map;
  }, [optionMetadata]);

  const allOptions = dedupedOptions;

  const inputType = useMemo(() => {
    if (!typeHint) return 'number';
    if (typeHint.includes('number') || typeHint.includes('percentage') || typeHint.includes('angle')) return 'number';
    if (typeHint.includes('length') || typeHint.includes('size') || typeHint.includes('ratio')) return 'text';
    return 'text';
  }, [typeHint]);

  useEffect(() => {
    // We only want the text input to reflect an explicit arbitrary value
    // coming from the store or user typing. Do NOT populate the input
    // when a preset (value) is selected or when the slider chooses a
    // suggested value — the input should remain as placeholder in that case.
    if (arbitraryValue) {
      setInputValue(arbitraryValue);

      if (suggestionConfig?.mode === 'numeric') {
        const numeric = Number(arbitraryValue);
        if (!Number.isNaN(numeric)) {
          setSliderValue(clamp(numeric, suggestionConfig.min, suggestionConfig.max));
        }
      } else if (!suggestionConfig && inputType === 'number') {
        const numeric = Number(arbitraryValue);
        if (!Number.isNaN(numeric)) {
          setSliderValue(numeric);
        }
      }

      return;
    }

    if (value) {
      // When a preset value is active, update the slider position but do not
      // populate the arbitrary text input (we keep placeholder visible).
      const keyword = extractKeyword(value);

      if (suggestionConfig) {
        const index = suggestionConfig.indexByValue.get(keyword);
        if (index !== undefined) {
          if (suggestionConfig.mode === 'numeric' && suggestionConfig.numbers) {
            setSliderValue(suggestionConfig.numbers[index]);
          } else {
            setSliderValue(index);
          }
          return;
        }
      }

      if (!suggestionConfig && inputType === 'number') {
        const numeric = Number(keyword);
        if (!Number.isNaN(numeric)) {
          setSliderValue(numeric);
        }
      }

      // do not set inputValue here — preserve placeholder
      return;
    }

    // No value or arbitrary value — clear the input and set a sensible slider default
    setInputValue('');
    if (suggestionConfig) {
      if (suggestionConfig.mode === 'numeric' && suggestionConfig.numbers?.length) {
        setSliderValue(suggestionConfig.numbers[0]);
      } else {
        setSliderValue(0);
      }
    } else {
      setSliderValue(min);
    }
  }, [value, arbitraryValue, suggestionConfig, inputType, min]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sliderTimeoutRef.current) {
        clearTimeout(sliderTimeoutRef.current);
      }
    };
  }, []);

  const handlePresetSelect = (optionValue: string) => {
    // Clear any arbitrary value first
    onArbitraryChange(null);

  // Apply the preset class in a microtask after clearing arbitrary
  Promise.resolve().then(() => onChange(optionValue));

    // Update slider position to match the preset (if suggestions are available)
    const keyword = extractKeyword(optionValue);
    if (suggestionConfig) {
      const index = suggestionConfig.indexByValue.get(keyword);
      if (index !== undefined) {
        if (suggestionConfig.mode === 'numeric' && suggestionConfig.numbers) {
          setSliderValue(suggestionConfig.numbers[index]);
        } else {
          setSliderValue(index);
        }
      }
    }
  };

  const handleSliderChange = useCallback((newValues: number[]) => {
    const val = newValues[0];

    // For smooth sliding, only update local slider state immediately
    // Defer complex logic to avoid blocking the UI thread
    setSliderValue(val);

    // Debounce the expensive operations
    if (sliderTimeoutRef.current) {
      clearTimeout(sliderTimeoutRef.current);
    }

    sliderTimeoutRef.current = setTimeout(() => {
      if (suggestionConfig) {
        if (suggestionConfig.mode === 'fraction') {
          const clampedIndex = Math.round(clamp(val, suggestionConfig.min, suggestionConfig.max));
          const keyword = suggestionConfig.values[clampedIndex];

          const matchedOption = keywordToOption.get(keyword);
          if (matchedOption) {
            onArbitraryChange(null);
            onChange(matchedOption.value);
          } else {
            // Try to synthesize a full utility class using the first option as an example prefix
            const firstOpt = options[0];
            if (firstOpt && firstOpt.value && firstOpt.value.includes('{value}') === false) {
              const exampleValue = firstOpt.value;
              const dash = exampleValue.indexOf('-');
              if (dash >= 0) {
                const prefix = exampleValue.slice(0, dash + 1);
                onArbitraryChange(null);
                onChange(prefix + keyword);
              } else {
                onArbitraryChange(null);
                onChange(keyword);
              }
            } else {
              onArbitraryChange(null);
              onChange(keyword);
            }
          }
          return;
        }

        if (suggestionConfig.mode === 'numeric' && suggestionConfig.numbers) {
          const numbers = suggestionConfig.numbers;
          let nearestIndex = 0;
          let bestDiff = Math.abs(val - numbers[0]);
          for (let i = 1; i < numbers.length; i += 1) {
            const diff = Math.abs(val - numbers[i]);
            if (diff < bestDiff) {
              bestDiff = diff;
              nearestIndex = i;
            }
          }

          const nearestNumber = numbers[nearestIndex];
          const keyword = suggestionConfig.values[nearestIndex];

          const matchedOption = keywordToOption.get(keyword) || keywordToOption.get(String(nearestNumber));
          if (matchedOption) {
            onArbitraryChange(null);
            onChange(matchedOption.value);
          } else {
            const firstOpt = options[0];
            if (firstOpt && firstOpt.value && firstOpt.value.includes('{value}') === false) {
              const exampleValue = firstOpt.value;
              const dash = exampleValue.indexOf('-');
              if (dash >= 0) {
                const prefix = exampleValue.slice(0, dash + 1);
                onArbitraryChange(null);
                onChange(prefix + keyword);
              } else {
                onArbitraryChange(null);
                onChange(keyword);
              }
            } else {
              // As a last resort, apply the raw keyword as a class so the
              // inspector reflects the change (do not set arbitrary input)
              onArbitraryChange(null);
              onChange(keyword);
            }
          }
          return;
        }
      }

      const clamped = clamp(val, min, max);
      const numericString = clamped.toString();
      setInputValue(numericString);
      onChange(null);
      onArbitraryChange(numericString);
    }, 100); // 100ms debounce
  }, [suggestionConfig, keywordToOption, options, onArbitraryChange, onChange, min, max]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    setInputValue(val);
    onChange(null);

    if (!val.trim()) {
      onArbitraryChange(null);
      return;
    }

    if (inputType === 'number') {
      const numeric = Number(val);
      if (!Number.isNaN(numeric)) {
        setSliderValue(numeric);
        onArbitraryChange(val);
      } else {
        onArbitraryChange(val);
      }
    } else {
      onArbitraryChange(val);
    }
  };

  const handleInputBlur = () => {
    if (inputType !== 'number') return;
    const numeric = Number(inputValue);
    if (Number.isNaN(numeric)) return;

    if (suggestionConfig?.mode === 'numeric' && suggestionConfig.numbers) {
      const clampedValue = clamp(numeric, suggestionConfig.min, suggestionConfig.max);
      const exactIndex = suggestionConfig.numbers.findIndex((num) => num === clampedValue);

      if (exactIndex >= 0) {
        const keyword = suggestionConfig.values[exactIndex];
        setSliderValue(clampedValue);
        // Do not populate the input for presets; keep placeholder unless user typed
        const matchedOption = keywordToOption.get(keyword) || keywordToOption.get(String(clampedValue));
        if (matchedOption) {
          onArbitraryChange(null);
          Promise.resolve().then(() => onChange(matchedOption.value));
          return;
        }
      }

      onChange(null);
      onArbitraryChange(clampedValue.toString());
      setSliderValue(clampedValue);
      setInputValue(clampedValue.toString());
      return;
    }

    const clampedValue = clamp(numeric, min, max);
    onChange(null);
    onArbitraryChange(clampedValue.toString());
    setSliderValue(clampedValue);
    setInputValue(clampedValue.toString());
  };

  const shouldShowSuggestionSlider = Boolean(suggestionConfig);
  const shouldShowFallbackSlider = !suggestionConfig && supportsArbitrary && inputType === 'number';

  const hintPlaceholder = placeholder;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 flex-wrap">
        {allOptions.map((option) => {
          const baseClass = stripVariantPrefixes(option.value);
          const previewStyle = resolvedTheme ? getCssForClass(baseClass, resolvedTheme) : {};
          const {
            fontSize,
            lineHeight,
            fontWeight,
            width: previewWidth,
            minWidth,
            maxWidth,
            height: previewHeight,
            minHeight,
            maxHeight,
            ...buttonPreviewStyle
          } = previewStyle as CSSProperties;

          const labelStyle: CSSProperties = {};
          if (fontSize) labelStyle.fontSize = fontSize;
          if (lineHeight) labelStyle.lineHeight = lineHeight;
          if (fontWeight) labelStyle.fontWeight = fontWeight;

          const applyUtilityClass = baseClass.startsWith('rounded') || baseClass.startsWith('shadow');
          const buttonClassName = cn(
            'text-xs px-2 py-1 h-auto flex items-center gap-2 transition-colors',
            applyUtilityClass && baseClass
          );

          const isBorderColor = baseClass.startsWith('border-') && baseClass.split('-').length >= 3;
          const isWidthUtility = baseClass.startsWith('w-');
          const isHeightUtility = baseClass.startsWith('h-');

          const borderPreview = isBorderColor ? (
            <span className={cn('inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border-2 bg-background', baseClass)} />
          ) : null;

          const resolvedWidth = previewWidth || maxWidth || minWidth;
          const widthPreview = isWidthUtility ? (
            <div className="flex flex-1 items-center overflow-hidden">
              <div
                className={cn(
                  'mx-1 h-1 rounded-full bg-primary/70 transition-all duration-150 ease-out',
                  typeof resolvedWidth === 'string' ? undefined : baseClass
                )}
                style={{ width: typeof resolvedWidth === 'string' ? resolvedWidth : undefined, maxWidth: '100%' }}
              />
            </div>
          ) : null;

          const resolvedHeight = previewHeight || maxHeight || minHeight;
          const heightPreview = isHeightUtility ? (
            <div className="flex h-6 w-6 items-end justify-center overflow-hidden">
              <div
                className={cn(
                  'w-1 rounded-full bg-primary/70 transition-all duration-150 ease-out',
                  typeof resolvedHeight === 'string' ? undefined : baseClass
                )}
                style={{ height: typeof resolvedHeight === 'string' ? resolvedHeight : undefined, maxHeight: '32px' }}
              />
            </div>
          ) : null;

          return (
            <Button
              key={option.value}
              variant={value === option.value ? 'default' : 'outline'}
              size="sm"
              className={buttonClassName}
              style={buttonPreviewStyle}
              onClick={() => handlePresetSelect(option.value)}
              title={option.label || option.keyword}
            >
              {borderPreview}
              {widthPreview}
              {heightPreview}
              <span className="font-mono" style={labelStyle}>{option.label || option.keyword}</span>
            </Button>
          );
        })}

        {/* Clear button removed; ControlRow reset handles clearing */}
      </div>

      {(shouldShowSuggestionSlider || shouldShowFallbackSlider || supportsArbitrary) && (
        <div className="space-y-3">
          {shouldShowSuggestionSlider && suggestionConfig ? (
            <div className="space-y-2">
              {suggestionConfig.mode === 'fraction' && (
                <div className="text-center text-xs text-muted-foreground">
                  {suggestionConfig.values[Math.round(clamp(sliderValue, suggestionConfig.min, suggestionConfig.max))]}
                </div>
              )}

              <Slider
                value={[sliderValue]}
                onValueChange={handleSliderChange}
                min={suggestionConfig.min}
                max={suggestionConfig.max}
                step={suggestionConfig.step}
                className="w-full"
              />

              {suggestionConfig.mode === 'numeric' && (
                <div className="flex justify-end items-center gap-2">
                  {/* Read-only display of the currently selected suggestion from the slider */}
                  <div className="text-xs font-mono text-right w-24">
                    {(() => {
                      // Try to find a matching suggestion keyword for the current sliderValue
                      if (suggestionConfig.numbers && suggestionConfig.numbers.length) {
                        const idx = suggestionConfig.numbers.indexOf(Number(sliderValue));
                        if (idx >= 0) return suggestionConfig.values[idx];
                      }
                      // Fallback: show the numeric sliderValue
                      return String(sliderValue);
                    })()}
                  </div>

                  {/* If arbitrary entry is supported, render an explicit editable input for it.
                      This input remains empty (shows placeholder) unless user types or arbitraryValue exists. */}
                  {supportsArbitrary && (
                    <Input
                      type="number"
                      value={inputValue}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className="w-24 h-7 text-xs"
                      min={suggestionConfig.min}
                      max={suggestionConfig.max}
                      step={suggestionConfig.step}
                      placeholder={hintPlaceholder}
                    />
                  )}
                </div>
              )}

              {suggestionConfig.mode === 'fraction' && supportsArbitrary && inputType !== 'number' && (
                <Input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={hintPlaceholder || 'Enter value'}
                  className="w-full text-xs"
                />
              )}
            </div>
          ) : (
            shouldShowFallbackSlider && (
              <div className="space-y-2">
                <Slider
                  value={[sliderValue]}
                  onValueChange={handleSliderChange}
                  min={min}
                  max={max}
                  step={step}
                  className="w-full"
                />
                <div className="flex justify-end">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="w-24 h-7 text-xs"
                    min={min}
                    max={max}
                    step={step}
                    placeholder={hintPlaceholder}
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {supportsArbitrary && !shouldShowSuggestionSlider && !shouldShowFallbackSlider && (
        <Input
          type={inputType}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={hintPlaceholder || 'Enter value'}
          className="w-full text-xs"
        />
      )}

    </div>
  );
};