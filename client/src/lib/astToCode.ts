import type React from 'react';
import type { SerializableElement } from '@/store/componentStore';
import { format } from 'prettier/standalone';
import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';

// Helper to convert a CSSProperties object back into a JSX-compatible object string
const styleObjectToJsxString = (style: React.CSSProperties): string => {
  const styleString = JSON.stringify(style, null, 2);
  // Replace double quotes on keys with no quotes for valid JS object keys
  return styleString.replace(/"([^"]+)":/g, '$1:');
};

// Main function to convert a serializable AST node to a JSX string
const astToCodeRecursive = (node: SerializableElement | string, indentLevel = 0): string => {
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
        // Handle boolean props - only include if true
        if (typeof value === 'boolean') {
          return value ? key : null; // e.g., disabled, checked
        }
        // Handle string props
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        }
        // Handle number props - wrap in curly braces
        if (typeof value === 'number') {
          return `${key}={${value}}`;
        }
        // Handle object props (excluding style which is handled above)
        if (typeof value === 'object' && value !== null && key !== 'style') {
          return `${key}={${JSON.stringify(value)}}`;
        }
        // Handle undefined/null - omit these props
        if (value == null) {
          return null;
        }
        // For any other type, try to stringify
        try {
          return `${key}={${JSON.stringify(value)}}`;
        } catch {
          // If we can't stringify, omit the prop
          console.warn(`Could not serialize prop ${key} with value:`, value);
          return null;
        }
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
    .map((child) => astToCodeRecursive(child, indentLevel + 1))
    .filter(Boolean) // Filter out any empty strings from corrupted children
    .join('\n');

  return `${indent}<${tagName}${propsString}>\n${childrenString}\n${indent}</${tagName}>`;
};

// Export the main function for backward compatibility
export const astToCode = (node: SerializableElement | string, indentLevel = 0): string => {
  return astToCodeRecursive(node, indentLevel);
};

/**
 * Takes a serializable AST node and generates a clean, formatted JSX string.
 * This is the final, robust version that correctly handles all Prettier edge cases.
 * @param node The SerializableElement to convert into code.
 * @returns A promise that resolves to a formatted JSX string.
 */
export async function generateAndFormatJsx(node: SerializableElement): Promise<string> {
  // 1. Generate the raw, unformatted JSX string from the AST.
  const rawCode = astToCodeRecursive(node);

  try {
    // 2. Create a full, valid JavaScript statement. By wrapping our JSX in
    //    `const temp = (...)`, we give Prettier the full context it needs.
    //    It will no longer add a defensive leading semicolon.
    const wrappedCode = `const temp = (${rawCode});`;

    // 3. Format the entire, valid statement.
    const formattedStatement = await format(wrappedCode, {
      parser: 'babel',
      plugins: [babel, estree],
      semi: true, // We can safely use standard prettier options now.
      singleQuote: true,
      jsxSingleQuote: true,
    });

    // 4. Instead of brittle slicing, we reliably find the first parenthesis
    //    and the last parenthesis to extract the pure, formatted JSX.
    const firstParenIndex = formattedStatement.indexOf('(');
    const lastParenIndex = formattedStatement.lastIndexOf(')');

    if (firstParenIndex !== -1 && lastParenIndex > firstParenIndex) {
      const extractedJsx = formattedStatement.substring(
        firstParenIndex + 1,
        lastParenIndex
      );
      // Return the final, clean, trimmed result.
      return extractedJsx.trim();
    }

    // This is a fallback in the unlikely case the extraction fails.
    return rawCode;

  } catch (error) {
    console.error("Code formatting with Prettier failed:", error);
    return rawCode; // Fallback to the unformatted code on error.
  }
}
