import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import datasets from '../../../lib/definitions/datasets.json';

type DatasetOption = { class: string; value: string; label?: string };
type DatasetsType = Record<string, DatasetOption[]>;
import { ChevronDown, Settings } from 'lucide-react';

interface SizeInputProps {
  definition: {
    category: string;
    label: string;
    description: string;
    strategies: Array<{
      type: 'list' | 'generative' | 'arbitrary';
        classes?: Array<{ class: string; value?: string; label?: string }>;
      generative?: {
        template: string;
        dataset: string;
      };
      arbitrary?: {
        template: string;
      };
    }>;
    structuralVariants?: Array<{
      label: string;
      template: string;
    }>;
  };
  selectedNode: SerializableElement;
  modifierPrefix?: string;
}

/**
 * SizeInput component for flexible size value input with automatic Tailwind class generation.
 * 
 * This component provides an intelligent interface for size-related CSS properties
 * with both predefined options and custom input capabilities. It automatically
 * converts user input into appropriate Tailwind utility classes while supporting various
 * input formats and providing visual feedback.
 * 
 * Key features:
 * - Dropdown with predefined size options from strategies
 * - Custom input for arbitrary values with smart parsing
 * - Visual feedback showing current value and applied class
 * - Support for generative strategies with template application
 * - Intelligent value extraction and display
 * - Placeholder examples and validation
 * 
 * The component handles the complexity of mapping between user-friendly size inputs
 * and Tailwind's naming conventions, making it easy to work with dimensional properties
 * in the visual editor while maintaining consistency with the design system.
 * 
 * @component
 * @param {SizeInputProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata and size options
 * @param {string} props.definition.category - The size property category (e.g., 'width', 'height', 'minWidth', 'maxHeight')
 * @param {string} props.definition.label - Display label for the size input control
 * @param {string} props.definition.description - Descriptive text explaining the size control's purpose
 * @param {Array} props.definition.strategies - Array of strategy objects defining available size options
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @returns {JSX.Element} The rendered SizeInput component with intelligent size input handling
 */
