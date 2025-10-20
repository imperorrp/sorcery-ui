/**
 * Inspector Configuration Module
 * 
 * This module provides configuration data and mappings for the visual component inspector.
 * It defines property groupings, icon mappings, color organization, and typography scales
 * that enhance the user experience when editing component properties in the visual editor.
 * 
 * The configuration is used by various inspector controls to provide consistent,
 * intuitive interfaces for editing Tailwind CSS properties and other component attributes.
 */

/**
 * Common Properties Configuration
 * 
 * Defines which properties are displayed by default in each accordion group within the inspector.
 * This configuration controls the organization and visibility of controls in the visual editor,
 * grouping related CSS properties together for better discoverability and workflow efficiency.
 * 
 * Each key represents an accordion group name, and the corresponding array contains
 * the property categories that should be shown in that group by default.
 */
import type { LucideIcon } from 'lucide-react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowDownUp,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpDown,
} from 'lucide-react';

/**
 * Favorite Modifiers Placeholder
 *
 * Users will be able to populate this collection from the UI in a future iteration.
 * The inspector currently exposes a Favorites scope that renders an empty state
 * when these arrays are empty.
 */
export const favoriteModifierTypes: readonly string[] = [];

/**
 * Common Modifiers Configuration
 *
 * Defines the baseline modifier types that should surface in the common scope.
 */
export const commonModifierTypes = ['State', 'Breakpoint', 'Dark Mode'] as const;

/**
 * Favorite Properties Placeholder
 *
 * Utilities will be surfaced here once the favorites feature is implemented.
 */
export const favoriteUtilityCategories: readonly string[] = [];

export const commonProperties = {
  'Layout': ['display', 'position', 'zIndex'] as const,
  'Flexbox & Grid': ['flexDirection', 'alignItems', 'justifyContent', 'gap'] as const,
  'Spacing': ['padding', 'margin'] as const,
  'Sizing': ['width', 'height'] as const,
  'Typography': ['fontSize', 'fontWeight', 'textColor', 'textAlign'] as const,
  'Backgrounds': ['backgroundColor'] as const,
  'Borders': ['borderRadius', 'borderWidth', 'borderColor'] as const,
  'Effects': ['boxShadow', 'opacity'] as const,
} as const;

/**
 * Segmented Control Icon Mapping
 *
 * Associates commonly used utility classes with Lucide icons so segmented
 * controls and button-based selectors can render intuitive visual affordances
 * instead of plain text labels.
 */
export const segmentedControlIconMap: Record<string, LucideIcon> = {
  // Text alignment
  'text-left': AlignLeft,
  'text-center': AlignCenter,
  'text-right': AlignRight,
  'text-justify': AlignJustify,

  // Flex direction
  'flex-row': ArrowLeftRight,
  'flex-row-reverse': ArrowDownUp,
  'flex-col': ArrowUpDown,
  'flex-col-reverse': ArrowDownUp,

  // Align items
  'items-start': ArrowUp,
  'items-center': AlignCenter,
  'items-end': ArrowDown,
  'items-stretch': AlignJustify,
  'items-baseline': AlignJustify,

  // Justify content
  'justify-start': AlignLeft,
  'justify-end': AlignRight,
  'justify-center': AlignCenter,
  'justify-between': AlignJustify,
  'justify-around': AlignJustify,
  'justify-evenly': AlignJustify,
  'justify-stretch': AlignJustify,
};

/**
 * Icon Mapping Configuration
 * 
 * Provides visual icon representations for different control values to enhance the user interface.
 * These icon names are resolved to actual Lucide React icons in the components that use them,
 * providing intuitive visual cues for different property values and improving the overall
 * user experience in the visual editor.
 * 
 * The mapping covers various CSS property categories including flexbox alignment,
 * text alignment, display modes, positioning, and typography weights.
 */
export const iconMap = {
  // Flexbox alignment
  'justify-start': 'AlignStart',
  'justify-center': 'AlignCenter',
  'justify-end': 'AlignEnd',
  'justify-between': 'AlignJustify',
  'justify-around': 'Minus',
  'justify-evenly': 'Plus',

  // Flexbox items alignment
  'items-start': 'ArrowUp',
  'items-center': 'AlignCenter',
  'items-end': 'ArrowDown',
  'items-stretch': 'Move',
  'items-baseline': 'Minus',

  // Flexbox self alignment
  'self-start': 'ArrowUp',
  'self-center': 'AlignCenter',
  'self-end': 'ArrowDown',
  'self-stretch': 'Move',
  'self-auto': 'Settings',

  // Text alignment
  'text-left': 'AlignStart',
  'text-center': 'AlignCenter',
  'text-right': 'AlignEnd',
  'text-justify': 'AlignJustify',

  // Display
  'block': 'Square',
  'inline': 'Minus',
  'inline-block': 'Square',
  'flex': 'Move',
  'inline-flex': 'Move',
  'grid': 'Hash',
  'inline-grid': 'Hash',
  'none': 'EyeOff',
  'hidden': 'EyeOff',

  // Position
  'static': 'Square',
  'relative': 'Move',
  'absolute': 'Move',
  'fixed': 'Move',
  'sticky': 'Move',

  // Font weight
  'font-thin': 'Type',
  'font-light': 'Type',
  'font-normal': 'Type',
  'font-medium': 'Type',
  'font-semibold': 'Type',
  'font-bold': 'Bold',
  'font-extrabold': 'Bold',
  'font-black': 'Bold',

  // Default fallback
  'default': 'Settings'
};

/**
 * Color Groups Configuration
 * 
 * Organizes Tailwind color palettes into logical groups for better user experience
 * in color picker interfaces. This grouping helps users quickly find colors within
 * related hue families, making the color selection process more intuitive and efficient.
 * 
 * Each group contains an array of color family names that are commonly used together
 * in design systems and provide a structured approach to color selection.
 */
export const colorGroups = {
  'Grays': ['gray', 'slate', 'zinc', 'neutral', 'stone'],
  'Reds': ['red', 'rose', 'pink'],
  'Oranges': ['orange', 'amber'],
  'Yellows': ['yellow', 'lime'],
  'Greens': ['green', 'emerald', 'teal'],
  'Blues': ['blue', 'indigo', 'sky', 'cyan'],
  'Purples': ['purple', 'violet', 'fuchsia'],
  'Pinks': ['pink', 'rose']
};

/**
 * Typography Scale Configuration
 * 
 * Maps Tailwind typography classes to their corresponding font sizes for better
 * visualization and understanding in the UI. This configuration helps users
 * understand the actual size implications of different typography classes
 * when making font size selections in the visual editor.
 * 
 * The scale covers the full range of Tailwind's text sizing utilities,
 * from extra small (text-xs) to extra large (text-9xl), providing clear
 * size references for design decision-making.
 */
export const typographyScale = {
  'text-xs': '12px',
  'text-sm': '14px',
  'text-base': '16px',
  'text-lg': '18px',
  'text-xl': '20px',
  'text-2xl': '24px',
  'text-3xl': '30px',
  'text-4xl': '36px',
  'text-5xl': '48px',
  'text-6xl': '60px',
  'text-7xl': '72px',
  'text-8xl': '96px',
  'text-9xl': '128px'
};