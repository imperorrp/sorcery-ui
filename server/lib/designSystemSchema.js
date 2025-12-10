/**
 * designSystemSchema.js
 *
 * Zod schema and system prompt used by the AI design system server endpoint.
 *
 * Purpose:
 * - Define a strict JSON schema that the AI must return to be accepted by the
 *   API and imported into the client editor.
 * - Provide a SYSTEM_PROMPT string that instructs models on code formatting,
 *   import hygiene and the expected component architecture.
 *
 * Notes:
 * - This file is used both by server unit tests and by the AI prompt itself
 *   to increase the likelihood the model will produce a valid shape.
 */
// server/lib/designSystemSchema.js
import { z } from 'zod';

// The Output Schema: This forces the AI to return a specific JSON structure
// that our frontend can immediately ingest into the Store.
export const designSystemSchema = z.object({
  designTokens: z.object({
    cssVars: z.object({
      root: z.record(z.string(), z.string()).describe('Key-value pairs for :root variables (e.g. "--primary": "222.2 47.4% 11.2%")'),
      dark: z.record(z.string(), z.string()).describe('Key-value pairs for .dark variables'),
    }),
    tailwindConfig: z.object({
      theme: z.object({
        extend: z.object({
          colors: z.record(z.string(), z.any()).optional(),
          borderRadius: z.record(z.string(), z.string()).optional(),
          fontFamily: z.record(z.string(), z.array(z.string())).optional(),
        }).optional(),
      }).optional(),
    }).describe('Tailwind configuration object to merge with defaults'),
  }),
  components: z.array(z.object({
    name: z.string().describe('PascalCase component name (e.g. "Button", "PricingCard")'),
    type: z.enum(['ui', 'block']).describe('"ui" for primitives (buttons, inputs), "block" for sections (hero, cards)'),
    description: z.string(),
    code: z.string().describe('The complete React component code as plain TypeScript/TSX without any wrappers, IIFEs, or export statements. Start directly with imports and end with the component definition.'),
    dependencies: z.array(z.string()).describe('External dependencies required (e.g. "lucide-react")'),
  })),
});

// The System Prompt: Instructions for the AI
/**
 * SYSTEM_PROMPT
 *
 * The system prompt is an instruction given to the AI to detail the
 * expected output format, coding conventions, imports, and component
 * architecture. It instructs the model to return plain TypeScript/TSX
 * component code (no extra wrapper functions or markdown), token formats,
 * and the exact JSON schema shape required for a successful import.
 */
export const SYSTEM_PROMPT = `
You are an expert Frontend Architect specializing in Design Systems, React, Tailwind CSS, and the "shadcn/ui" architecture.

Your goal is to analyze a UI screenshot and reverse-engineer it into a functional Design System and Component Library.

### 1. Design Tokens Extraction
Analyze the image to extract:
- **Color Palette:** Identify the primary, secondary, accent, muted, and destructive colors. Convert them to HSL or OKLCH values for CSS variables.
- **Typography:** Estimate font stacks.
- **Radii:** Estimate border-radius tokens (sm, md, lg, xl).

### 2. Component Architecture (The "components.build" Standard)
You must deconstruct the UI into reusable components.
- **Primitives:** Extract low-level items like Buttons, Badges, Inputs.
- **Blocks:** Create higher-level compositions like "LoginCard" or "HeroSection" using those primitives.

### 3. Coding Standards (Strict Enforcement)
- **Imports:** Use these exact import statements:
  - \`import * as React from "react"\`
  - \`import { cva, type VariantProps } from "class-variance-authority"\`
  - \`import { cn } from "../../utils/cn"\`
  - \`import { LucideIcon } from "lucide-react"\`
  - Do NOT use any other import paths or relative imports
- **Code Format:** Return the component code as plain TypeScript/TSX without any wrappers, IIFEs, export statements, or function declarations. Start directly with import statements and end with the component definition. Do not wrap the code in parentheses, functions, or any other constructs.
- **Merging:** Use \`cn()\` (a utility combining \`clsx\` and \`tailwind-merge\`) for className merging.
- **Variants:** Use \`class-variance-authority\` (cva) for defining component variants (default, outline, ghost, etc.).
- **Icons:** Use \`lucide-react\` for icons.
- **Semantics:** Use proper HTML tags (\`<section>\`, \`<article>\`, \`<button>\`).
- **Data Attributes:** 
    - Use \`data-state="open|closed"\` for interactive states.
    - Use \`data-slot="component-name"\` for identifying sub-components (e.g., \`data-slot="card-header"\`).
- **Props:** All components must accept a \`className\` prop and spread \`...props\` to the root element.

### 4. Output Format
Return ONLY valid JSON matching the provided schema. Do not include markdown code blocks.
`;