import type React from 'react';
import type { SerializableElement } from '@/store/componentStore';

// Helper to convert a CSSProperties object back into a JSX-compatible object string
const styleObjectToJsxString = (style: React.CSSProperties): string => {
  const styleString = JSON.stringify(style, null, 2);
  // Replace double quotes on keys with no quotes for valid JS object keys
  return styleString.replace(/"([^"]+)":/g, '$1:');
};

// Main function to convert a serializable AST node to a JSX string
export const astToCode = (node: SerializableElement | string, indentLevel = 0): string => {
  const indent = ' '.repeat(indentLevel * 2);

  // Handle string children (like text nodes)
  if (typeof node === 'string') {
    // Wrap text in {} if it contains characters that might be interpreted as JSX
    return node.includes('{') ? `${indent}{'${node}'}` : indent + node;
  }

  // Gracefully handle corrupted or invalid nodes
  if (typeof node !== 'object' || node === null || !('type' in node)) {
    console.warn('astToCode encountered a corrupted node and will skip it.', node);
    return '';
  }

  const { type, props } = node as SerializableElement;
  // For the preview AST, 'type' will be a string like 'div', 'h1', etc.
  // This fallback to 'Component' is a safety measure.
  const tagName = typeof type === 'string' ? type : ((type as React.ComponentType<unknown>).displayName ?? 'Component');

  let propsString = '';
  if (props) {
    const propParts = Object.entries(props)
      .filter(([key]) => key !== 'children')
      .map(([key, value]) => {
        // Handle the style prop specially to format it as a JSX object
        if (key === 'style' && typeof value === 'object' && value !== null && Object.keys(value as object).length > 0) {
          return `style={${styleObjectToJsxString(value as React.CSSProperties)}}`;
        }
        // Handle other prop types
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        }
        if (typeof value === 'boolean' && value) {
          return key; // For boolean props like `disabled`
        }
        if (typeof value === 'number') {
          return `${key}={${value}}`;
        }
        // Omit complex props like functions (e.g., onClick) which we can't reconstruct
        return null;
      })
      .filter(Boolean) as string[];

    if (propParts.length > 0) {
      propsString = ' ' + propParts.join(' ');
    }
  }

  const children = (props?.children || []) as (SerializableElement | string)[];

  if (children.length === 0) {
    return `${indent}<${tagName}${propsString} />`;
  }

  const childrenString = children
    .map((child) => astToCode(child, indentLevel + 1))
    .filter(Boolean) // Filter out any empty strings from corrupted children
    .join('\n');

  return `${indent}<${tagName}${propsString}>\n${childrenString}\n${indent}</${tagName}>`;
};
