/**
 * CVA Extractor - Schema-on-demand for variant-aware components
 * 
 * This module extracts component metadata (variants, props, CSS variables) from
 * source code that uses class-variance-authority (CVA) or similar patterns.
 * 
 * Core workflow:
 * 1. Parse component source with Babel
 * 2. Find `cva(...)` call expressions
 * 3. Extract variants object and defaultVariants
 * 4. Extract prop definitions from TypeScript signatures
 * 5. Return ComponentSchema for use in VariantEditor
 * 
 * This enables schema-on-demand: we get accurate metadata directly from
 * the user's project code without maintaining a central registry.
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { ComponentSchema, VariantDefinition, VariantOption } from '@/store/types';

/**
 * Extract component schema from source code
 * 
 * @param sourceCode - The component source code string
 * @param componentName - Name of the component to analyze
 * @returns ComponentSchema if CVA pattern found, null otherwise
 */
export function extractComponentSchema(
  sourceCode: string,
  componentName: string
): ComponentSchema | null {
  try {
    // Parse source code with TypeScript and JSX support
    const ast = parse(sourceCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let cvaCallNode: t.CallExpression | null = null;
    let variantsObject: t.ObjectExpression | undefined = undefined;
    let defaultVariantsObject: t.ObjectExpression | undefined = undefined;

    // Traverse AST to find CVA call
    traverse(ast, {
      CallExpression(path) {
        const { callee } = path.node;
        
        // Check if this is a `cva(...)` call
        if (t.isIdentifier(callee) && callee.name === 'cva') {
          cvaCallNode = path.node;
          
          // CVA signature: cva(baseClasses, { variants: {...}, defaultVariants: {...} })
          if (path.node.arguments.length >= 2) {
            const configArg = path.node.arguments[1];
            
            if (t.isObjectExpression(configArg)) {
              // Extract variants and defaultVariants objects
              configArg.properties.forEach((prop) => {
                if (
                  t.isObjectProperty(prop) &&
                  t.isIdentifier(prop.key)
                ) {
                  if (prop.key.name === 'variants' && t.isObjectExpression(prop.value)) {
                    variantsObject = prop.value;
                  }
                  if (prop.key.name === 'defaultVariants' && t.isObjectExpression(prop.value)) {
                    defaultVariantsObject = prop.value;
                  }
                }
              });
            }
          }
        }
      },
    });

    // If no CVA call found, return null
    if (!cvaCallNode || !variantsObject) {
      return null;
    }

    // Extract variants from the variants object
    const variants: Record<string, VariantDefinition> = {};
    const defaultVariants: Record<string, string> = {};

    // Parse defaultVariants first
    if (defaultVariantsObject && t.isObjectExpression(defaultVariantsObject)) {
      const props = (defaultVariantsObject as t.ObjectExpression).properties;
      for (const prop of props) {
        if (
          t.isObjectProperty(prop) &&
          t.isIdentifier(prop.key) &&
          t.isStringLiteral(prop.value)
        ) {
          defaultVariants[prop.key.name] = prop.value.value;
        }
      }
    }

    // Parse variants object
    if (t.isObjectExpression(variantsObject)) {
      const variantProps = (variantsObject as t.ObjectExpression).properties;
      for (const variantProp of variantProps) {
        if (
          t.isObjectProperty(variantProp) &&
          t.isIdentifier(variantProp.key) &&
          t.isObjectExpression(variantProp.value)
        ) {
          const variantName = variantProp.key.name; // e.g., "variant", "size"
          const options: VariantOption[] = [];

          // Each variant has options: { default: "classes", outline: "classes", ... }
          const optionProps = variantProp.value.properties;
          for (const optionProp of optionProps) {
            if (
              t.isObjectProperty(optionProp) &&
              (t.isIdentifier(optionProp.key) || t.isStringLiteral(optionProp.key))
            ) {
              const optionValue = t.isIdentifier(optionProp.key)
                ? optionProp.key.name
                : optionProp.key.value;

              // Extract class string
              let classes = '';
              if (t.isStringLiteral(optionProp.value)) {
                classes = optionProp.value.value;
              } else if (t.isTemplateLiteral(optionProp.value)) {
                // Handle template literals (backticks)
                classes = optionProp.value.quasis.map(q => q.value.raw).join('');
              }

              options.push({
                value: optionValue,
                label: optionValue.charAt(0).toUpperCase() + optionValue.slice(1),
                classes,
              });
            }
          }

          variants[variantName] = {
            name: variantName,
            type: 'enum',
            options,
            default: defaultVariants[variantName],
          };
        }
      }
    }

    // If no variants extracted, return null
    if (Object.keys(variants).length === 0) {
      return null;
    }

    // Build schema
    const schema: ComponentSchema = {
      name: componentName,
      variants,
      detectionMethod: 'cva-ast',
    };

    return schema;
  } catch (error) {
    console.error('CVA extraction failed:', error);
    return null;
  }
}

/**
 * Detect if source code uses CVA or variant patterns
 * 
 * Quick check without full parsing - useful for early detection
 * 
 * @param sourceCode - The component source code string
 * @returns true if CVA patterns detected
 */
export function hasCVAPattern(sourceCode: string): boolean {
  // Quick regex checks before expensive AST parsing
  const patterns = [
    /import\s+.*\bcva\b.*from\s+['"]class-variance-authority['"]/,
    /\bcva\s*\(/,
    /variants\s*:\s*\{/,
    /defaultVariants\s*:\s*\{/,
  ];

  return patterns.some((pattern) => pattern.test(sourceCode));
}

/**
 * Detect if component uses class-merging helpers
 * 
 * @param sourceCode - The component source code string
 * @returns true if cn/clsx/classNames detected
 */
export function hasClassMergingHelper(sourceCode: string): boolean {
  const patterns = [
    /import\s+.*\b(cn|clsx|classNames)\b/,
    /\b(cn|clsx|classNames)\s*\(/,
  ];

  return patterns.some((pattern) => pattern.test(sourceCode));
}

/**
 * Extract prop definitions from TypeScript interface/type
 * 
 * TODO: Implement TS signature parsing for prop inference
 * This is a placeholder for Phase 9.2
 * 
 * @param _sourceCode - The component source code string (unused - placeholder)
 * @param _componentName - Name of the component (unused - placeholder)
 * @returns Prop definitions or empty object
 */
export function extractPropDefinitions(
  _sourceCode: string,
  _componentName: string
): Record<string, unknown> {
  // Placeholder - will parse TS interface/type for props
  // Look for patterns like: interface ButtonProps { variant?: "default" | "outline" }
  return {};
}
