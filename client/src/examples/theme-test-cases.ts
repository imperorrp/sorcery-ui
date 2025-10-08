/**
 * Theme Test Cases - Validation Harness for Theming Engine
 *
 * Comprehensive test cases to validate the theme engine functionality.
 * These test cases verify that both Tailwind config extensions and CSS custom properties
 * are correctly parsed and applied to the Inspector controls and iframe preview.
 *
 * TEST CASE CATEGORIES:
 * - Test Case A: Tailwind Extend - Tests theme extension with new colors and spacing
 * - Test Case B: Shadcn/ui CSS - Tests CSS custom properties for semantic theming
 * - Test Case C: Hybrid - Tests combination of Tailwind config and CSS variables
 *
 * USAGE:
 * Copy and paste these strings into the respective tabs in the theme editor:
 * - Tailwind Config tab for tailwindConfig strings
 * - Theme CSS tab for themeCss strings
 */

export interface ThemeTestCase {
  name: string;
  description: string;
  tailwindConfig?: string;
  themeCss?: string;
  expectedVerifications: string[];
}

/**
 * Test Case A: Tailwind Extend
 * Tests extending the default Tailwind theme with custom colors and spacing
 */
export const testCaseA: ThemeTestCase = {
  name: "Tailwind Extend",
  description: "Extends default theme with new color (brand) and spacing unit (128)",
  tailwindConfig: `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#7e22ce',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
}`,
  expectedVerifications: [
    "Inspector: ColorPicker for backgroundColor should show 'brand' swatch",
    "Inspector: SizeInput for padding should show '128' as an option",
    "iframe: bg-brand class should apply #7e22ce color",
    "iframe: p-128 class should apply 32rem padding"
  ]
};

/**
 * Test Case B: Shadcn/ui CSS
 * Tests semantic theming with CSS custom properties for light and dark modes
 */
export const testCaseB: ThemeTestCase = {
  name: "Shadcn/ui CSS",
  description: "Defines semantic color variables for shadcn/ui theme",
  themeCss: `@theme {
  --color-primary: #3b82f6;
  --color-secondary: #f1f5f9;
  --color-accent: #f1f5f9;
  --color-muted: #f1f5f9;
  --color-destructive: #ef4444;
  --color-border: #e2e8f0;
  --color-input: #e2e8f0;
  --color-ring: #3b82f6;
}

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 94.1%;
}`,
  expectedVerifications: [
    "Inspector: ColorPicker should show swatches for 'primary', 'secondary', 'destructive', etc. (from @theme)",
    "Inspector: ColorPicker should also show 'primary', 'card', 'destructive' (from CSS variables)",
    "iframe: bg-primary class should render with the --color-primary value from @theme",
    "iframe: bg-card class should render with the --card color value from CSS variables",
    "Dark mode toggle should switch to .dark variable values"
  ]
};

/**
 * Test Case C: Hybrid
 * Tests combination of Tailwind config extension and CSS custom properties
 */
export const testCaseC: ThemeTestCase = {
  name: "Hybrid",
  description: "Combines Tailwind config extension with semantic CSS variables",
  tailwindConfig: `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#7e22ce',
        'brand-secondary': '#a855f7',
      },
    },
  },
}`,
  themeCss: `@theme {
  --color-primary: #3b82f6;
  --color-secondary: #f1f5f9;
  --color-accent: #f1f5f9;
  --color-destructive: #ef4444;
  --spacing-128: 32rem;
}

:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
}

.dark {
  --primary: 217.2 32.6% 17.5%;
  --primary-foreground: 210 40% 98%;
  --secondary: 222.2 84% 4.9%;
  --secondary-foreground: 210 40% 98%;
  --accent: 222.2 84% 4.9%;
  --accent-foreground: 210 40% 98%;
  --muted: 222.2 84% 4.9%;
  --muted-foreground: 215 20.2% 65.1%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 222.2 84% 4.9%;
  --input: 222.2 84% 4.9%;
  --ring: 224.3 76.3% 94.1%;
}`,
  expectedVerifications: [
    "Inspector: ColorPicker should show 'brand'/'brand-secondary' (from Tailwind), 'primary'/'secondary' (from @theme), and 'primary'/'secondary' (from CSS variables)",
    "Inspector: SizeInput for padding should show '128' as an option (from @theme)",
    "iframe: bg-brand class should apply #7e22ce (from Tailwind)",
    "iframe: bg-primary class should apply #3b82f6 (from @theme, takes precedence over CSS variables)",
    "iframe: p-128 class should apply 32rem padding (from @theme)",
    "Tailwind colors, @theme values, and CSS variables should coexist without conflicts"
  ]
};

