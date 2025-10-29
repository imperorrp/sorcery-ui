/**
 * Component Parser Tests
 * 
 * Tests for AST serialization and deserialization functionality.
 * These are critical tests ensuring the foundation of the Dual-AST architecture works correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { serializeComponent, renderFromAst, resetIdCounter } from '../componentParser';
import type { SerializableElement } from '@/store/componentStore';

describe('componentParser', () => {
  beforeEach(() => {
    // Reset ID counter before each test for consistent IDs
    resetIdCounter();
  });

  describe('serializeComponent', () => {
    it('should serialize a simple div element', () => {
      const element = React.createElement('div', { className: 'test' }, 'Hello');
      const result = serializeComponent(element) as SerializableElement;

      expect(result).toMatchObject({
        type: 'div',
        props: {
          className: 'test',
          children: ['Hello'],
        },
      });
      expect(result.id).toBeDefined();
    });

    it('should serialize nested elements', () => {
      const element = React.createElement(
        'div',
        { className: 'parent' },
        React.createElement('span', { className: 'child' }, 'Child text')
      );
      const result = serializeComponent(element) as SerializableElement;

      expect(result.type).toBe('div');
      expect(result.props.children).toHaveLength(1);
      
      const child = result.props.children?.[0] as SerializableElement;
      expect(child.type).toBe('span');
      expect(child.props.className).toBe('child');
      expect(child.props.children).toEqual(['Child text']);
    });

    it('should handle multiple children', () => {
      const element = React.createElement(
        'div',
        null,
        React.createElement('span', null, 'First'),
        React.createElement('span', null, 'Second'),
        React.createElement('span', null, 'Third')
      );
      const result = serializeComponent(element) as SerializableElement;

      expect(result.props.children).toHaveLength(3);
      expect((result.props.children?.[0] as SerializableElement).props.children).toEqual(['First']);
      expect((result.props.children?.[1] as SerializableElement).props.children).toEqual(['Second']);
      expect((result.props.children?.[2] as SerializableElement).props.children).toEqual(['Third']);
    });

    it('should handle primitive children types', () => {
      const element = React.createElement('div', null, 'text', 42, null, undefined);
      const result = serializeComponent(element) as SerializableElement;

      // Numbers should be converted to strings, null/undefined filtered out
      expect(result.props.children).toEqual(['text', '42']);
    });

    it('should serialize style props', () => {
      const element = React.createElement('div', {
        style: { color: 'red', fontSize: 16 },
      });
      const result = serializeComponent(element) as SerializableElement;

      expect(result.props.style).toEqual({
        color: 'red',
        fontSize: 16,
      });
    });

    it('should generate unique IDs for each element', () => {
      const element = React.createElement(
        'div',
        null,
        React.createElement('span', null, 'A'),
        React.createElement('span', null, 'B')
      );
      const result = serializeComponent(element) as SerializableElement;

      const ids = new Set([
        result.id,
        (result.props.children?.[0] as SerializableElement).id,
        (result.props.children?.[1] as SerializableElement).id,
      ]);

      expect(ids.size).toBe(3); // All IDs should be unique
    });

    it('should handle empty elements', () => {
      const element = React.createElement('div');
      const result = serializeComponent(element) as SerializableElement;

      expect(result.type).toBe('div');
      expect(result.props.children || []).toEqual([]);
    });

    it('should filter out null and undefined children', () => {
      const element = React.createElement(
        'div',
        null,
        'text',
        null,
        React.createElement('span', null, 'child'),
        undefined
      );
      const result = serializeComponent(element) as SerializableElement;

      expect(result.props.children).toHaveLength(2);
      expect(result.props.children?.[0]).toBe('text');
      expect((result.props.children?.[1] as SerializableElement).type).toBe('span');
    });
  });

  describe('renderFromAst', () => {
    it('should render a simple AST node back to React element', () => {
      const ast: SerializableElement = {
        id: '1',
        type: 'div',
        props: { className: 'test', children: ['Hello'] },
      };

      const element = renderFromAst(ast, () => {}) as React.ReactElement;
      expect(element).toBeDefined();
      expect(element.type).toBe('div');
      expect((element.props as { className: string }).className).toBe('test');
    });

    it('should render nested AST nodes', () => {
      const ast: SerializableElement = {
        id: '1',
        type: 'div',
        props: {
          children: [
            {
              id: '2',
              type: 'span',
              props: { className: 'child', children: ['Text'] },
            },
          ],
        },
      };

      const element = renderFromAst(ast, () => {}) as React.ReactElement;
      expect(element.type).toBe('div');
      expect((element.props as { children: unknown }).children).toBeDefined();
    });

    it('should add data-node-id for element identification', () => {
      const ast: SerializableElement = {
        id: '1',
        type: 'div',
        props: { children: [] },
      };

      const element = renderFromAst(ast, () => {}) as React.ReactElement;
      
      // Verify the data-node-id is attached for selection
      const props = element.props as { 'data-node-id': string };
      expect(props['data-node-id']).toBe('1');
      expect(element.type).toBe('div');
    });

    it('should preserve style props', () => {
      const ast: SerializableElement = {
        id: '1',
        type: 'div',
        props: {
          style: { color: 'blue', padding: 10 },
          children: [],
        },
      };

      const element = renderFromAst(ast, () => {}) as React.ReactElement;
      expect((element.props as { style: React.CSSProperties }).style).toEqual({
        color: 'blue',
        padding: 10,
      });
    });

    it('should handle mixed children (text and elements)', () => {
      const ast: SerializableElement = {
        id: '1',
        type: 'div',
        props: {
          children: [
            'Text before',
            {
              id: '2',
              type: 'span',
              props: { children: ['Middle'] },
            },
            'Text after',
          ],
        },
      };

      const element = renderFromAst(ast, () => {}) as React.ReactElement;
      expect((element.props as { children: unknown[] }).children).toHaveLength(3);
    });
  });

  describe('Round-trip serialization', () => {
    it('should maintain structure through serialize -> render cycle', () => {
      const original = React.createElement(
        'div',
        { className: 'container' },
        React.createElement('h1', null, 'Title'),
        React.createElement('p', { style: { color: 'red' } }, 'Paragraph')
      );

      // Serialize
      const ast = serializeComponent(original) as SerializableElement;

      // Verify AST structure
      expect(ast.type).toBe('div');
      expect(ast.props.children).toHaveLength(2);

      // Render back
      const rendered = renderFromAst(ast, () => {}) as React.ReactElement;

      // Verify structure is maintained
      expect(rendered.type).toBe('div');
      expect((rendered.props as { className: string }).className).toBe('container');
    });
  });
});
