import { useMemo } from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import datasets from '@/lib/definitions/datasets.json';

// Define types
interface ControlDefinition {
  category: string;
  strategies?: Array<{
    type: string;
    classes?: Array<{ class: string; value?: string; label?: string }>;
    generative?: { template: string; dataset: string };
    arbitrary?: { template: string };
  }>;
}

interface DatasetItem {
  class: string;
  value: string;
  label?: string;
}

type DatasetsType = Record<string, DatasetItem[]>;

// Define a standardized output format
interface ControlData {
  options: Array<{ value: string; label: string; }>; // For presets (list + generative)
  currentValue: string | null; // The currently applied class
  currentArbitraryValue: string | null; // The value inside brackets, if any
  setValue: (className: string | null) => void; // A function to update the utility class
  setArbitraryValue: (arbitraryValue: string | null) => void; // A function to set a custom value
  supportsArbitrary: boolean;
}

export function useControlData(definition: ControlDefinition | undefined, selectedNode: SerializableElement | undefined, modifierPrefix: string = ''): ControlData {
  const updateUtilityClass = useComponentStore((s) => s.updateUtilityClass);

  const { options, supportsArbitrary, arbitraryTemplate } = useMemo(() => {
    if (!definition) {
      return { options: [], supportsArbitrary: false, arbitraryTemplate: '' };
    }

    const allOptions: Array<{ value: string; label: string }> = [];
    let supportsArb = false;
    let arbTemplate = '';

    for (const strategy of definition.strategies || []) {
      if (strategy.type === 'list' && strategy.classes) {
        allOptions.push(...strategy.classes.map((cls) => ({
          value: cls.class,
          label: cls.label || cls.class,
        })));
      } else if (strategy.type === 'generative' && strategy.generative) {
        const dataset = (datasets as DatasetsType)[strategy.generative.dataset];
        if (dataset) {
          const generatedOptions = dataset.map((item: DatasetItem) => ({
            value: strategy.generative!.template.replace('{value}', item.class),
            label: item.label || item.class,
          }));
          allOptions.push(...generatedOptions);
        }
      } else if (strategy.type === 'arbitrary' && strategy.arbitrary) {
        supportsArb = true;
        arbTemplate = strategy.arbitrary.template;
      }
    }

    return { options: allOptions, supportsArbitrary: supportsArb, arbitraryTemplate: arbTemplate };
  }, [definition]);

  const { currentValue, currentArbitraryValue } = useMemo(() => {
    if (!definition || !selectedNode) {
      return { currentValue: null, currentArbitraryValue: null };
    }

    const currentClass = selectedNode.utilityClassState?.[definition.category] || '';

    if (!currentClass) return { currentValue: null, currentArbitraryValue: null };

    // Strip modifiers
    const stripModifiers = (c: string) => (c.includes(':') ? c.split(':').pop() || c : c);
    const cls = stripModifiers(currentClass);

    // Check if it's an arbitrary value
    if (arbitraryTemplate) {
      const pattern = `^${arbitraryTemplate.replace('{value}', '\\[(.+)\\]')}$`;
      const match = cls.match(new RegExp(pattern));
      if (match) {
        return { currentValue: null, currentArbitraryValue: match[1] };
      }
    }

    // Check if it's a preset
    const preset = options.find(opt => opt.value === cls);
    if (preset) {
      return { currentValue: cls, currentArbitraryValue: null };
    }

    // Fallback
    return { currentValue: cls, currentArbitraryValue: null };
  }, [selectedNode, definition, options, arbitraryTemplate]);

  const setValue = (className: string | null) => {
    if (!definition || !selectedNode) return;
    const finalClass = className ? modifierPrefix + className : null;
    updateUtilityClass(selectedNode.id, definition.category, finalClass);
  };

  const setArbitraryValue = (arbitraryValue: string | null) => {
    if (!definition || !selectedNode) return;
    if (!arbitraryValue || !arbitraryTemplate) {
      updateUtilityClass(selectedNode.id, definition.category, null);
      return;
    }

    const finalClass = modifierPrefix + arbitraryTemplate.replace('{value}', `[${arbitraryValue}]`);
    updateUtilityClass(selectedNode.id, definition.category, finalClass);
  };

  return { options, currentValue, currentArbitraryValue, setValue, setArbitraryValue, supportsArbitrary };
}