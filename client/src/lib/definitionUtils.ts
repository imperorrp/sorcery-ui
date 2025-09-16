// client/src/lib/definitionUtils.ts

/**
 * Definition Utilities - Helper functions for managing Tailwind control definitions
 *
 * This module provides utilities for grouping, filtering, and working with
 * control definitions used in the definition-driven inspector controls.
 * It includes mock definitions for development and testing purposes.
 */

export interface ControlDefinition {
  category: string;
  label: string;
  description: string;
  uiControl: string;
  group: string;
  classes: Array<{ class: string; value: string; label?: string }>;
  modifiers?: string[];
}

export interface GroupedDefinitions {
  [groupName: string]: ControlDefinition[];
}

/**
 * Groups control definitions by their group property
 *
 * @param definitions - Array of control definitions to group
 * @returns Object with group names as keys and arrays of definitions as values
 */
export function groupDefinitionsByCategory(definitions: ControlDefinition[]): GroupedDefinitions {
  const groups: GroupedDefinitions = {};

  definitions.forEach(definition => {
    const group = definition.group || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(definition);
  });

  return groups;
}

/**
 * Filters definitions based on search query
 *
 * @param definitions - Array of control definitions to filter
 * @param searchQuery - Search string to match against labels, descriptions, categories, and classes
 * @returns Filtered array of control definitions
 */
export function filterDefinitions(
  definitions: ControlDefinition[],
  searchQuery: string
): ControlDefinition[] {
  if (!searchQuery.trim()) {
    return definitions;
  }

  const query = searchQuery.toLowerCase();
  return definitions.filter(definition =>
    definition.label.toLowerCase().includes(query) ||
    definition.description.toLowerCase().includes(query) ||
    definition.category.toLowerCase().includes(query) ||
    definition.classes.some(cls =>
      cls.class.toLowerCase().includes(query) ||
      (cls.label && cls.label.toLowerCase().includes(query))
    )
  );
}

/**
 * Mock definitions for development - replace with actual generated definitions
 */