/**
 * Test Case D: Tailwind @theme
 * Tests Tailwind CSS v4 @theme directive for defining theme values directly in CSS
 */
export const testCaseD: ThemeTestCase = {
  name: "Tailwind @theme",
  description: "Uses @theme directive to define custom colors, spacing, and other theme values",
  themeCss: `@theme {
  --color-brand: #7e22ce;
  --color-brand-secondary: #a855f7;
  --color-primary: #3b82f6;
  --color-secondary: #f1f5f9;
  --color-accent: #f1f5f9;
  --color-muted: #f1f5f9;
  --color-destructive: #ef4444;
  --color-border: #e2e8f0;
  --color-input: #e2e8f0;
  --color-ring: #3b82f6;
  --spacing-128: 32rem;
  --spacing-144: 36rem;
  --font-size-4xl: 2.25rem;
  --font-size-5xl: 3rem;
  --border-radius-xl: 0.75rem;
  --border-radius-2xl: 1rem;
}`,
  expectedVerifications: [
    "Inspector: ColorPicker should show 'brand', 'brand-secondary', 'primary', 'secondary', 'destructive', etc.",
    "Inspector: SizeInput for padding should show '128' and '144' as options",
    "Inspector: SizeInput for border-radius should show 'xl' and '2xl' as options",
    "Inspector: FontSize picker should show '4xl' and '5xl' as options",
    "iframe: bg-brand class should apply #7e22ce",
    "iframe: bg-primary class should apply #3b82f6",
    "iframe: p-128 class should apply 32rem padding",
    "iframe: rounded-xl class should apply 0.75rem border-radius"
  ]
};

/**
 * Collection of all theme test cases
 */
export const themeTestCases: Record<string, ThemeTestCase> = {
  'Test Case A (Tailwind Extend)': testCaseA,
  'Test Case B (Shadcn/ui CSS)': testCaseB,
  'Test Case C (Hybrid)': testCaseC,
  'Test Case D (Tailwind @theme)': testCaseD,
};

/**
 * Test Execution Instructions
 *
 * Step 1 (Tailwind Extend):
 * - Load the app
 * - In "Tailwind Config" tab, paste testCaseA.tailwindConfig
 * - Verification 1 (Inspector): Open ColorPicker for backgroundColor → should see "brand" swatch
 * - Verification 2 (Inspector): Open SizeInput for padding → should see "128" as option
 * - Verification 3 (iframe): Apply bg-brand class → element should be #7e22ce
 * - Verification 4 (iframe): Apply p-128 class → element should have 32rem padding
 *
 * Step 2 (Shadcn/ui CSS):
 * - Clear Tailwind Config
 * - In "Theme CSS" tab, paste testCaseB.themeCss
 * - Verification 1 (Inspector): Open ColorPicker → should see "primary", "secondary", "destructive" swatches (from @theme)
 * - Verification 2 (Inspector): Open ColorPicker → should also see "primary", "card", "destructive" (from CSS variables)
 * - Verification 3 (iframe): Apply bg-primary class → element should use --color-primary value from @theme
 * - Verification 4 (iframe): Apply bg-card class → element should use --card color value from CSS variables
 *
 * Step 3 (Hybrid):
 * - In "Tailwind Config" tab, paste testCaseC.tailwindConfig
 * - In "Theme CSS" tab, paste testCaseC.themeCss
 * - Verification 1: ColorPicker should show brand colors (Tailwind), @theme colors, and CSS variable colors
 * - Verification 2: SizeInput should show '128' from @theme
 * - Verification 3: bg-brand should use Tailwind color, bg-primary should use @theme color (takes precedence)
 *
 * Step 4 (Tailwind @theme):
 * - Clear all configs
 * - In "Theme CSS" tab, paste testCaseD.themeCss
 * - Verification 1 (Inspector): ColorPicker → should see all @theme colors
 * - Verification 2 (Inspector): SizeInput for padding → should see '128' and '144'
 * - Verification 3 (Inspector): SizeInput for border-radius → should see 'xl' and '2xl'
 * - Verification 4 (Inspector): FontSize picker → should see '4xl' and '5xl'
 * - Verification 5 (iframe): All corresponding classes should work with @theme values
 *
 * If any verification fails, pause and fix the theme engine implementation.
 */