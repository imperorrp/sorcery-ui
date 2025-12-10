/**
 * Runtime System - Dependency Registry
 *
 * The runtime system exports a mapping `RUNTIME_IMPORTS` that maps import
 * specifiers (strings) to runtime objects used by the renderer. During runtime
 * transpilation, import statements are transformed into `const` declarations
 * that read from this registry, which allows components to reference libraries
 * like `react`, `lucide-react`, and local `@/lib/utils` without loading them via
 * a bundler in the sandboxed iframe environment.
 */
// client/src/lib/runtimeSystem.ts
import * as React from 'react';
import * as LucideReact from 'lucide-react';
import * as RadixSlot from '@radix-ui/react-slot';
import * as RadixAccordion from '@radix-ui/react-accordion';
import * as RadixDialog from '@radix-ui/react-dialog';
import * as RadixPopover from '@radix-ui/react-popover';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import * as RadixLabel from '@radix-ui/react-label';
import * as RadixSelect from '@radix-ui/react-select';
import * as RadixSlider from '@radix-ui/react-slider';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cva } from 'class-variance-authority';

// The synthetic "lib/utils" that shadcn components expect
/**
 * shadcnUtils - A light wrapper implementing `cn()` used by shadcn-based
 * component libraries. It delegates to `clsx` + `tailwind-merge` to both
 * combine classnames and respect Tailwind's conflicting rules.
 */
export const shadcnUtils = {
  cn: (...inputs: ClassValue[]) => twMerge(clsx(inputs)),
};

// Map of import specifiers to the actual library objects
/**
 * RUNTIME_IMPORTS
 *
 * A registry that maps import specifier strings to actual runtime objects
 * available inside the sandboxed renderer execution environment. During
 * transpilation the renderer replaces import statements with declarations
 * that resolve these objects via the `__deps__` runtime map.
 */
export const RUNTIME_IMPORTS: Record<string, unknown> = {
  'react': React,
  'lucide-react': LucideReact,
  'clsx': { default: clsx, clsx },
  'tailwind-merge': { default: twMerge, twMerge },
  'class-variance-authority': { cva },
  '@radix-ui/react-slot': RadixSlot,
  '@radix-ui/react-accordion': RadixAccordion,
  '@radix-ui/react-dialog': RadixDialog,
  '@radix-ui/react-popover': RadixPopover,
  '@radix-ui/react-tooltip': RadixTooltip,
  '@radix-ui/react-label': RadixLabel,
  '@radix-ui/react-select': RadixSelect,
  '@radix-ui/react-slider': RadixSlider,

  // The magical path that exists in every shadcn project
  '@/lib/utils': shadcnUtils,
  '../lib/utils': shadcnUtils,
  './lib/utils': shadcnUtils,
  '../../utils/cn': shadcnUtils,
  '../../lib/utils': shadcnUtils,
  '../../../utils/cn': shadcnUtils,
  '../../../lib/utils': shadcnUtils,
  '@utils/cn': shadcnUtils,
  'utils/cn': shadcnUtils,
};