export const mockDefinitions: ControlDefinition[] = [
  // Layout Group
  {
    category: 'display',
    label: 'Display',
    description: 'Utilities for controlling the display box type of an element.',
    uiControl: 'SegmentedControl',
    group: 'Layout',
    classes: [
      { class: 'block', value: 'block', label: 'Block' },
      { class: 'flex', value: 'flex', label: 'Flex' },
      { class: 'inline', value: 'inline', label: 'Inline' },
      { class: 'inline-block', value: 'inline-block', label: 'Inline Block' },
      { class: 'hidden', value: 'none', label: 'Hidden' },
    ],
  },
  {
    category: 'justifyContent',
    label: 'Justify Content',
    description: 'Utilities for controlling how flex items are positioned along a container\'s main axis.',
    uiControl: 'SegmentedControl',
    group: 'Layout',
    classes: [
      { class: 'justify-start', value: 'flex-start', label: 'Start' },
      { class: 'justify-center', value: 'center', label: 'Center' },
      { class: 'justify-end', value: 'flex-end', label: 'End' },
      { class: 'justify-between', value: 'space-between', label: 'Between' },
      { class: 'justify-around', value: 'space-around', label: 'Around' },
      { class: 'justify-evenly', value: 'space-evenly', label: 'Evenly' },
    ],
  },
  {
    category: 'alignItems',
    label: 'Align Items',
    description: 'Utilities for controlling how flex items are positioned along a container\'s cross axis.',
    uiControl: 'SegmentedControl',
    group: 'Layout',
    classes: [
      { class: 'items-start', value: 'flex-start', label: 'Start' },
      { class: 'items-center', value: 'center', label: 'Center' },
      { class: 'items-end', value: 'flex-end', label: 'End' },
      { class: 'items-baseline', value: 'baseline', label: 'Baseline' },
      { class: 'items-stretch', value: 'stretch', label: 'Stretch' },
    ],
  },

  // Typography Group
  {
    category: 'fontSize',
    label: 'Font Size',
    description: 'Utilities for controlling the font size of an element.',
    uiControl: 'SizeInput',
    group: 'Typography',
    classes: [
      { class: 'text-xs', value: '0.75rem', label: 'Extra Small' },
      { class: 'text-sm', value: '0.875rem', label: 'Small' },
      { class: 'text-base', value: '1rem', label: 'Base' },
      { class: 'text-lg', value: '1.125rem', label: 'Large' },
      { class: 'text-xl', value: '1.25rem', label: 'Extra Large' },
      { class: 'text-2xl', value: '1.5rem', label: '2XL' },
      { class: 'text-3xl', value: '1.875rem', label: '3XL' },
    ],
  },
  {
    category: 'fontWeight',
    label: 'Font Weight',
    description: 'Utilities for controlling the font weight of an element.',
    uiControl: 'SelectControl',
    group: 'Typography',
    classes: [
      { class: 'font-thin', value: '100', label: 'Thin' },
      { class: 'font-light', value: '300', label: 'Light' },
      { class: 'font-normal', value: '400', label: 'Normal' },
      { class: 'font-medium', value: '500', label: 'Medium' },
      { class: 'font-semibold', value: '600', label: 'Semibold' },
      { class: 'font-bold', value: '700', label: 'Bold' },
      { class: 'font-extrabold', value: '800', label: 'Extrabold' },
    ],
  },
  {
    category: 'textAlign',
    label: 'Text Align',
    description: 'Utilities for controlling the alignment of text.',
    uiControl: 'SegmentedControl',
    group: 'Typography',
    classes: [
      { class: 'text-left', value: 'left', label: 'Left' },
      { class: 'text-center', value: 'center', label: 'Center' },
      { class: 'text-right', value: 'right', label: 'Right' },
      { class: 'text-justify', value: 'justify', label: 'Justify' },
    ],
  },

  // Colors Group
  {
    category: 'textColor',
    label: 'Text Color',
    description: 'Utilities for controlling the text color of an element.',
    uiControl: 'ColorPicker',
    group: 'Colors',
    classes: [
      { class: 'text-black', value: '#000000', label: 'Black' },
      { class: 'text-white', value: '#ffffff', label: 'White' },
      { class: 'text-gray-500', value: '#6b7280', label: 'Gray' },
      { class: 'text-red-500', value: '#ef4444', label: 'Red' },
      { class: 'text-blue-500', value: '#3b82f6', label: 'Blue' },
      { class: 'text-green-500', value: '#10b981', label: 'Green' },
    ],
  },
  {
    category: 'backgroundColor',
    label: 'Background Color',
    description: 'Utilities for controlling the background color of an element.',
    uiControl: 'ColorPicker',
    group: 'Colors',
    classes: [
      { class: 'bg-white', value: '#ffffff', label: 'White' },
      { class: 'bg-gray-50', value: '#f9fafb', label: 'Light Gray' },
      { class: 'bg-red-50', value: '#fef2f2', label: 'Light Red' },
      { class: 'bg-blue-50', value: '#eff6ff', label: 'Light Blue' },
      { class: 'bg-green-50', value: '#f0fdf4', label: 'Light Green' },
    ],
  },

  // Spacing Group
  {
    category: 'padding',
    label: 'Padding',
    description: 'Utilities for controlling an element\'s padding.',
    uiControl: 'BoxModelEditor',
    group: 'Spacing',
    classes: [
      { class: 'p-0', value: '0px', label: 'None' },
      { class: 'p-1', value: '0.25rem', label: 'Extra Small' },
      { class: 'p-2', value: '0.5rem', label: 'Small' },
      { class: 'p-3', value: '0.75rem', label: 'Medium' },
      { class: 'p-4', value: '1rem', label: 'Large' },
      { class: 'p-6', value: '1.5rem', label: 'Extra Large' },
      { class: 'p-8', value: '2rem', label: '2XL' },
    ],
  },
  {
    category: 'margin',
    label: 'Margin',
    description: 'Utilities for controlling an element\'s margin.',
    uiControl: 'BoxModelEditor',
    group: 'Spacing',
    classes: [
      { class: 'm-0', value: '0px', label: 'None' },
      { class: 'm-1', value: '0.25rem', label: 'Extra Small' },
      { class: 'm-2', value: '0.5rem', label: 'Small' },
      { class: 'm-4', value: '1rem', label: 'Large' },
      { class: 'm-auto', value: 'auto', label: 'Auto' },
    ],
  },
  {
    category: 'gap',
    label: 'Gap',
    description: 'Utilities for controlling gutters between grid and flexbox items.',
    uiControl: 'SizeInput',
    group: 'Spacing',
    classes: [
      { class: 'gap-0', value: '0px', label: 'None' },
      { class: 'gap-1', value: '0.25rem', label: 'Extra Small' },
      { class: 'gap-2', value: '0.5rem', label: 'Small' },
      { class: 'gap-3', value: '0.75rem', label: 'Medium' },
      { class: 'gap-4', value: '1rem', label: 'Large' },
      { class: 'gap-6', value: '1.5rem', label: 'Extra Large' },
    ],
  },

  // Effects Group
  {
    category: 'opacity',
    label: 'Opacity',
    description: 'Utilities for controlling the opacity of an element.',
    uiControl: 'Slider',
    group: 'Effects',
    classes: [
      { class: 'opacity-0', value: '0', label: 'Transparent' },
      { class: 'opacity-25', value: '0.25', label: '25%' },
      { class: 'opacity-50', value: '0.5', label: '50%' },
      { class: 'opacity-75', value: '0.75', label: '75%' },
      { class: 'opacity-100', value: '1', label: 'Opaque' },
    ],
  },
  {
    category: 'boxShadow',
    label: 'Box Shadow',
    description: 'Utilities for controlling the box shadow of an element.',
    uiControl: 'ShadowEditor',
    group: 'Effects',
    classes: [
      { class: 'shadow-none', value: 'none', label: 'None' },
      { class: 'shadow-sm', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', label: 'Small' },
      { class: 'shadow', value: '0 1px 3px 0 rgb(0 0 0 / 0.1)', label: 'Default' },
      { class: 'shadow-md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)', label: 'Medium' },
      { class: 'shadow-lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1)', label: 'Large' },
      { class: 'shadow-xl', value: '0 20px 25px -5px rgb(0 0 0 / 0.1)', label: 'Extra Large' },
    ],
  },

  // Borders Group
  {
    category: 'borderWidth',
    label: 'Border Width',
    description: 'Utilities for controlling the width of an element\'s borders.',
    uiControl: 'SelectControl',
    group: 'Borders',
    classes: [
      { class: 'border-0', value: '0px', label: 'None' },
      { class: 'border', value: '1px', label: 'Default' },
      { class: 'border-2', value: '2px', label: '2px' },
      { class: 'border-4', value: '4px', label: '4px' },
      { class: 'border-8', value: '8px', label: '8px' },
    ],
  },
  {
    category: 'borderRadius',
    label: 'Border Radius',
    description: 'Utilities for controlling the border radius of an element.',
    uiControl: 'SelectControl',
    group: 'Borders',
    classes: [
      { class: 'rounded-none', value: '0px', label: 'None' },
      { class: 'rounded-sm', value: '0.125rem', label: 'Small' },
      { class: 'rounded', value: '0.25rem', label: 'Default' },
      { class: 'rounded-md', value: '0.375rem', label: 'Medium' },
      { class: 'rounded-lg', value: '0.5rem', label: 'Large' },
      { class: 'rounded-xl', value: '0.75rem', label: 'Extra Large' },
      { class: 'rounded-full', value: '9999px', label: 'Full' },
    ],
  },

  // States Group
  {
    category: 'cursor',
    label: 'Cursor',
    description: 'Utilities for controlling the cursor style when hovering over an element.',
    uiControl: 'SelectControl',
    group: 'States',
    classes: [
      { class: 'cursor-auto', value: 'auto', label: 'Auto' },
      { class: 'cursor-pointer', value: 'pointer', label: 'Pointer' },
      { class: 'cursor-not-allowed', value: 'not-allowed', label: 'Not Allowed' },
      { class: 'cursor-text', value: 'text', label: 'Text' },
      { class: 'cursor-move', value: 'move', label: 'Move' },
      { class: 'cursor-grab', value: 'grab', label: 'Grab' },
    ],
  },

  // Special Cases
  {
    category: 'backgroundImage',
    label: 'Background Image',
    description: 'Utilities for controlling the background image of an element.',
    uiControl: 'TextInput',
    group: 'Backgrounds',
    classes: [
      { class: 'bg-none', value: 'none', label: 'None' },
      { class: 'bg-gradient-to-r', value: 'linear-gradient(to right, var(--tw-gradient-stops))', label: 'Gradient Right' },
      { class: 'bg-gradient-to-b', value: 'linear-gradient(to bottom, var(--tw-gradient-stops))', label: 'Gradient Down' },
    ],
  },
  {
    category: 'fontItalic',
    label: 'Italic',
    description: 'Utilities for controlling whether the font is italicized.',
    uiControl: 'Toggle',
    group: 'Typography',
    classes: [
      { class: 'italic', value: 'italic', label: 'Italic' },
      { class: 'not-italic', value: 'normal', label: 'Normal' },
    ],
  },
  {
    category: 'underline',
    label: 'Underline',
    description: 'Utilities for controlling text decoration.',
    uiControl: 'Toggle',
    group: 'Typography',
    classes: [
      { class: 'underline', value: 'underline', label: 'Underline' },
      { class: 'no-underline', value: 'none', label: 'None' },
    ],
  },
  {
    category: 'truncate',
    label: 'Truncate',
    description: 'Utilities for controlling text overflow.',
    uiControl: 'Toggle',
    group: 'Typography',
    classes: [
      { class: 'truncate', value: 'truncate', label: 'Truncate' },
    ],
  },
];