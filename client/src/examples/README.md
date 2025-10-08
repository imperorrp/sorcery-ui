# Examples Directory

This directory contains example components and test cases for the theme editor.

## Component Examples (`examples.ts`)

Pre-built React component templates for demonstration and testing. Used by the editor for quick component loading and user education.

## Theme Test Cases (`theme-test-cases.ts`)

Comprehensive test cases to validate the theme engine functionality. These test cases verify that both Tailwind config extensions and CSS custom properties are correctly parsed and applied to the Inspector controls and iframe preview.

### Test Case Categories

- **Test Case A (Tailwind Extend)**: Tests theme extension with new colors and spacing via tailwind.config.js
- **Test Case B (Shadcn/ui CSS)**: Tests CSS custom properties for semantic theming + @theme directive
- **Test Case C (Hybrid)**: Tests combination of Tailwind config, @theme directive, and CSS variables
- **Test Case D (Tailwind @theme)**: Tests pure @theme directive usage for all theme values

### @theme Directive Support

The test cases include comprehensive testing of Tailwind CSS v4's `@theme` directive, which allows defining theme values directly in CSS:

```css
@theme {
  --color-brand: #7e22ce;
  --spacing-128: 32rem;
  --border-radius-xl: 0.75rem;
}
```

This provides an alternative to tailwind.config.js for defining custom theme values.

### How to Use the Test Cases

1. **Load the app** and navigate to the theme editor tabs

2. **Test Case A (Tailwind Extend)**:
   - In the "Tailwind Config" tab, paste the `tailwindConfig` from `testCaseA`
   - **Verification**:
     - Inspector: ColorPicker for backgroundColor should show "brand" swatch
     - Inspector: SizeInput for padding should show "128" as an option
     - iframe: Apply `bg-brand` class → element should be `#7e22ce`
     - iframe: Apply `p-128` class → element should have `32rem` padding

3. **Test Case B (Shadcn/ui CSS)**:
   - Clear the Tailwind Config
   - In the "Theme CSS" tab, paste the `themeCss` from `testCaseB`
   - **Verification**:
     - Inspector: ColorPicker should show "primary", "secondary", "destructive" swatches (from @theme)
     - Inspector: ColorPicker should also show "primary", "card", "destructive" (from CSS variables)
     - iframe: Apply `bg-primary` class → element should use `--color-primary` value from @theme
     - iframe: Apply `bg-card` class → element should use `--card` color value from CSS variables

4. **Test Case C (Hybrid)**:
   - In the "Tailwind Config" tab, paste the `tailwindConfig` from `testCaseC`
   - In the "Theme CSS" tab, paste the `themeCss` from `testCaseC`
   - **Verification**:
     - Inspector: ColorPicker should show brand colors (Tailwind), @theme colors, and CSS variable colors
     - Inspector: SizeInput should show '128' from @theme
     - iframe: `bg-brand` should use Tailwind color, `bg-primary` should use @theme color (takes precedence)

5. **Test Case D (Tailwind @theme)**:
   - Clear all configs
   - In the "Theme CSS" tab, paste the `themeCss` from `testCaseD`
   - **Verification**:
     - Inspector: ColorPicker → should see all @theme colors
     - Inspector: SizeInput for padding → should see '128' and '144'
     - Inspector: SizeInput for border-radius → should see 'xl' and '2xl'
     - Inspector: FontSize picker → should see '4xl' and '5xl'
     - iframe: All corresponding classes should work with @theme values

### Expected Outcome

If all verifications pass, the theme engine is working correctly. If any verification fails, pause and fix the implementation in `themeUtils.ts` or the data transformation logic before proceeding with new features.