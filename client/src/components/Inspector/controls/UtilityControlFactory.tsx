import React from 'react';
import { BoxModelControl } from './BoxModelControl';
import { BorderRadiusControl } from './BorderRadiusControl';
import { BorderWidthControl } from './BorderWidthControl';
import { SelectControl } from './SelectControl';
import { BoxModelEditor } from './BoxModelEditor';
import { ColorPicker } from './ColorPicker';
import { ThemeColorPicker } from './ThemeColorPicker';
import { Slider } from './Slider';
import { ShadowEditor } from './ShadowEditor';
import { Toggle } from './Toggle';
import { SmartSegmentedControl } from './SegmentedControl';
import { SizeInput } from './SizeInput';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { GradientEditor } from './GradientEditor';
import { ComboBoxWithSlider } from './ComboBoxWithSlider';
import { useControlData } from '@/hooks/useControlData';
import { useComponentStore } from '@/store/componentStore';
import { resolveTheme } from '@/lib/themeUtils';
import type { SerializableElement } from '@/store/componentStore';

interface ControlVariant {
  label: string;
  prefix: string;
  template: string;
  supportsNegative: boolean;
}

interface ControlDefinition {
  category: string;
  label: string;
  description: string;
  group: string;
  control?: {
    type: string;
    [key: string]: unknown;
  };
  variants?: ControlVariant[];
  valueSets?: Array<{
    type: string;
    options?: Array<{ class: string; value?: string; label?: string }>;
    source?: string;
    examples?: string[];
    typeHint?: string;
    placeholder?: string;
  }>;
  docUrl?: string;
  notes?: string;
  supportsArbitrary?: boolean;
}

interface UtilityControlFactoryProps {
  definition: ControlDefinition;
  selectedNode: SerializableElement;
  modifierPrefix?: string;
}

/**
 * Maps Tailwind inspector control types to their corresponding React components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const controlComponentMap: Record<string, React.ComponentType<any>> = {
  Select: SelectControl,
  BoxModelEditor: BoxModelEditor,
  ColorPicker,
  Slider,
  ShadowEditor,
  Toggle,
  SegmentedControl: SmartSegmentedControl,
  SizeInput,
  TextInput,
  NumberInput,
  GradientEditor,
  ComboBoxWithSlider,
};

const ensureVariants = (definition: ControlDefinition): ControlVariant[] => {
  if (definition.variants && definition.variants.length > 0) {
    return definition.variants;
  }
  return [
    {
      label: 'Default',
      prefix: '',
      template: '{value}',
      supportsNegative: false,
    },
  ];
};

/**
 * SingleVariantControl component - Renders a concrete control for a specific variant.
 *
 * @param props.definition - The overall control definition
 * @param props.variant - Variant metadata describing template and label
 * @param props.selectedNode - The currently selected node in the inspector tree
 * @param props.modifierPrefix - Optional modifier prefix to prepend to generated classes
 */
