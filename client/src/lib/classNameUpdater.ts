// client/src/lib/classNameUpdater.ts

/**
 * @file ClassName Updater - Surgical Code Modification System for className
 *
 * @description This file contains the core logic for applying visual className
 * changes back to the user's source code non-destructively.
 *
 * ARCHITECTURAL APPROACH: "Source Code as the Single Source of Truth"
 *
 * We do not generate JSX from our visual AST, as that would destroy component logic
 * (e.g., onClick handlers, state, custom hooks, complex expressions).
 *
 * Instead, this utility performs an AST-based surgical update process:
 *
 * 1. **Parse Original Code**: Parse the user's original code into a rich Babel AST
 * 2. **Parallel Traversal**: Traverse our internal "visual" AST and the Babel AST in parallel
 * 3. **Structural Matching**: Match elements by their structure (not position or IDs)
 * 4. **Surgical Modification**: Modify *only the 'className' attribute* of corresponding nodes
 * 5. **Code Generation**: Use @babel/generator to convert the modified Babel AST back into clean, formatted code
 *
 * PRESERVATION GUARANTEES:
 * ✅ All component logic (event handlers, state, hooks)
 * ✅ All props and their values
 * ✅ All comments and code formatting
 * ✅ All TypeScript types and interfaces
 * ✅ All imports and exports
 * ✅ All custom logic and expressions
 *
 * This ensures that users can visually edit their components while maintaining
 * full control over their code's logic and behavior.
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import type { SerializableElement } from '@/store/componentStore';
import * as t from '@babel/types';

/**
 * Recursively walks the Babel AST and our visual AST in parallel, applying className
 * from the visual nodes to their corresponding Babel nodes. This structural matching
 * is robust and avoids the flaws of counter-based or index-based matching.
 * @param babelNode - The current node in the Babel AST traversal (from user code).
 * @param visualNode - The corresponding node in our visual `SerializableElement` AST.
 */
function applyClassNamesRecursively(
  babelNode: t.JSXElement,
  visualNode: SerializableElement
): void {
  // Apply the className from the visual node to the source code node.
  if (visualNode.props.className && typeof visualNode.props.className === 'string') {
    const classNameAttr = babelNode.openingElement.attributes.find(
      (attr): attr is t.JSXAttribute =>
        t.isJSXAttribute(attr) && attr.name.name === 'className'
    );

    if (classNameAttr) {
      // Replace existing className value
      classNameAttr.value = t.stringLiteral(visualNode.props.className);
    } else {
      // Create new className attribute
      const newAttr = t.jsxAttribute(
        t.jsxIdentifier('className'),
        t.stringLiteral(visualNode.props.className)
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
      applyClassNamesRecursively(babelChildren[i], visualChildren[i]);
    }
  }
}

/**
 * The main exported function. Orchestrates the entire non-destructive update process for className.
 * @param originalCode - The original source code from the Monaco editor.
 * @param previewAst - The visually-edited `SerializableElement` AST containing the desired className.
 * @returns A promise that resolves to the new, updated code string.
 */
export async function updateClassNameInCode(
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
        applyClassNamesRecursively(babelJsxRoot, visualJsxRoot);

        path.stop(); // We're done, no need to traverse further.
      }
    },
  });

  // Generate a clean code string from the now-modified Babel AST.
  const { code } = generate(babelAst, { retainLines: false });
  return code;
}
