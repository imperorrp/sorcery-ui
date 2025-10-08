import { useMemo } from 'react';
import { useComponentStore } from '@/store/componentStore';
import { resolveTheme, flattenThemeObject } from '@/lib/themeUtils';
import type { SerializableElement } from '@/store/componentStore';

// Define types
interface ControlDefinition {
  category: string;
  variants?: Array<{
    label: string;
    prefix: string;
    template: string;
    supportsNegative: boolean;
  }>;
  valueSets?: Array<{
    type: string;
    options?: Array<{ class: string; value?: string; label?: string }>;
    source?: string;
    examples?: string[];
    typeHint?: string;
    placeholder?: string;
  }>;
}

interface Variant {
  label: string;
  prefix: string;
  template: string;
  supportsNegative: boolean;
}

// suggestions.json is used in specific controls (ComboBoxWithSlider) instead of here

// Define a standardized output format
interface ControlData {
  options: Array<{ value: string; label: string; }>; // For presets (list + generative)
  currentValue: string | null; // The currently applied class
  currentArbitraryValue: string | null; // The value inside brackets, if any
  currentOpacity: number | null; // The opacity modifier, if any (0-100)
  setValue: (className: string | null, opacity?: number | null) => void; // A function to update the utility class
  setArbitraryValue: (arbitraryValue: string | null, opacity?: number | null) => void; // A function to set a custom value
  supportsArbitrary: boolean;
}

/**
 * Custom hook for managing control state and data flow in inspector controls.
 *
 * This hook provides a standardized interface for inspector controls to interact with
 * the component store's utility state system. It handles option generation from control
 * definitions, current value detection, and utility class updates with proper modifier
 * prefix support.
 *
 * Key features:
 * - Dynamic option generation from Tailwind control definitions
 * - Automatic current value detection from component utility state
 * - Support for arbitrary values with bracket syntax
 * - Modifier prefix handling for responsive and state variants
 * - Type-safe interface for control components
 *
 * The hook abstracts the complexity of utility state management while providing
 * a clean, consistent API for various control types (sliders, segmented controls, etc.).
 *
 * @param definition - Control definition object containing category and value sets
 * @param variant - Variant configuration with template and prefix information
 * @param selectedNode - The currently selected component node being edited
 * @param modifierPrefix - Optional prefix for responsive/state modifiers (e.g., 'md:', 'hover:')
 * @returns ControlData object with options, current values, and update functions
 */
