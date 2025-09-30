import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useControlData } from '@/hooks/useControlData';
import type { SerializableElement } from '@/store/componentStore';

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
  const { options, currentValue, setValue, setArbitraryValue } = useControlData(
    definition,
    selectedNode,
    modifierPrefix
  );
  const [customValue, setCustomValue] = useState('');

  /**
   * Handles predefined gradient selection.
   */
  const handleGradientSelect = (gradientClass: string) => {
    setValue(gradientClass);
  };

  /**
   * Handles custom gradient input.
   */
  const handleCustomGradient = () => {
    if (customValue.trim()) {
      setArbitraryValue(customValue.trim());
      setCustomValue('');
    }
  };

  // Filter classes to show only gradient-related ones
  const gradientClasses = options.filter((option) =>
    option.value.includes('linear') ||
    option.value.includes('radial') ||
    option.value.includes('conic') ||
    option.value === 'bg-none'
  );  return (
    <div className="space-y-3">
      {/* Predefined Gradients */}
      <div className="grid grid-cols-2 gap-2">
        {gradientClasses.map((gradient) => (
          <Button
            key={gradient.value}
            variant={currentValue === gradient.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleGradientSelect(gradient.value)}
            className="text-xs h-8"
          >
            {gradient.label || gradient.value}
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