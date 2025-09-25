import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import datasets from '../../../lib/definitions/datasets.json';

type DatasetOption = { class: string; value: string; label?: string };
type DatasetsType = Record<string, DatasetOption[]>;

interface GradientEditorProps {
  definition: {
    category: string;
    label: string;
    description: string;
    strategies: Array<{
      type: 'list' | 'generative' | 'arbitrary';
      classes?: Array<{ class: string; value: string; label?: string }>;
      generative?: {
        template: string;
        dataset: string;
      };
      arbitrary?: {
        template: string;
      };
    }>;
  };
  selectedNode: SerializableElement;
  modifierPrefix?: string;
}

/**
 * GradientEditor component for creating and editing CSS gradient backgrounds and masks.
 *
 * This component provides an interface for selecting predefined gradient directions
 * and entering custom gradient values. It supports both background-image and mask-image
 * properties with arbitrary gradient syntax support.
 *
 * Key features:
 * - Predefined gradient direction options (linear, radial, conic)
 * - Custom gradient input with validation
 * - Real-time utility state synchronization
 * - Support for modifier prefixes
 * - Arbitrary gradient value support
 *
 * The component handles the complexity of gradient CSS syntax while providing
 * an intuitive interface for gradient creation in the visual editor.
 *
 * @component
 * @param {GradientEditorProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata
 * @param {string} props.definition.category - The gradient property category (e.g., 'backgroundImage', 'maskImage')
 * @param {string} props.definition.label - Display label for the gradient editor control
 * @param {string} props.definition.description - Descriptive text explaining gradient editing functionality
 * @param {Array<{class: string, value: string}>} props.definition.classes - Array of available Tailwind gradient classes
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @returns {JSX.Element} The rendered GradientEditor component with gradient selection interface
 */
export const GradientEditor: React.FC<GradientEditorProps> = ({
  definition,
  selectedNode,
  modifierPrefix = '',
}) => {
  const { updateUtilityClass } = useComponentStore();
  const [customValue, setCustomValue] = useState('');

  // Extract current gradient from utility state
  const currentValue = selectedNode.utilityClassState?.[definition.category] || '';

  // Resolve options from strategies
  const resolvedClasses = useMemo(() => {
    const allClasses: DatasetOption[] = [];

    for (const strategy of definition.strategies) {
      if (strategy.type === 'list' && strategy.classes) {
        allClasses.push(...strategy.classes);
      } else if (strategy.type === 'generative' && strategy.generative) {
        const dataset = (datasets as DatasetsType)[strategy.generative.dataset];
        if (dataset) {
          const generatedClasses = dataset.map((item: DatasetOption) => {
            // Apply the template to create the final class name
            const finalClassName = strategy.generative!.template.replace('{value}', item.class);
            
            return {
              class: finalClassName,
              value: item.value,
              label: item.label,
            };
          });
          allClasses.push(...generatedClasses);
        }
      }
      // Skip arbitrary strategies for gradient options
    }

    return allClasses;
  }, [definition.strategies]);

  /**
   * Handles predefined gradient selection and updates the component's utility state.
   * 
   * This function applies a selected gradient class to the component, supporting
   * modifier prefixes for responsive or state-based styling.
   * 
   * @param {string} gradientClass - The selected gradient class name
   * @returns {void}
   */
  const handleGradientSelect = (gradientClass: string) => {
    const finalClass = gradientClass ? modifierPrefix + gradientClass : null;
    updateUtilityClass(selectedNode.id, definition.category, finalClass);
  };

  /**
   * Handles custom gradient input and applies arbitrary gradient value.
   * 
   * This function processes custom gradient CSS and creates an arbitrary Tailwind
   * class for complex gradient definitions that aren't covered by predefined classes.
   * 
   * @returns {void}
   */
  const handleCustomGradient = () => {
    if (customValue.trim()) {
      // Create arbitrary class for custom gradient
      const arbitraryClass = `${definition.category}-[${customValue.trim()}]`;
      const finalClass = modifierPrefix + arbitraryClass;
      updateUtilityClass(selectedNode.id, definition.category, finalClass);
      setCustomValue('');
    }
  };

  // Filter classes to show only gradient-related ones
  const gradientClasses = resolvedClasses.filter((cls: DatasetOption) =>
    cls.class.includes('linear') ||
    cls.class.includes('radial') ||
    cls.class.includes('conic') ||
    cls.class === 'bg-none'
  );  return (
    <div className="space-y-3">
      {/* Predefined Gradients */}
      <div className="grid grid-cols-2 gap-2">
        {gradientClasses.map((gradient) => (
          <Button
            key={gradient.class}
            variant={currentValue === gradient.class ? "default" : "outline"}
            size="sm"
            onClick={() => handleGradientSelect(gradient.class)}
            className="text-xs h-8"
          >
            {gradient.label || gradient.class}
          </Button>
        ))}
      </div>

      {/* Custom Gradient Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="e.g., linear-gradient(to right, #ff0000, #0000ff)"
            className="text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomGradient();
            }}
          />
          <Button onClick={handleCustomGradient} size="sm" className="px-3">
            Apply
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter custom CSS gradient syntax for advanced gradients
        </p>
      </div>

      {/* Clear Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleGradientSelect('')}
        className="w-full text-xs"
      >
        Clear Gradient
      </Button>
    </div>
  );
};