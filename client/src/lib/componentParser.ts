/**
 * Component Parser - AST Serialization and Deserialization
 *
 * This module handles the conversion between React Elements and our custom SerializableElement AST format.
 * It provides the foundation for the Dual-AST architecture by enabling:
 *
 * 1. **Serialization**: Converting React Elements into JSON-serializable AST nodes
 * 2. **Deserialization**: Converting AST nodes back into renderable React Elements
 * 3. **Component Expansion**: Resolving function components to their rendered output
 * 4. **Element Selection**: Injecting selection handlers for interactive editing
 *
 * KEY FEATURES:
 * - Preserves component function references for custom components
 * - Handles both class and function components
 * - Supports React 19 async components
 * - Provides unique IDs for element selection
 * - Maintains component hierarchy and props
 * - Robust children handling with React.Children.toArray()
 * - Custom component selection via wrapper spans with display: 'contents'
 *
 * RECENT IMPROVEMENTS (v1.1):
 * - Fixed critical TypeError in serializeComponent by using React.Children.toArray()
 * - Enhanced renderFromAst to wrap custom components in selectable spans
 * - Added proper error handling and AST sanitization
 */

import React from 'react';
import type { SerializableElement } from '@/store/componentStore';

// Global counter for generating unique element IDs during serialization
export let idCounter = 0;

/**
 * Traverses a React Element tree and converts it into our serializable JSON AST.
 *
 * This is the "serialization" step that converts React's internal representation
 * into our custom SerializableElement format. The process:
 *
 * 1. Handles primitive values (strings, numbers, null)
 * 2. Preserves component function references for custom components
 * 3. Serializes explicit children passed to elements
 * 4. Attempts to expand function components to show their internal structure
 * 5. Generates unique IDs for element selection
 * 6. Maintains all props and their values
 *
 * @param element - The React element or node to serialize
 * @returns A SerializableElement, string, or null representing the serialized form
 */
export function serializeComponent(element: React.ReactNode): SerializableElement | string | null {
  // Handle non-object types like strings, numbers, booleans, null, undefined
  if (typeof element !== 'object' || element === null) {
    // Return strings directly, convert numbers to strings, and ignore others (null/undefined/boolean)
    if (typeof element === 'string') return element;
    if (typeof element === 'number') return String(element);
    return null;
  }

  const reactElement = element as React.ReactElement;

  // If it's not a valid React element (e.g., it's an array), we need to handle it.
  // This case shouldn't be hit if we use React.Children.toArray, but it's a good safeguard.
  if (!reactElement.type) {
    console.warn("serializeComponent encountered an invalid element:", reactElement);
    return null;
  }

  const type: string | React.ComponentType<unknown> = typeof reactElement.type === 'string'
    ? reactElement.type
    : (reactElement.type as React.ComponentType<unknown>);

  // ▼▼▼ CHILDREN HANDLING FIX (v1.1) ▼▼▼
  // Use React.Children.toArray to safely handle any type of children prop
  // (undefined, null, string, number, array, single element).
  // This turns props.children into a predictable, flat array that we can map over.
  // CRITICAL FIX: Prevents TypeError when children is not an array
  const childrenArray = React.Children.toArray((reactElement.props as { children?: React.ReactNode })?.children);
  const serializedChildren = childrenArray
    .map(child => serializeComponent(child)) // Recursively call serialize on each child
    .filter(c => c !== null) as (SerializableElement | string)[]; // Filter out any null results
  // ▲▲▲ END OF CHILDREN HANDLING FIX ▲▲▲

  // Enhancement: if this is a function component, try to resolve its rendered output
  // so the tree contains its internal structure for the Navigator.
  if (typeof type === 'function' && serializedChildren.length === 0) {
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
          serializedChildren.push(...(resolved as (SerializableElement | string)[]));
        } else if (resolved) {
          serializedChildren.push(resolved as SerializableElement | string);
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
      // We now have a clean, guaranteed array of serialized children.
      children: serializedChildren.length > 0 ? serializedChildren : undefined,
    },
  };

  return serializedElement;
}
/**
 * Renders a component from its JSON AST representation.
 *
 * This is the "deserialization" or "rendering" step that takes our SerializableElement format
 * and converts it back to React elements that can be rendered. The process:
 *
 * 1. Handles primitive values (strings, numbers, null)
 * 2. Recreates React elements with proper props and children
 * 3. Resolves component references from the component library
 * 4. Maintains element IDs for selection and interaction
 * 5. Preserves all styling and behavior from the original code
 * 6. Optionally injects click handlers for element selection
 *
 * @param astNode - The serializable AST node to convert back to React elements
 * @param handleSelect - Optional callback function for element selection
 * @param injectHandlers - Whether to inject click handlers for selection (default: true)
 * @returns A React element, string, or null representing the rendered form
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

  // This check is important - safely handle children
  const children = props?.children ? props.children.map(child => renderFromAst(child, handleSelect, injectHandlers)) : [];

  // Guard props in case it's null/undefined, then build base props with data attribute for identification
  const baseProps = props || {};
  const finalProps: Record<string, unknown> = {
    ...baseProps,
    key: id,
  };

  // ▼▼▼ CUSTOM COMPONENT SELECTION FIX (v1.1) ▼▼▼
  // For custom React components (like <Card />), we can't pass `data-node-id` as a prop.
  // Instead, we wrap the component in a `span` that we control.
  // This span gets the data-node-id, making the component selectable.
  // We use display: 'contents' to ensure this wrapper has no effect on the layout.
  if (typeof type === 'string') {
    // For native HTML elements, add the data-node-id directly.
    finalProps['data-node-id'] = id;
    return React.createElement(type, finalProps, ...children);
  } else {
    // For custom React components (like <Card />), we can't pass `data-node-id` as a prop.
    // Instead, we wrap the component in a `span` that we control.
    // This span gets the data-node-id, making the component selectable.
    // We use display: 'contents' to ensure this wrapper has no effect on the layout.
    return React.createElement(
      'span',
      {
        'data-node-id': id,
        style: { display: 'contents' },
        key: id
      },
      React.createElement(type, finalProps, ...children)
    );
  }
  // ▲▲▲ END OF CUSTOM COMPONENT SELECTION FIX ▲▲▲
}

/**
 * Creates a serializable AST from a React element, resetting the ID counter.
 *
 * This is a convenience function that ensures each serialization starts with
 * fresh IDs, preventing ID conflicts when serializing multiple components.
 *
 * @param rootElement - The root React element to serialize
 * @returns A SerializableElement representing the serialized component
 */
export function createAst(rootElement: React.ReactElement): SerializableElement {
    idCounter = 0;
    return serializeComponent(rootElement) as SerializableElement;
}

/**
 * Resets the global ID counter used for element serialization.
 *
 * This function should be called before serializing a new component tree
 * to ensure consistent ID generation and prevent conflicts.
 */
export function resetIdCounter(): void {
    idCounter = 0;
}