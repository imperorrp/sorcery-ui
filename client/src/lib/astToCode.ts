/**
 * AST to Code Converter Module
 *
 * This module provides functionality to convert our serializable JSON AST representation
 * back into formatted JSX/TypeScript code. It's the reverse of the parsing process,
 * taking the structured data and generating human-readable, properly formatted code.
 *
 * Key Features:
 * - Converts SerializableElement AST nodes to JSX strings
 * - Handles all prop types (strings, numbers, booleans, objects, styles)
 * - Properly formats CSS-in-JS style objects
 * - Generates clean, indented JSX with proper closing tags
 * - Integrates with Prettier for code formatting and beautification
 * - Handles edge cases like corrupted nodes and complex prop values
 *
 * Architecture:
 * - astToCodeRecursive: Core recursive conversion function
 * - styleObjectToJsxString: CSS properties to JSX object string conversion
 * - generateAndFormatJsx: Prettier integration for final formatting
 * - astToCode: Main export function for backward compatibility
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

import type React from 'react';
import type { SerializableElement } from '@/store/componentStore';
import { format } from 'prettier/standalone';
import babel from 'prettier/plugins/babel';
import estree from 'prettier/plugins/estree';

/**
 * Converts a CSSProperties object into a JSX-compatible style object string.
 *
 * This function takes React's CSSProperties object and converts it to a string
 * that can be used directly in JSX style attributes. It handles the conversion
 * from JSON format to JavaScript object literal format.
 *
 * @param style - The CSS properties object to convert
 * @returns A string representation suitable for JSX style props
 * @example
 * // Input: { backgroundColor: 'red', fontSize: 14 }
 * // Output: {backgroundColor: 'red', fontSize: 14}
 */
const styleObjectToJsxString = (style: React.CSSProperties): string => {
  const styleString = JSON.stringify(style, null, 2);
  // Replace double quotes on keys with no quotes for valid JS object keys
  return styleString.replace(/"([^"]+)":/g, '$1:');
};

/**
 * Recursively converts a serializable AST node to a JSX string representation.
 *
 * This is the core conversion function that traverses the AST and generates
 * properly formatted JSX code. It handles:
 * - String literals and text nodes
 * - HTML/SVG elements with proper tag names
 * - Component elements with display names
 * - All prop types (primitives, objects, styles)
 * - Nested children with proper indentation
 * - Error handling for corrupted nodes
 *
 * @param node - The AST node to convert (SerializableElement or string)
 * @param indentLevel - Current indentation level for formatting
 * @returns A formatted JSX string representation of the node
 */
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

/**
 * Converts a serializable AST node to JSX code with optional indentation.
 *
 * This is the main export function for backward compatibility. It provides
 * a simple interface to convert AST nodes to JSX strings with customizable
 * indentation levels.
 *
 * @param node - The AST node to convert
 * @param indentLevel - Starting indentation level (default: 0)
 * @returns A JSX string representation of the AST node
 */
export const astToCode = (node: SerializableElement | string, indentLevel = 0): string => {
  return astToCodeRecursive(node, indentLevel);
};

/**
 * Generates clean, formatted JSX code from a serializable AST node using Prettier.
 *
 * This function takes a SerializableElement and produces a properly formatted,
 * production-ready JSX string. It uses Prettier for consistent code formatting
 * and handles all the edge cases that can occur with JSX formatting.
 *
 * Process:
 * 1. Generate raw JSX string from AST using astToCodeRecursive
 * 2. Wrap in a valid JavaScript statement for Prettier context
 * 3. Format with Prettier using Babel parser and JSX plugins
 * 4. Extract the formatted JSX from the wrapper statement
 * 5. Fallback to raw code if formatting fails
 *
 * @param node - The SerializableElement to convert to formatted JSX
 * @returns A Promise that resolves to a formatted JSX string
 * @throws Never - Returns raw code as fallback on formatting errors
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
