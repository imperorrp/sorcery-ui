// client/src/lib/styleUpdater.ts

/**
 * @file This file contains the core logic for the application's most critical feature:
 * applying visual style changes back to the user's source code non-destructively.
 *
 * @description The architectural approach here is "Source Code as the Single Source of Truth".
 * We do not generate JSX from our visual AST, as that would destroy component logic (e.g., onClick handlers, state).
 * Instead, this utility performs an AST-based surgical update:
 * 1. It parses the user's original code into a rich Babel Abstract Syntax Tree (AST).
 * 2. It traverses our internal, "visual" AST and the Babel AST in parallel.
 * 3. By matching the structure of the two trees, it precisely locates the corresponding nodes.
 * 4. It modifies *only the 'style' attribute* of the relevant nodes within the Babel AST.
 * 5. It uses `@babel/generator` to convert the modified Babel AST back into a clean, formatted code string.
 *
 * This ensures that all component logic, props, and comments are preserved perfectly.
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import type { SerializableElement } from '@/store/componentStore';
import * as t from '@babel/types';

/**
 * Converts a standard CSSProperties object into a Babel AST object expression
 * that can be injected back into the code.
 * @param style - The React.CSSProperties object.
 * @returns A Babel AST node representing a JavaScript object.
 */
function styleObjectToAst(style: React.CSSProperties): t.ObjectExpression {
  const properties: t.ObjectProperty[] = Object.entries(style).map(([key, value]) => {
    let valueNode: t.Expression;
    if (typeof value === 'string') {
      valueNode = t.stringLiteral(value);
    } else if (typeof value === 'number') {
      valueNode = t.numericLiteral(value);
    } else {
      valueNode = t.stringLiteral(String(value));
    }
    return t.objectProperty(t.identifier(key), valueNode);
  });
  return t.objectExpression(properties);
}

/**
 * Recursively walks the Babel AST and our visual AST in parallel, applying styles
 * from the visual nodes to their corresponding Babel nodes. This structural matching
 * is robust and avoids the flaws of counter-based or index-based matching.
 * @param babelNode - The current node in the Babel AST traversal (from user code).
 * @param visualNode - The corresponding node in our visual `SerializableElement` AST.
 */
function applyStylesRecursively(
  babelNode: t.JSXElement,
  visualNode: SerializableElement
): void {
  // Apply the style from the visual node to the source code node.
  if (visualNode.props.style) {
    const styleAttr = babelNode.openingElement.attributes.find(
      (attr): attr is t.JSXAttribute =>
        t.isJSXAttribute(attr) && attr.name.name === 'style'
    );
    const newStyleAst = styleObjectToAst(visualNode.props.style);

    if (styleAttr) {
      styleAttr.value = t.jsxExpressionContainer(newStyleAst);
    } else {
      const newAttr = t.jsxAttribute(
        t.jsxIdentifier('style'),
        t.jsxExpressionContainer(newStyleAst)
      );
      babelNode.openingElement.attributes.push(newAttr);
    }
  }

  // Get the children of both nodes that are actual JSX elements, ignoring text/whitespace.
  const babelChildren = babelNode.children.filter(
    (c): c is t.JSXElement => t.isJSXElement(c)
  );
  const visualChildren = (visualNode.props.children || []).filter(
    (c): c is SerializableElement => typeof c !== 'string'
  );

  // If the number of element children match, we can safely recurse.
  if (babelChildren.length === visualChildren.length) {
    for (let i = 0; i < babelChildren.length; i++) {
      applyStylesRecursively(babelChildren[i], visualChildren[i]);
    }
  }
}

/**
 * The main exported function. Orchestrates the entire non-destructive update process.
 * @param originalCode - The original source code from the Monaco editor.
 * @param previewAst - The visually-edited `SerializableElement` AST containing the desired styles.
 * @returns A promise that resolves to the new, updated code string.
 */
export async function updateStylesInCode(
  originalCode: string,
  previewAst: SerializableElement
): Promise<string> {
  const babelAst = parse(originalCode, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  // Our visual AST's root is the component function wrapper. The actual JSX is its first child.
  const visualJsxRoot = previewAst.props.children?.find(
    (c): c is SerializableElement => typeof c !== 'string'
  );

  if (!visualJsxRoot) {
    throw new Error("Could not find root JSX element in the visual AST.");
  }

  traverse(babelAst, {
    // Find the main return statement of the component.
    ReturnStatement(path) {
      if (path.node.argument && t.isJSXElement(path.node.argument)) {
        // This is the root JSX element in the source code.
        const babelJsxRoot = path.node.argument;

        // Begin the robust, recursive update process.
        applyStylesRecursively(babelJsxRoot, visualJsxRoot);

        path.stop(); // We're done, no need to traverse further.
      }
    },
  });

  // Generate a clean code string from the now-modified Babel AST.
  const { code } = generate(babelAst, { retainLines: false });
  return code;
}
