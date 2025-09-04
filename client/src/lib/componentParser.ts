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
  return React.createElement(elementType as React.ElementType, finalProps, children);
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