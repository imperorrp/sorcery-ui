/**
 * Style Updater Tests
 * 
 * These tests verify the critical non-destructive code update functionality.
 * They ensure that visual style changes can be applied back to source code
 * while preserving all component logic (event handlers, hooks, state).
 */

import { describe, it, expect } from 'vitest';
import { updateStylesInCode } from '../styleUpdater';
import type { SerializableElement } from '@/store/componentStore';

describe('styleUpdater', () => {
  describe('updateStylesInCode', () => {
    it('should add style attribute to element without existing style', async () => {
      const originalCode = `
export default function Component() {
  return <div className="container">Hello</div>;
}`;

      const previewAst: SerializableElement = {
        id: 'wrapper',
        type: 'function',
        props: {
          children: [
            {
              id: '1',
              type: 'div',
              props: {
                className: 'container',
                style: { color: 'red', fontSize: 16 },
                children: ['Hello'],
              },
            },
          ],
        },
      };

      const result = await updateStylesInCode(originalCode, previewAst);

      // Should add the style attribute
      expect(result).toContain('style={{');
      expect(result).toContain('color: "red"');
      expect(result).toContain('fontSize: 16');
      // Should preserve className
      expect(result).toContain('className="container"');
      // Should preserve text content
      expect(result).toContain('Hello');
    });

    it('should update existing style attribute', async () => {
      const originalCode = `
export default function Component() {
  return <div style={{ color: 'blue' }}>Text</div>;
}`;

      const previewAst: SerializableElement = {
        id: 'wrapper',
        type: 'function',
        props: {
          children: [
            {
              id: '1',
              type: 'div',
              props: {
                style: { color: 'red', fontSize: 20 },
                children: ['Text'],
              },
            },
          ],
        },
      };

      const result = await updateStylesInCode(originalCode, previewAst);

      // Should update the style
      expect(result).toContain('color: "red"');
      expect(result).toContain('fontSize: 20');
      // Old style should be replaced
      expect(result).not.toContain('blue');
    });

    it('should preserve event handlers', async () => {
      const originalCode = `
export default function Component() {
  const handleClick = () => console.log('clicked');
  return <button onClick={handleClick}>Click me</button>;
}`;

      const previewAst: SerializableElement = {
        id: 'wrapper',
        type: 'function',
        props: {
          children: [
            {
              id: '1',
              type: 'button',
              props: {
                style: { backgroundColor: 'blue' },
                children: ['Click me'],
              },
            },
          ],
        },
      };

      const result = await updateStylesInCode(originalCode, previewAst);

      // Should preserve the onClick handler
      expect(result).toContain('onClick={handleClick}');
      expect(result).toContain('handleClick = () => console.log');
      // Should add the style
      expect(result).toContain('backgroundColor: "blue"');
    });

    it('should handle nested elements', async () => {
      const originalCode = `
export default function Component() {
  return (
    <div className="parent">
      <span className="child">Text</span>
    </div>
  );
}`;

      const previewAst: SerializableElement = {
        id: 'wrapper',
        type: 'function',
        props: {
          children: [
            {
              id: '1',
              type: 'div',
              props: {
                className: 'parent',
                style: { padding: 10 },
                children: [
                  {
                    id: '2',
                    type: 'span',
                    props: {
                      className: 'child',
                      style: { color: 'green' },
                      children: ['Text'],
                    },
                  },
                ],
              },
            },
          ],
        },
      };

      const result = await updateStylesInCode(originalCode, previewAst);

      // Should add styles to both parent and child
      expect(result).toContain('padding: 10');
      expect(result).toContain('color: "green"');
      // Should preserve classes
      expect(result).toContain('className="parent"');
      expect(result).toContain('className="child"');
    });

    it('should preserve hooks and state', async () => {
      const originalCode = `
export default function Component() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    console.log('mounted');
  }, []);
  
  return <div>Count: {count}</div>;
}`;

      const previewAst: SerializableElement = {
        id: 'wrapper',
        type: 'function',
        props: {
          children: [
            {
              id: '1',
              type: 'div',
              props: {
                style: { fontWeight: 'bold' },
                children: ['Count: ', '{count}'],
              },
            },
          ],
        },
      };

      const result = await updateStylesInCode(originalCode, previewAst);

      // Should preserve useState
      expect(result).toContain('useState(0)');
      // Should preserve useEffect
      expect(result).toContain('useEffect');
      expect(result).toContain('console.log');
      // Should preserve JSX expression
      expect(result).toContain('{count}');
      // Should add style
      expect(result).toContain('fontWeight: "bold"');
    });

    it('should preserve multiple children', async () => {
      const originalCode = `
export default function Component() {
  return (
    <div>
      <h1>Title</h1>
      <p>Paragraph</p>
      <button>Click</button>
    </div>
  );
}`;

      const previewAst: SerializableElement = {
        id: 'wrapper',
        type: 'function',
        props: {
          children: [
            {
              id: '1',
              type: 'div',
              props: {
                style: { display: 'flex' },
                children: [
                  {
                    id: '2',
                    type: 'h1',
                    props: {
                      style: { color: 'blue' },
                      children: ['Title'],
                    },
                  },
                  {
                    id: '3',
                    type: 'p',
                    props: {
                      children: ['Paragraph'],
                    },
                  },
                  {
                    id: '4',
                    type: 'button',
                    props: {
                      style: { padding: 5 },
                      children: ['Click'],
                    },
                  },
                ],
              },
            },
          ],
        },
      };

      const result = await updateStylesInCode(originalCode, previewAst);

      // Should add styles to parent and specific children
      expect(result).toContain('display: "flex"');
      expect(result).toContain('color: "blue"');
      expect(result).toContain('padding: 5');
      // Should preserve all children (flexible on whitespace/formatting)
      expect(result).toContain('<h1');
      expect(result).toContain('<p>');
      expect(result).toMatch(/<button[\s>]/); // Match button tag with flexible spacing
    });

    it('should preserve TypeScript types', async () => {
      const originalCode = `
interface Props {
  name: string;
}

export default function Component({ name }: Props) {
  return <div>{name}</div>;
}`;

      const previewAst: SerializableElement = {
        id: 'wrapper',
        type: 'function',
        props: {
          children: [
            {
              id: '1',
              type: 'div',
              props: {
                style: { textAlign: 'center' },
                children: ['{name}'],
              },
            },
          ],
        },
      };

      const result = await updateStylesInCode(originalCode, previewAst);

      // Should preserve interface
      expect(result).toContain('interface Props');
      expect(result).toContain('name: string');
      // Should preserve typed props (flexible on formatting/whitespace)
      expect(result).toMatch(/\{\s*name\s*\}:\s*Props/); // Allow any whitespace
      // Should add style
      expect(result).toContain('textAlign: "center"');
    });

    it('should preserve imports and exports', async () => {
      const originalCode = `
import React, { useState } from 'react';
import { helper } from './utils';

export default function Component() {
  return <div>Content</div>;
}`;

      const previewAst: SerializableElement = {
        id: 'wrapper',
        type: 'function',
        props: {
          children: [
            {
              id: '1',
              type: 'div',
              props: {
                style: { margin: 0 },
                children: ['Content'],
              },
            },
          ],
        },
      };

      const result = await updateStylesInCode(originalCode, previewAst);

      // Should preserve imports
      expect(result).toContain("import React, { useState } from 'react'");
      expect(result).toContain("import { helper } from './utils'");
      // Should preserve export
      expect(result).toContain('export default function Component');
      // Should add style
      expect(result).toContain('margin: 0');
    });
  });
});