export const SizeInput: React.FC<SizeInputProps> = ({
  definition,
  selectedNode,
  modifierPrefix = '',
}) => {
  const { updateUtilityClass } = useComponentStore();
  const [customValue, setCustomValue] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isNegative, setIsNegative] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string>('');

  // Determine if this definition has structural variants
  const hasStructuralVariants = definition.structuralVariants && definition.structuralVariants.length > 0;

  // Extract current value and variant from utility state
  const currentClass = selectedNode.utilityClassState?.[definition.category] || '';
  const { currentValue, currentVariant, negative } = useMemo(() => {
    if (!currentClass) return { currentValue: '', currentVariant: '', negative: false };
    
    // If no structural variants, use the original logic
    if (!hasStructuralVariants) {
      // Strip any modifier prefixes like "hover:", "md:" etc
      const stripModifiers = (c: string) => (c.includes(':') ? c.split(':').pop() || c : c);
      let cls = stripModifiers(currentClass);
      let neg = false;
      if (cls.startsWith('-')) {
        neg = true;
        cls = cls.slice(1);
      }

      // 1) Try to match a list strategy class exactly (e.g., "z-10")
  const listStrategy = definition.strategies.find((s): s is { type: 'list'; classes: Array<{ class: string; value?: string; label?: string }> } => s.type === 'list' && Array.isArray(s.classes) && s.classes.length > 0);
      if (listStrategy?.classes) {
        const found = listStrategy.classes.find(opt => opt.class === cls);
        if (found) {
          return { currentValue: found.label || found.class, currentVariant: '', negative: neg };
        }
      }

      // 2) Try to match an arbitrary template (e.g., template: "z-{value}" expects class like "z-[123]")
  const arbitraryStrategy = definition.strategies.find((s): s is { type: 'arbitrary'; arbitrary: { template: string } } => s.type === 'arbitrary' && !!s.arbitrary && typeof s.arbitrary.template === 'string');
      if (arbitraryStrategy) {
        const pattern = `^${arbitraryStrategy.arbitrary.template.replace('{value}', '\\[(.+)\\]')}$`;
        const match = cls.match(new RegExp(pattern));
        if (match) {
          return { currentValue: match[1], currentVariant: '', negative: neg };
        }
      }

      // 3) Try to match a generative template (e.g., "w-{value}")
  const generativeStrategy = definition.strategies.find((s): s is { type: 'generative'; generative: { template: string; dataset: string } } => s.type === 'generative' && !!s.generative && typeof s.generative.template === 'string' && typeof s.generative.dataset === 'string');
      if (generativeStrategy) {
        const pattern = `^${generativeStrategy.generative.template.replace('{value}', '(.+)')}$`;
        const match = cls.match(new RegExp(pattern));
        if (match) {
          return { currentValue: match[1], currentVariant: '', negative: neg };
        }
      }

      // Fallback: return remaining class fragment
      return { currentValue: cls, currentVariant: '', negative: neg };
    }

    // With structural variants, detect which variant is being used
    const stripModifiers = (c: string) => (c.includes(':') ? c.split(':').pop() || c : c);
    let cls = stripModifiers(currentClass);
    let neg = false;
    if (cls.startsWith('-')) {
      neg = true;
      cls = cls.slice(1);
    }

    for (const variant of definition.structuralVariants!) {
      const template = variant.template; // e.g., "top-{value}", "inset-{value}"
      const baseTemplate = template.replace('{value}', '');
      
      if (cls.startsWith(baseTemplate)) {
        const value = cls.slice(baseTemplate.length);
        return { currentValue: value, currentVariant: variant.label, negative: neg };
      }
      
      // Handle arbitrary values
      const arbitraryPattern = template.replace('{value}', '\\[(.+)\\]');
      const arbitraryMatch = cls.match(new RegExp(arbitraryPattern));
      if (arbitraryMatch) {
        return { currentValue: arbitraryMatch[1], currentVariant: variant.label, negative: neg };
      }
    }
    
    return { currentValue: '', currentVariant: '', negative: neg };
  }, [currentClass, hasStructuralVariants, definition.structuralVariants, definition.strategies]);

  // Sync negative state with parsed class when selection changes
  React.useEffect(() => {
    setIsNegative(negative);
  }, [negative]);

  // Set initial variant if not set and we have current variant
  React.useEffect(() => {
    if (hasStructuralVariants && !selectedVariant && currentVariant) {
      setSelectedVariant(currentVariant);
    } else if (hasStructuralVariants && !selectedVariant && definition.structuralVariants!.length > 0) {
      setSelectedVariant(definition.structuralVariants![0].label);
    }
  }, [hasStructuralVariants, selectedVariant, currentVariant, definition.structuralVariants]);

  // Resolve options from strategies and selected variant
  const sizeOptions = useMemo(() => {
    const allOptions: Array<{ class: string; value: string; label?: string }> = [];

    // Get the template to use (from selected variant or main strategy)
    let templateToUse = '';
    if (hasStructuralVariants && selectedVariant) {
      const variant = definition.structuralVariants!.find(v => v.label === selectedVariant);
      if (variant) {
        templateToUse = variant.template;
      }
    } else {
      // Use the main strategy template
      const mainStrategy = definition.strategies.find(s => s.type === 'generative');
      if (mainStrategy?.generative) {
        templateToUse = mainStrategy.generative.template;
      }
    }

    for (const strategy of definition.strategies) {
      if (strategy.type === 'list' && strategy.classes) {
        if (templateToUse) {
          // Apply template when a structural/generative template is in play
          const templatedOptions = strategy.classes.map((cls) => ({
            class: templateToUse.replace('{value}', cls.class),
            value: cls.value ?? '',
            label: cls.label ?? cls.class,
          }));
          allOptions.push(...templatedOptions);
        } else {
          // No template: use provided classes as-is (e.g., z-index)
          const directOptions = strategy.classes.map((cls) => ({
            class: cls.class,
            value: cls.value ?? '',
            label: cls.label ?? cls.class,
          }));
          allOptions.push(...directOptions);
        }
      } else if (strategy.type === 'generative' && strategy.generative) {
        if (!templateToUse) continue; // cannot generate without a template
        const dataset = (datasets as DatasetsType)[strategy.generative.dataset];
        if (dataset) {
          const generatedOptions = dataset.map((item: { class: string; value: string; label?: string }) => ({
            class: templateToUse.replace('{value}', item.class),
            value: item.value,
            label: item.label,
          }));
          allOptions.push(...generatedOptions);
        }
      }
      // Skip arbitrary strategies for dropdown options
    }

    return allOptions;
  }, [definition.strategies, hasStructuralVariants, selectedVariant, definition.structuralVariants]);

  /**
   * Handles selection of structural variant.
   * 
   * @param {string} variantLabel - The selected variant label
   */
  const handleVariantSelect = (variantLabel: string) => {
    setSelectedVariant(variantLabel);
    // Clear current value when changing variants
    updateUtilityClass(selectedNode.id, definition.category, null);
    // Reset custom mode when changing variant
    setIsCustomMode(false);
  };

  /**
   * Handles selection of predefined size options.
   * 
   * @param {string} selectedClass - The selected size class name
   */
  const handlePresetSelect = (selectedClass: string) => {
    if (!selectedClass) {
      updateUtilityClass(selectedNode.id, definition.category, null);
      return;
    }

    // Do not apply negative to "auto" values
    const isAuto = /-auto$/.test(selectedClass);
    const classWithSign = isNegative && !isAuto ? `-${selectedClass}` : selectedClass;
    const finalClass = modifierPrefix ? `${modifierPrefix}${classWithSign}` : classWithSign;
    updateUtilityClass(selectedNode.id, definition.category, finalClass);
    setIsCustomMode(false);
  };

  /**
   * Handles custom size input and creates arbitrary classes.
   * 
   * @param {string} value - The custom size value
   */
  const handleCustomInput = (value: string) => {
    setCustomValue(value);
    
    if (value.trim() && selectedVariant && hasStructuralVariants) {
      // Find the selected variant
      const variant = definition.structuralVariants!.find(v => v.label === selectedVariant);
      if (variant) {
        // Create arbitrary class using the variant's template
        const arbitraryBase = variant.template.replace('{value}', `[${value.trim()}]`);
        const arbitraryClass = isNegative ? `-${arbitraryBase}` : arbitraryBase;
        const finalClass = modifierPrefix ? `${modifierPrefix}${arbitraryClass}` : arbitraryClass;
        updateUtilityClass(selectedNode.id, definition.category, finalClass);
      }
    } else if (value.trim()) {
      // Non-structural case: prefer explicit arbitrary template, else generative, else fallback
  const arbitraryStrategy = definition.strategies.find((s): s is { type: 'arbitrary'; arbitrary: { template: string } } => s.type === 'arbitrary' && !!s.arbitrary && typeof s.arbitrary.template === 'string');
      if (arbitraryStrategy) {
        const arbitraryBase = arbitraryStrategy.arbitrary.template.replace('{value}', `[${value.trim()}]`);
        const finalClass = modifierPrefix ? `${modifierPrefix}${arbitraryBase}` : arbitraryBase;
        updateUtilityClass(selectedNode.id, definition.category, finalClass);
      } else {
        const generativeStrategy = definition.strategies.find((s): s is { type: 'generative'; generative: { template: string; dataset: string } } => s.type === 'generative' && !!s.generative && typeof s.generative.template === 'string' && typeof s.generative.dataset === 'string');
        if (generativeStrategy) {
          const base = generativeStrategy.generative.template.replace('{value}', value.trim());
          const finalClass = modifierPrefix ? `${modifierPrefix}${base}` : base;
          updateUtilityClass(selectedNode.id, definition.category, finalClass);
        } else {
          // Fallback if no templates available
          const arbitraryBase = `${definition.category}-[${value.trim()}]`;
          const finalClass = modifierPrefix ? `${modifierPrefix}${arbitraryBase}` : arbitraryBase;
          updateUtilityClass(selectedNode.id, definition.category, finalClass);
        }
      }
    } else {
      // Clear the value
      updateUtilityClass(selectedNode.id, definition.category, null);
    }
  };

  /**
   * Toggles between preset and custom input modes.
   */
  const toggleMode = () => {
    setIsCustomMode(!isCustomMode);
    if (!isCustomMode) {
      // Switching to custom mode, populate with current value
      setCustomValue(currentValue);
    }
  };

  // Determine placeholder and help text based on the control type and strategies
  const placeholderText = useMemo(() => {
    // If structural variants and selectedVariant present, we usually expect CSS size tokens
    const arbitraryStrategy = definition.strategies.find((s): s is { type: 'arbitrary'; arbitrary: { template: string } } => s.type === 'arbitrary' && !!s.arbitrary && typeof s.arbitrary.template === 'string');
    const generativeStrategy = definition.strategies.find((s): s is { type: 'generative'; generative: { template: string; dataset: string } } => s.type === 'generative' && !!s.generative && typeof s.generative.template === 'string' && typeof s.generative.dataset === 'string');

    const labelLower = (definition.label || '').toLowerCase();
    const catLower = (definition.category || '').toLowerCase();

    const isSpacing = generativeStrategy?.generative?.dataset === 'spacing' || /width|height|inset|top|right|bottom|left|gap|translate|size|padding|margin/.test(catLower + ' ' + labelLower);
    const isZIndex = /zindex|z-index/.test(catLower) || /z-index|z index|zindex/.test(labelLower);

    if (isZIndex) return 'e.g., 10';
    if (isSpacing) return 'e.g., 100px, 50%, 2rem';
    // Generic arbitrary case: show a concise example
    if (arbitraryStrategy) return 'e.g., value or 100px';
    // Default
    return 'Enter value';
  }, [definition.strategies, definition.label, definition.category]);

  const helpText = useMemo(() => {
    const labelLower = (definition.label || '').toLowerCase();
    const catLower = (definition.category || '').toLowerCase();
    const arbitraryStrategy = definition.strategies.find((s): s is { type: 'arbitrary'; arbitrary: { template: string } } => s.type === 'arbitrary' && !!s.arbitrary && typeof s.arbitrary.template === 'string');
    const generativeStrategy = definition.strategies.find((s): s is { type: 'generative'; generative: { template: string; dataset: string } } => s.type === 'generative' && !!s.generative && typeof s.generative.template === 'string' && typeof s.generative.dataset === 'string');

    const isSpacing = generativeStrategy?.generative?.dataset === 'spacing' || /width|height|inset|top|right|bottom|left|gap|translate|size|padding|margin/.test(catLower + ' ' + labelLower);
    const isZIndex = /zindex|z-index/.test(catLower) || /z-index|z index|zindex/.test(labelLower);

    if (hasStructuralVariants && !selectedVariant) return 'First select a side or direction above';
    if (!isCustomMode) return 'Choose from presets or click the gear for custom values';
    if (isZIndex) return 'Enter numeric z-index (e.g., 10) or click ▼ for presets';
    if (isSpacing) return 'Enter custom size (px, %, rem, etc.) or click ▼ for presets';
    if (arbitraryStrategy) return `Enter a value for ${arbitraryStrategy.arbitrary.template.replace('{value}', '')} or click ▼ for presets`;
    return 'Enter a custom value or click ▼ for presets';
  }, [definition.strategies, definition.label, definition.category, hasStructuralVariants, selectedVariant, isCustomMode]);

  return (
    <div className="space-y-2">
      {/* Current Value Display */}
      {currentValue && (
        <div className="text-xs text-muted-foreground">
          Current: <code className="bg-muted px-1 rounded">{currentClass || 'none'}</code>
        </div>
      )}

      {/* Structural Variant Selector */}
      {hasStructuralVariants && (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 justify-start text-xs">
                {selectedVariant || 'Select side/direction'}
                <ChevronDown className="ml-auto h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {definition.structuralVariants!.map((variant) => (
                <DropdownMenuItem
                  key={variant.label}
                  onClick={() => handleVariantSelect(variant.label)}
                >
                  {variant.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Negative toggle */}
          <Button
            variant={isNegative ? 'default' : 'outline'}
            size="sm"
            className="px-2"
            title={isNegative ? 'Negative value enabled' : 'Enable negative value'}
            onClick={() => setIsNegative(v => !v)}
          >
            −
          </Button>
        </div>
      )}

      {/* Size Value Controls */}
      {(!hasStructuralVariants || selectedVariant) && (
        <div className="flex gap-2">
          {!isCustomMode ? (
            <>
              {/* Preset Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 justify-start text-xs">
                    {currentValue || 'Select value'}
                    <ChevronDown className="ml-auto h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto">
                  <DropdownMenuItem onClick={() => handlePresetSelect('')}>
                    None
                  </DropdownMenuItem>
                  {sizeOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.class}
                      onClick={() => handlePresetSelect(option.class)}
                    >
                      {option.label || option.class}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Custom Mode Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMode}
                className="px-2"
                title="Custom value"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              {/* Custom Input */}
              <Input
                value={customValue}
                onChange={(e) => handleCustomInput(e.target.value)}
                placeholder={placeholderText}
                className="flex-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomInput(customValue);
                  }
                }}
              />

              {/* Back to Preset Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMode}
                className="px-2"
                title="Preset values"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">{helpText}</div>
    </div>
  );
};