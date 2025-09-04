/**
 * Code Updater Library - Surgical String Replacement Approach
 *
 * This module implements a "Surgical String Replacement" strategy for updating component code
 * based on AST changes. Instead of regenerating the entire code from scratch, it makes precise
 * modifications to the original source string by:
 *
 * 1. Parsing the original code with Babel to understand its structure
 * 2. Identifying the exact locations of style attributes in JSX elements
 * 3. Applying targeted string replacements to update only the changed styles
 * 4. Preserving all other code formatting, comments, and structure
 *
 * Key Features:
 * - Precise style updates without affecting other code
 * - Maintains original formatting and comments
 * - Handles both existing and new style attributes
 * - Robust error handling with fallbacks
 * - Uses Babel AST traversal for accurate element identification
 *
 * FRAGILITY WARNING:
 * This approach relies on Babel's ability to parse and traverse the original code accurately.
 * It can be sensitive to:
 * - Complex formatting or unusual whitespace patterns
 * - Conditional logic within JSX (ternaries, logical operators)
 * - Dynamic style objects or complex expressions
 * - Nested component structures with similar element patterns
 *
 * Future developers should be aware that this method may require updates if the codebase
 * introduces more complex JSX patterns or if Babel parsing becomes unreliable.
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

import type { SerializableElement } from '@/store/componentStore';
import type { NodePath } from '@babel/traverse';
import type { JSXOpeningElement, JSXAttribute, JSXIdentifier } from '@babel/types';

interface Change {
  start: number;
  end: number;
  text: string;
}

/**
 * Converts a React CSSProperties object to a JSX style object string.
 *
 * This helper function transforms a CSS properties object into a string format
 * that can be used directly in JSX style attributes. It converts JSON-style
 * quoted keys to JavaScript object literal format.
 *
 * @param style - The CSS properties object to convert
 * @returns A formatted style object string like "{ color: 'red', fontSize: 14 }"
 * @example
 * // Input: { backgroundColor: 'blue', fontSize: 16 }
 * // Output: "{backgroundColor: 'blue', fontSize: 16}"
 */
const styleObjectToString = (style: React.CSSProperties): string => {
  const styleString = JSON.stringify(style, null, 2);
  // Convert to valid JSX style object by removing quotes from keys
  return styleString.replace(/"([^"]+)":/g, '$1:');
};

/**
 * Updates the original code string with style changes from the preview AST.
 *
 * This function performs surgical updates to the source code by:
 * 1. Parsing the original code with Babel to recreate the AST structure
 * 2. Traversing the JSX elements and matching them with nodes in the preview AST
 * 3. Collecting precise string replacement operations for style changes
 * 4. Applying all changes in reverse order to maintain character indices
 *
 * The process ensures that only style attributes are modified while preserving
 * all other code structure, formatting, and logic.
 *
 * Key Features:
 * - Precise style updates without regenerating entire code
 * - Maintains original formatting, comments, and whitespace
 * - Handles both existing style attributes and new ones
 * - Robust error handling with detailed logging
 * - Uses dynamic imports to avoid process reference issues
 *
 * @param originalCode - The original source code string from the editor
 * @param previewAst - The preview AST containing updated style information
 * @returns The updated code string with applied style changes, or null if update fails
 * @throws Never - Returns null on errors instead of throwing
 */
export const updateCodeWithStyles = async (
  originalCode: string,
  previewAst: SerializableElement
): Promise<string | null> => {
  if (!originalCode || !previewAst) {
    console.error("updateCodeWithStyles: Missing required parameters");
    return null;
  }

  try {
    // Use dynamic imports to avoid process reference before shim loads
    const [{ parse }, traverseModule] = await Promise.all([
      import('@babel/parser'),
      import('@babel/traverse'),
    ]);
    const traverseFn = traverseModule.default || traverseModule;

    if (!traverseFn || typeof traverseFn !== 'function') {
      console.error('Failed to load Babel traverse function');
      return null;
    }

    const babelAst = parse(originalCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    if (!babelAst) {
      console.error('Failed to parse code with Babel');
      return null;
    }

    const changes: Change[] = [];
    const styleMap = new Map<string, React.CSSProperties>();

    // 1. Create a map of which node ID has which new style
    const collectStyles = (node: SerializableElement | string) => {
      if (typeof node !== 'string' && node.props.style && node.id) {
        styleMap.set(node.id, node.props.style);
      }
      if (typeof node !== 'string' && node.props.children) {
        node.props.children.forEach(collectStyles);
      }
    };
    collectStyles(previewAst);

    // 2. Traverse the code's AST. We must re-generate the IDs in the exact same
    //    way the renderer did to ensure they match.
    let idCounter = 0;

    try {
      traverseFn(babelAst, {
        JSXOpeningElement(path: NodePath<JSXOpeningElement>) {
          // This is how we ensure the ID matches the one in our previewAst
          const nodeId = `node-${idCounter++}`;
          const newStyle = styleMap.get(nodeId);

          if (newStyle) {
            const styleAttr = path.node.attributes.find(
              (attr): attr is JSXAttribute => attr.type === 'JSXAttribute' &&
                attr.name.type === 'JSXIdentifier' &&
                (attr.name as JSXIdentifier).name === 'style'
            );

            const newStyleString = `style={${styleObjectToString(newStyle)}}`;

            if (styleAttr && styleAttr.start != null && styleAttr.end != null) {
              // If style prop exists, record a change to replace it
              changes.push({
                start: styleAttr.start,
                end: styleAttr.end,
                text: newStyleString,
              });
            } else if (path.node.start != null) {
              // If style prop does not exist, add it before the closing ">"
              const tagName = path.node.name.type === 'JSXIdentifier' ? (path.node.name as JSXIdentifier).name : 'unknown';
              const insertPos = path.node.selfClosing
                ? path.node.start + tagName.length + 1
                : (path.node.end ?? path.node.start + tagName.length + 1) - 1;
              changes.push({
                start: insertPos,
                end: insertPos,
                text: ` ${newStyleString}`,
              });
            }
          }
        },
      });
    } catch (traverseError) {
      console.error("Error during Babel traversal:", traverseError);
      return null;
    }

    // 3. Apply the collected changes to the original code string
    // We go in reverse order so that character indices don't get messed up
    let updatedCode = originalCode;
    for (const change of changes.sort((a, b) => b.start - a.start)) {
      updatedCode =
        updatedCode.slice(0, change.start) + change.text + updatedCode.slice(change.end);
    }

    return updatedCode;
  } catch (error) {
    console.error("Failed to update code with styles:", error);
    return null;
  }
};
