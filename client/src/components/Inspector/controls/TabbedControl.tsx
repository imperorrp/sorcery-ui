import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SerializableElement } from '@/store/componentStore';
import { useControlData } from '@/hooks/useControlData';
import {
  SelectControl,
  BoxModelEditor,
  ColorPicker,
  Slider,
  ShadowEditor,
  Toggle,
  SmartSegmentedControl,
  SizeInput,
  TextInput,
  NumberInput,
} from './index';

// Control map to connect control.type strings to React components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const controlMap: Record<string, React.ComponentType<any>> = {
  'Select': SelectControl,
  'BoxModelEditor': BoxModelEditor,
  'ColorPicker': ColorPicker,
  'Slider': Slider,
  'ShadowEditor': ShadowEditor,
  'Toggle': Toggle,
  'SegmentedControl': SmartSegmentedControl,
  'SizeInput': SizeInput,
  'TextInput': TextInput,
  'NumberInput': NumberInput,
};

interface ControlDefinition {
  category: string;
  label: string;
  description: string;
  group: string;
  control?: {
    type: string;
    [key: string]: unknown;
  };
  controls?: Array<{
    type: string;
    strategy?: string;
    [key: string]: unknown;
  }>;
  strategies?: Array<{
    type: string;
    classes?: Array<{ class: string; value?: string; label?: string }>;
    generative?: { template: string; dataset: string };
    arbitrary?: { template: string };
  }>;
  classes?: Array<{ class: string; value?: string; label?: string }> | { "$ref": string };
  modifiers?: string[];
  supportsArbitrary?: boolean;
  structuralVariants?: Array<{ label: string; template: string }>;
  docUrl?: string;
}

interface TabbedControlProps {
  definition: ControlDefinition; // Single definition with strategies
  selectedNode: SerializableElement;
  modifierPrefix?: string;
}

/**
 * TabbedControl Component - Handles hybrid utilities with multiple strategies
 *
 * This component renders a tabbed interface for utilities that support multiple
 * input strategies (e.g., presets/list + custom/arbitrary values). It provides
 * a clean, dense UI that switches between different control types based on
 * the active tab.
 *
 * Features:
 * - Tab-based switching between strategies (Presets/Custom, etc.)
 * - Dynamic control rendering based on strategy type
 * - Maintains consistent modifier prefix support
 * - Handles list, generative, and arbitrary strategies
 *
 * @param {ControlDefinition[]} controlDefinitions - Array of control definitions for different strategies
 * @param {SerializableElement} selectedNode - The currently selected element
 * @param {string} modifierPrefix - Optional modifier prefix for class generation
 * @returns {JSX.Element} The rendered TabbedControl component
 */
export const TabbedControl: React.FC<TabbedControlProps> = ({
  definition,
  selectedNode,
  modifierPrefix = ''
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Use the control data hook
  const {
    options,
    currentValue,
    currentArbitraryValue,
    setValue,
    setArbitraryValue,
    supportsArbitrary
  } = useControlData(definition, selectedNode, modifierPrefix);

  // Get strategies from the definition
  const strategies = definition.strategies || [];
  const hasArbitrary = strategies.some(s => s.type === 'arbitrary');

  // Create tabs: one for presets (list/generative) and one for arbitrary if supported
  const tabs: Array<{ label: string; type: string }> = [];
  if (strategies.some(s => s.type === 'list' || s.type === 'generative')) {
    tabs.push({ label: 'Presets', type: 'presets' });
  }
  if (hasArbitrary) {
    tabs.push({ label: 'Custom', type: 'arbitrary' });
  }

  // Generate tab labels
  const getTabLabel = (tab: { label: string; type: string }) => tab.label;

  // Determine which control to render based on active tab
  const renderControl = () => {
    const activeTabInfo = tabs[activeTab];

    if (activeTabInfo.type === 'presets') {
      // Use the main control for presets
      const ControlComponent = controlMap[definition.control?.type || ''];
      if (!ControlComponent) {
        return (
          <div className="text-xs p-2 bg-red-100 rounded">
            Control '{definition.control?.type}' for '{definition.label}' is not yet implemented.
          </div>
        );
      }

      // Create definition with preset classes
      const presetStrategies = strategies.filter(s => s.type === 'list' || s.type === 'generative');
      const presetDefinition = {
        ...definition,
        classes: presetStrategies.flatMap(s => s.classes || []),
        strategies: presetStrategies,
      };

      return (
        <ControlComponent
          definition={presetDefinition}
          selectedNode={selectedNode}
          modifierPrefix={modifierPrefix}
          {...(definition.control || {})}
        />
      );
    } else if (activeTabInfo.type === 'arbitrary') {
      // Use TextInput for arbitrary values
      return (
        <TextInput
          options={options}
          value={currentValue}
          arbitraryValue={currentArbitraryValue}
          onChange={setValue}
          onArbitraryChange={setArbitraryValue}
          supportsArbitrary={supportsArbitrary}
          placeholder={`Enter custom value for ${definition.label.toLowerCase()}`}
        />
      );
    }

    return null;
  };

  // If no tabs, just render the main control
  if (tabs.length === 0) {
    const ControlComponent = controlMap[definition.control?.type || ''];
    if (!ControlComponent) {
      return (
        <div className="text-xs p-2 bg-red-100 rounded">
          Control '{definition.control?.type}' for '{definition.label}' is not yet implemented.
        </div>
      );
    }

    return (
      <ControlComponent
        definition={definition}
        selectedNode={selectedNode}
        modifierPrefix={modifierPrefix}
        {...(definition.control || {})}
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Tab Switcher */}
      <div className="flex bg-muted rounded-md p-1">
        {tabs.map((tab, index) => (
          <Button
            key={index}
            variant={activeTab === index ? "default" : "ghost"}
            size="sm"
            className="flex-1 text-xs h-7"
            onClick={() => setActiveTab(index)}
          >
            {getTabLabel(tab)}
          </Button>
        ))}
      </div>

      {/* Active Control */}
      <div>
        {renderControl()}
      </div>
    </div>
  );
};
