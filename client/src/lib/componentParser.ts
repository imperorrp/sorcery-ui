import React from 'react';
import type { SerializableElement } from '@/store/componentStore';

// We use a simple counter to ensure unique IDs for each element during a serialization session.
let idCounter = 0;

/**
 * Traverses a React Element tree and converts it into our serializable JSON AST.
 * This is the "serialization" step.
 */
export function serializeComponent(element: React.ReactNode): SerializableElement | string | null {
  if (typeof element !== 'object' || element === null) {
    return typeof element === 'number' ? String(element) : (element as string | null);
  }

  const reactElement = element as React.ReactElement;

  // Preserve the actual component function for custom components so we can
  // re-create them during deserialization instead of turning them into tag names.
  const type: string | React.ComponentType<any> = typeof reactElement.type === 'string'
    ? reactElement.type
    : (reactElement.type as React.ComponentType<any>);

  const serializedChildren = React.Children.map((reactElement.props as { children?: React.ReactNode }).children, serializeComponent);

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
  handleSelect: (nodeId: string) => void
): React.ReactNode {
  if (typeof astNode === 'string' || astNode === null) {
    return astNode;
  }

  const { id, type, props } = astNode;

  const children = props.children?.map(child => renderFromAst(child, handleSelect));

  // We inject special props into every rendered element:
  // - A data attribute for identification (`data-node-id`).
  // - An onClick handler to enable selection.
  const injectedProps = {
    ...props,
    'data-node-id': id,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent parent handlers from firing
      handleSelect(id);
    },
  };

  // If `type` is a component function/class, use it directly. If it's a string
  // (native element) then React.createElement will render it as such.
  const elementType = typeof type === 'string' ? type : type;

  return React.createElement(elementType as any, { ...injectedProps, key: id }, children);
}

// Helper to reset the counter before serializing a new component
export function createAst(rootElement: React.ReactElement): SerializableElement {
    idCounter = 0;
    return serializeComponent(rootElement) as SerializableElement;
}