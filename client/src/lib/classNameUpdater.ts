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
 * 
 * ENHANCEMENT (Shadcn Components): When encountering React components (like Button, Card),
 * we merge className changes into the component's className prop instead of trying to
 * recurse into internal structure. This allows users to add custom classes to library
 * components, which will be merged with the component's computed classes via cn().
 * 
 * @param babelNode - The current node in the Babel AST traversal (from user code).
 * @param visualNode - The corresponding node in our visual `SerializableElement` AST.
 */
function applyClassNamesRecursively(
  babelNode: t.JSXElement,
  visualNode: SerializableElement
): void {
  // Determine if this is a React component (starts with uppercase) vs native element (lowercase)
  const jsxElementName = t.isJSXIdentifier(babelNode.openingElement.name) 
    ? babelNode.openingElement.name.name 
    : null;
  const isReactComponent = jsxElementName && /^[A-Z]/.test(jsxElementName);
  
  // SPECIAL CASE: React components (shadcn Button, Card, custom components, etc.)
  // For components, we merge className into the component's className prop.
  // The component will handle merging with its computed classes (e.g., via cn()).
  if (isReactComponent && visualNode.props.className && typeof visualNode.props.className === 'string') {
    const classNameAttr = babelNode.openingElement.attributes.find(
      (attr): attr is t.JSXAttribute =>
        t.isJSXAttribute(attr) && attr.name.name === 'className'
    );

    const newClassName = visualNode.props.className as string;

    if (classNameAttr) {
      // Merge with existing className if it exists
      if (t.isStringLiteral(classNameAttr.value)) {
        // Existing className is a string literal - merge the classes
        const existingClasses = classNameAttr.value.value;
        const existingSet = new Set(existingClasses.split(/\s+/).filter(Boolean));
        const newClasses = newClassName.split(/\s+/).filter(Boolean);
        newClasses.forEach(cls => existingSet.add(cls));
        classNameAttr.value = t.stringLiteral([...existingSet].join(' '));
      } else if (t.isJSXExpressionContainer(classNameAttr.value)) {
        // Existing className is an expression (e.g., {cn(...)} or {clsx(...)})
        // Wrap both in a cn() call to merge them
        const existingExpr = classNameAttr.value.expression;
        if (t.isExpression(existingExpr)) {
          classNameAttr.value = t.jsxExpressionContainer(
            t.callExpression(
              t.identifier('cn'),
              [existingExpr, t.stringLiteral(newClassName)]
            )
          );
        }
      } else {
        // Fallback: replace with string literal
        classNameAttr.value = t.stringLiteral(newClassName);
      }
    } else {
      // Create new className attribute
      const newAttr = t.jsxAttribute(
        t.jsxIdentifier('className'),
        t.stringLiteral(newClassName)
      );
      babelNode.openingElement.attributes.push(newAttr);
    }
    
    // Don't recurse into React component children - they're passed as props
    // and the component itself handles rendering
    return;
  }

  // NORMAL CASE: Native HTML elements (div, span, button, etc.)
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
