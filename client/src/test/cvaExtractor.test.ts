/**
 * Tests for CVA schema extraction
 * 
 * Verifies that extractComponentSchema correctly parses CVA definitions
 * from component source code and returns accurate variant metadata.
 */

import { describe, it, expect } from 'vitest';
import { extractComponentSchema, hasCVAPattern, hasClassMergingHelper } from '@/lib/cvaExtractor';

describe('cvaExtractor', () => {
  describe('hasCVAPattern', () => {
    it('should detect CVA import', () => {
      const code = `
        import { cva } from 'class-variance-authority';
        const buttonVariants = cva('base-class');
      `;
      expect(hasCVAPattern(code)).toBe(true);
    });

    it('should detect variants object pattern', () => {
      const code = `
        const styles = cva('base', {
          variants: {
            size: { sm: 'text-sm', lg: 'text-lg' }
          }
        });
      `;
      expect(hasCVAPattern(code)).toBe(true);
    });

    it('should return false for non-CVA code', () => {
      const code = `
        function MyComponent() {
          return <div className="bg-blue-500">Hello</div>;
        }
      `;
      expect(hasCVAPattern(code)).toBe(false);
    });
  });

  describe('hasClassMergingHelper', () => {
    it('should detect cn import', () => {
      const code = `import { cn } from '@/lib/utils';`;
      expect(hasClassMergingHelper(code)).toBe(true);
    });

    it('should detect clsx import', () => {
      const code = `import clsx from 'clsx';`;
      expect(hasClassMergingHelper(code)).toBe(true);
    });

    it('should detect cn usage', () => {
      const code = `className={cn('base', variant)}`;
      expect(hasClassMergingHelper(code)).toBe(true);
    });
  });

  describe('extractComponentSchema', () => {
    it('should extract simple variant definition', () => {
      const code = `
        import { cva } from 'class-variance-authority';

        const buttonVariants = cva('inline-flex', {
          variants: {
            variant: {
              default: 'bg-blue-500 text-white',
              outline: 'border border-gray-300',
              ghost: 'bg-transparent hover:bg-gray-100'
            }
          },
          defaultVariants: {
            variant: 'default'
          }
        });

        export function Button() {
          return <button>Click</button>;
        }
      `;

      const schema = extractComponentSchema(code, 'Button');
      
      expect(schema).not.toBeNull();
      expect(schema?.name).toBe('Button');
      expect(schema?.detectionMethod).toBe('cva-ast');
      expect(schema?.variants).toHaveProperty('variant');
      
      const variant = schema?.variants.variant;
      expect(variant?.name).toBe('variant');
      expect(variant?.type).toBe('enum');
      expect(variant?.default).toBe('default');
      expect(variant?.options).toHaveLength(3);
      
      const defaultOption = variant?.options.find(o => o.value === 'default');
      expect(defaultOption?.classes).toBe('bg-blue-500 text-white');
      expect(defaultOption?.label).toBe('Default');
    });

    it('should extract multiple variants', () => {
      const code = `
        import { cva } from 'class-variance-authority';

        const buttonVariants = cva('inline-flex', {
          variants: {
            variant: {
              default: 'bg-blue-500',
              outline: 'border'
            },
            size: {
              sm: 'text-sm px-2',
              md: 'text-base px-4',
              lg: 'text-lg px-6'
            }
          },
          defaultVariants: {
            variant: 'default',
            size: 'md'
          }
        });
      `;

      const schema = extractComponentSchema(code, 'Button');
      
      expect(schema).not.toBeNull();
      expect(Object.keys(schema?.variants || {})).toEqual(['variant', 'size']);
      expect(schema?.variants.size.options).toHaveLength(3);
      expect(schema?.variants.size.default).toBe('md');
    });

    it('should handle template literal classes', () => {
      const code = `
        import { cva } from 'class-variance-authority';

        const cardVariants = cva(\`rounded-lg shadow\`, {
          variants: {
            padding: {
              none: \`p-0\`,
              sm: \`p-2\`,
              md: \`p-4\`
            }
          }
        });
      `;

      const schema = extractComponentSchema(code, 'Card');
      
      expect(schema).not.toBeNull();
      expect(schema?.variants.padding.options[0].classes).toBe('p-0');
    });

    it('should return null for non-CVA code', () => {
      const code = `
        function MyComponent() {
          return <div>Hello</div>;
        }
      `;

      const schema = extractComponentSchema(code, 'MyComponent');
      expect(schema).toBeNull();
    });

    it('should return null for CVA with no variants', () => {
      const code = `
        import { cva } from 'class-variance-authority';
        const styles = cva('base-class');
      `;

      const schema = extractComponentSchema(code, 'Component');
      expect(schema).toBeNull();
    });
  });
});