export function useControlData(definition: ControlDefinition | undefined, variant: Variant | undefined, selectedNode: SerializableElement | undefined, modifierPrefix: string = ''): ControlData {
  const updateUtilityClass = useComponentStore((s) => s.updateUtilityClass);
  const tailwindConfig = useComponentStore((s) => s.tailwindConfig);

  const { options, supportsArbitrary, arbitraryTemplate } = useMemo(() => {
    if (!definition || !variant) {
      return { options: [], supportsArbitrary: false, arbitraryTemplate: '' };
    }

    const allOptions: Array<{ value: string; label: string }> = [];
    let supportsArb = false;
    let arbTemplate = '';

    // Resolve theme for dynamic suggestions
    const theme = resolveTheme(tailwindConfig);

    for (const valueSet of definition.valueSets || []) {
      if (valueSet.type === 'list' && valueSet.options) {
        allOptions.push(...valueSet.options.map((cls) => ({
          value: variant.template.replace('{value}', cls.class),
          label: cls.label || cls.class,
        })));
      } else if (valueSet.type === 'suggestions' && valueSet.source) {
        // Dynamic suggestions from theme - only include non-numeric and non-fractional values for buttons
        const numericRegex = /^\d+(\.\d+)?$/;
        const fractionRegex = /^\d+\/\d+$/;
        if (valueSet.source === 'spacing') {
          const flattenedSpacing = flattenThemeObject((theme.spacing as Record<string, unknown>) || {});
          const filteredKeys = Object.keys(flattenedSpacing).filter(key => !numericRegex.test(key) && !fractionRegex.test(key));
          allOptions.push(...filteredKeys.map(key => ({
            value: variant.template.replace('{value}', key),
            label: key,
          })));
        } else if (valueSet.source === 'borderRadius') {
          const flattenedBorderRadius = flattenThemeObject((theme.borderRadius as Record<string, unknown>) || {});
          const filteredKeys = Object.keys(flattenedBorderRadius).filter(key => !numericRegex.test(key) && !fractionRegex.test(key));
          allOptions.push(...filteredKeys.map(key => ({
            value: variant.template.replace('{value}', key),
            label: key,
          })));
        }
        // Add more sources as needed
      } else if (valueSet.type === 'arbitrary') {
        supportsArb = true;
        arbTemplate = variant.template;
      }
    }

    return { options: allOptions, supportsArbitrary: supportsArb, arbitraryTemplate: arbTemplate };
  }, [definition, variant, tailwindConfig]);

  const { currentValue, currentArbitraryValue, currentOpacity } = useMemo(() => {
    if (!definition || !variant || !selectedNode) {
      return { currentValue: null, currentArbitraryValue: null, currentOpacity: null };
    }

    const stateKey = `${definition.category}-${variant.label.toLowerCase().replace(/\s+/g, '-')}`;
    const currentClass = selectedNode.utilityClassState?.[stateKey] || '';

    if (!currentClass) return { currentValue: null, currentArbitraryValue: null, currentOpacity: null };

    // Strip modifiers
    const stripModifiers = (c: string) => (c.includes(':') ? c.split(':').pop() || c : c);
    const cls = stripModifiers(currentClass);

    // Check for opacity modifier
    let baseCls = cls;
    let opacity: number | null = null;
    if (cls.includes('/')) {
      const parts = cls.split('/');
      baseCls = parts[0];
      const opacityStr = parts[1];
      const parsed = parseInt(opacityStr, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        opacity = parsed;
      }
    }

    // Check if it's an arbitrary value
    if (arbitraryTemplate) {
      const pattern = `^${arbitraryTemplate.replace('{value}', '\\[(.+)\\]')}$`;
      const match = baseCls.match(new RegExp(pattern));
      if (match) {
        return { currentValue: null, currentArbitraryValue: match[1], currentOpacity: opacity };
      }
    }

    // Check if it's a preset
    const preset = options.find(opt => opt.value === baseCls);
    if (preset) {
      return { currentValue: baseCls, currentArbitraryValue: null, currentOpacity: opacity };
    }

    // Fallback
    return { currentValue: baseCls, currentArbitraryValue: null, currentOpacity: opacity };
  }, [selectedNode, definition, variant, options, arbitraryTemplate]);

  const setValue = (className: string | null, opacity?: number | null) => {
    if (!definition || !variant || !selectedNode) return;
    const stateKey = `${definition.category}-${variant.label.toLowerCase().replace(/\s+/g, '-')}`;
    let finalClass = className;
    if (finalClass && opacity !== null && opacity !== undefined) {
      finalClass = `${finalClass}/${opacity}`;
    }
    finalClass = finalClass ? modifierPrefix + finalClass : null;
    updateUtilityClass(selectedNode.id, stateKey, finalClass);
  };

  const setArbitraryValue = (arbitraryValue: string | null, opacity?: number | null) => {
    if (!definition || !variant || !selectedNode) return;
    if (!arbitraryValue || !arbitraryTemplate) {
      const stateKey = `${definition.category}-${variant.label.toLowerCase().replace(/\s+/g, '-')}`;
      updateUtilityClass(selectedNode.id, stateKey, null);
      return;
    }

    const stateKey = `${definition.category}-${variant.label.toLowerCase().replace(/\s+/g, '-')}`;
    let finalClass = arbitraryTemplate.replace('{value}', `[${arbitraryValue}]`);
    if (opacity !== null && opacity !== undefined) {
      finalClass = `${finalClass}/${opacity}`;
    }
    finalClass = modifierPrefix + finalClass;
    updateUtilityClass(selectedNode.id, stateKey, finalClass);
  };

  return { options, currentValue, currentArbitraryValue, currentOpacity, setValue, setArbitraryValue, supportsArbitrary };
}