const SingleVariantControl: React.FC<{
  definition: ControlDefinition;
  variant: ControlVariant;
  selectedNode: SerializableElement;
  modifierPrefix?: string;
}> = ({ definition, variant, selectedNode, modifierPrefix = '' }) => {
  const {
    options,
    currentValue,
    currentArbitraryValue,
    currentOpacity,
    setValue,
    setArbitraryValue,
    supportsArbitrary,
  } = useControlData(definition, variant, selectedNode, modifierPrefix);

  // Resolve theme for live previews
  const tailwindConfig = useComponentStore((state) => state.tailwindConfig);
  const resolvedTheme = React.useMemo(() => resolveTheme(tailwindConfig), [tailwindConfig]);

  // Note: theme resolution is now handled inside ThemeColorPicker
  const swatchTemplate = variant?.template;

  const controlDefinition = definition.control;

  if (!controlDefinition) {
    return (
      <div className="text-xs p-2 bg-red-100 dark:bg-red-900/50 rounded">
        No control defined for '{definition.label}'
      </div>
    );
  }

  const ControlComponent = controlComponentMap[controlDefinition.type];

  if (!ControlComponent) {
    return (
      <div className="text-xs p-2 bg-red-100 dark:bg-red-900/50 rounded">
        Control '{controlDefinition.type}' for '{definition.label}' is not yet implemented.
      </div>
    );
  }

  // Extract suggestionsSource and typeHint for components that need them
  const suggestionsValueSet = definition.valueSets?.find(vs => vs.type === 'suggestions');
  const arbitraryValueSet = definition.valueSets?.find(vs => vs.type === 'arbitrary');
  const suggestionsSource = suggestionsValueSet?.source;
  const typeHint = arbitraryValueSet?.typeHint;
  const examples = suggestionsValueSet?.examples || arbitraryValueSet?.examples || [];
  const placeholder = arbitraryValueSet?.placeholder || controlDefinition.placeholder || '';

  const colorPreviewProps = controlDefinition.type === 'ColorPicker'
    ? {
        previewKind: (definition.category.includes('text')
          ? 'text'
          : definition.category.includes('outline')
          ? 'outline'
          : definition.category.includes('caret')
          ? 'caret'
          : definition.category.includes('border')
          ? 'border'
          : 'background') as 'text' | 'background' | 'border' | 'outline' | 'caret',
        // ThemeColorPicker handles colors internally, so don't pass colors here
        swatchTemplate: swatchTemplate,
        options: options, // Pass keyword options to ColorPicker
        placeholder: typeof placeholder === 'string' ? placeholder : undefined, // Pass the placeholder from arbitrary valueSet
      }
    : {};

  const sliderProps = controlDefinition.type === 'Slider' && suggestionsSource
    ? { suggestionsSource, examples, placeholder }
    : {};

  const comboBoxProps = (controlDefinition.type === 'ComboBoxWithSlider' || controlDefinition.type === 'Slider') && (suggestionsSource || typeHint)
    ? { suggestionsSource, typeHint, examples, placeholder, resolvedTheme }
    : (controlDefinition.type === 'ComboBoxWithSlider' ? { resolvedTheme } : {});

  const segmentedProps = controlDefinition.type === 'SegmentedControl' ? { resolvedTheme } : {};

  // Special handling for ColorPicker to use ThemeColorPicker
  if (controlDefinition.type === 'ColorPicker') {
    const onOpacityChange = (opacity: number | null) => {
      if (currentValue) {
        setValue(currentValue, opacity);
      } else if (currentArbitraryValue) {
        setArbitraryValue(currentArbitraryValue, opacity);
      }
    };

    return (
      <div>
        <ThemeColorPicker
          options={options}
          value={currentValue}
          arbitraryValue={currentArbitraryValue}
          onChange={setValue}
          onArbitraryChange={setArbitraryValue}
          supportsArbitrary={supportsArbitrary}
          currentOpacity={currentOpacity}
          onOpacityChange={onOpacityChange}
          {...colorPreviewProps}
        />
      </div>
    );
  }

  return (
    <div>
      <ControlComponent
        options={options}
        value={currentValue}
        arbitraryValue={currentArbitraryValue}
        onChange={setValue}
        onArbitraryChange={setArbitraryValue}
        supportsArbitrary={supportsArbitrary}
        placeholder={placeholder} // Pass placeholder to all controls
        resolvedTheme={resolvedTheme}
        {...colorPreviewProps}
        {...sliderProps}
        {...comboBoxProps}
        {...segmentedProps}
        {...controlDefinition}
      />
    </div>
  );
};

/**
 * UtilityControlFactory component - Chooses the correct control rendering strategy for a utility definition.
 *
 * This factory component dynamically creates appropriate control components based on Tailwind utility
 * definitions. It supports multiple rendering strategies:
 *
 * - Special compound controls (e.g., BoxModelControl for margin/padding combinations)
 * - Simple controls with a single variant (most common case)
 * - Multi-variant controls rendered side-by-side within a flexible layout
 * - Theme-aware controls with resolved color palettes and configuration
 *
 * The component integrates with the control data hook for state management and provides
 * consistent interfaces for all control types including sliders, color pickers, segmented controls,
 * and specialized editors for complex properties like shadows and gradients.
 *
 * @param definition - The Tailwind utility definition containing control metadata
 * @param selectedNode - The currently selected DOM node for applying changes
 * @param modifierPrefix - Optional modifier prefix (e.g., 'hover:', 'md:') to prepend to classes
 * @returns The rendered control component appropriate for the definition type
 */
export const UtilityControlFactory: React.FC<UtilityControlFactoryProps> = ({
  definition,
  selectedNode,
  modifierPrefix = '',
}) => {
  const controlDefinition = definition.control;
  const variants = ensureVariants(definition);

  if (!controlDefinition) {
    return (
      <div className="text-xs p-2 bg-red-100 rounded">
        No control defined for '{definition.label}'
      </div>
    );
  }

  if (controlDefinition.type === 'BoxModelEditor') {
    return (
      <div>
        <BoxModelControl
          definition={definition}
          selectedNode={selectedNode}
          modifierPrefix={modifierPrefix}
        />
      </div>
    );
  }

  if (definition.label === 'borderRadius' && controlDefinition.type === 'ComboBoxWithSlider') {
    return (
      <div>
        <BorderRadiusControl
          definition={definition}
          selectedNode={selectedNode}
          modifierPrefix={modifierPrefix}
        />
      </div>
    );
  }

  if (definition.label === 'borderWidth' && controlDefinition.type === 'ComboBoxWithSlider') {
    return (
      <div>
        <BorderWidthControl
          definition={definition}
          selectedNode={selectedNode}
          modifierPrefix={modifierPrefix}
        />
      </div>
    );
  }

  if (variants.length === 1) {
    return (
      <SingleVariantControl
        definition={definition}
        variant={variants[0]}
        selectedNode={selectedNode}
        modifierPrefix={modifierPrefix}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
        {variants.map((variant) => (
          <div key={variant.label} className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
              {variant.label}
            </span>
            <div className="min-w-0">
              <SingleVariantControl
                definition={definition}
                variant={variant}
                selectedNode={selectedNode}
                modifierPrefix={modifierPrefix}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
