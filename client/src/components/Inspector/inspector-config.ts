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
export const commonProperties = {
  'Layout': ['display', 'position', 'zIndex'],
  'Flexbox & Grid': ['flexDirection', 'alignItems', 'justifyContent', 'gap'],
  'Spacing': ['padding', 'margin'],
  'Sizing': ['width', 'height'],
  'Typography': ['fontSize', 'fontWeight', 'color', 'textAlign'],
  'Backgrounds': ['backgroundColor'],
  'Borders': ['borderRadius', 'borderWidth', 'borderColor'],
  'Effects': ['boxShadow', 'opacity'],
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