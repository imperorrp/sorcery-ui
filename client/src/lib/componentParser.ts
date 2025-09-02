/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { SerializableElement } from '@/store/componentStore';

// We use a simple counter to ensure unique IDs for each element during a serialization session.
export let idCounter = 0;

/**
 * Traverses a React Element tree and converts it into our serializable JSON AST.
 * This is the "serialization" step.
 */
export function serializeComponent(element: React.ReactNode): SerializableElement | string | null {
  console.log('serializeComponent called with element:', element);
  if (typeof element !== 'object' || element === null) {
    return typeof element === 'number' ? String(element) : (element as string | null);
  }

  const reactElement = element as React.ReactElement;

  // Preserve the actual component function for custom components so we can
  // re-create them during deserialization instead of turning them into tag names.
  const type: string | React.ComponentType<unknown> = typeof reactElement.type === 'string'
    ? reactElement.type
    : (reactElement.type as React.ComponentType<unknown>);
  // Default: serialize explicit children passed to this element
  let serializedChildren = React.Children.map((reactElement.props as { children?: React.ReactNode }).children, serializeComponent);
  // Enhancement: if this is a function component, try to resolve its rendered output
  // so the tree contains its internal structure for the Navigator.
  if (typeof type === 'function' && (!serializedChildren || serializedChildren.length === 0)) {
    try {
      // Try to expand function components by calling them.
      // Note: This may throw for hook-using components; we'll catch and ignore.
      let rendered: React.ReactNode | null = null;
      const componentType = type as React.ComponentType<unknown>;
      if (componentType.prototype && (componentType.prototype.isReactComponent || typeof componentType.prototype.render === 'function')) {
        // Class component: instantiate and call render()
        const instance = new (componentType as React.ComponentClass<unknown>)(reactElement.props);
        rendered = instance.render?.();
      } else {
        // Function component - handle both sync and async components (React 19)
        const result = (componentType as React.FunctionComponent<unknown>)(reactElement.props);
        rendered = result instanceof Promise ? null : result; // Skip async components for now
      }
      if (rendered) {
        const resolved = serializeComponent(rendered);
        if (Array.isArray(resolved)) {
          serializedChildren = resolved as (SerializableElement | string)[];
        } else if (resolved) {
          serializedChildren = [resolved as SerializableElement | string];
        }
      }
    } catch {
      // Ignore expansion failures (likely due to hooks); leave children as-is.
    }
  }

  const serializedElement: SerializableElement = {
    id: `node-${idCounter++}`,
    type: type,
    props: {
      ...((reactElement.props as Record<string, unknown>) || {}),
      children: serializedChildren?.filter(c => c !== null) as (SerializableElement | string)[] | undefined,
    },
  };

  return serializedElement;
}
/**
 * Renders a component from its JSON AST representation.
 * This is the "deserialization" or "rendering" step.
 */
export function renderFromAst(
  astNode: SerializableElement | string | null,
  handleSelect?: (nodeId: string) => void,
  injectHandlers = true
): React.ReactNode {
  if (typeof astNode === 'string' || astNode === null) {
    return astNode;
  }

  const { id, type, props } = astNode;

  const children = props?.children?.map(child => renderFromAst(child, handleSelect, injectHandlers));

  // Guard props in case it's null/undefined, then build base props with data attribute for identification
  const baseProps = props || {};
  const finalProps: Record<string, unknown> = {
    ...baseProps,
    key: id,
  };
  
  // Only add data-node-id attribute for DOM elements (string types), not function components
  if (typeof type === 'string') {
    finalProps['data-node-id'] = id;
  }

  // Only inject onClick handler if we're in selection mode and handleSelect is provided
  if (injectHandlers && handleSelect) {
    finalProps.onClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleSelect(id);
    };
  }

  const elementType = typeof type === 'string' ? type : type;
  return React.createElement(elementType as any, finalProps, children);
}

// Helper to reset the counter before serializing a new component
export function createAst(rootElement: React.ReactElement): SerializableElement {
    idCounter = 0;
    return serializeComponent(rootElement) as SerializableElement;
}

// Helper to reset the counter
export function resetIdCounter(): void {
    idCounter = 0;
}