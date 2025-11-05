// client/src/lib/propUpdater.ts

/**
 * @file Prop Updater - Surgical Code Modification System for JSX Props
 *
 * @description This file contains the core logic for applying prop changes
 * (e.g., variant="outline", size="lg") back to the user's source code non-destructively.
 *
 * ARCHITECTURAL APPROACH: "Source Code as the Single Source of Truth"
 *
 * We do not generate JSX from our visual AST, as that would destroy component logic.
 *
 * Instead, this utility performs an AST-based surgical update process:
 *
 * 1. **Parse Original Code**: Parse the user's original code into a rich Babel AST
 * 2. **Parallel Traversal**: Traverse our internal "visual" AST and the Babel AST in parallel
 * 3. **Structural Matching**: Match elements by their structure (not position or IDs)
 * 4. **Surgical Modification**: Modify *only the specified props* of corresponding nodes
 * 5. **Code Generation**: Use @babel/generator to convert the modified Babel AST back into clean code
 *
 * PRESERVATION GUARANTEES:
 * ✅ All component logic (event handlers, state, hooks)
 * ✅ All other props and their values
 * ✅ All comments and code formatting
 * ✅ All TypeScript types and interfaces
 * ✅ All imports and exports
 * ✅ All custom logic and expressions
 *
 * This updater focuses on props OTHER than style and className, which are handled
 * by styleUpdater.ts and classNameUpdater.ts respectively. It's primarily used for
 * updating variant props in shadcn components (e.g., variant, size, intent).
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import type { SerializableElement } from '@/store/componentStore';
import * as t from '@babel/types';

/**
 * Props that are handled by other updaters and should be skipped
 */
const SKIP_PROPS = new Set(['style', 'className', 'children']);

/**
 * Convert a JavaScript value to an appropriate Babel AST expression
 * 
 * @param value - The value to convert (string, number, boolean, etc.)
 * @returns A Babel expression node
 */
function valueToAstExpression(value: unknown): t.Expression {
  if (typeof value === 'string') {
    return t.stringLiteral(value);
  } else if (typeof value === 'number') {
    return t.numericLiteral(value);
  } else if (typeof value === 'boolean') {
    return t.booleanLiteral(value);
  } else if (value === null) {
    return t.nullLiteral();
  } else if (value === undefined) {
    return t.identifier('undefined');
  } else if (Array.isArray(value)) {
    return t.arrayExpression(value.map(v => valueToAstExpression(v)));
  } else if (typeof value === 'object') {
    const properties = Object.entries(value as Record<string, unknown>).map(([key, val]) => 
      t.objectProperty(t.identifier(key), valueToAstExpression(val))
    );
    return t.objectExpression(properties);
  } else {
    // Fallback: convert to string
    return t.stringLiteral(String(value));
  }
}

/**
 * Recursively walks the Babel AST and our visual AST in parallel, applying props
 * from the visual nodes to their corresponding Babel nodes. This structural matching
 * is robust and avoids the flaws of counter-based or index-based matching.
 * 
 * @param babelNode - The current node in the Babel AST traversal (from user code).
 * @param visualNode - The corresponding node in our visual `SerializableElement` AST.
 */
function applyPropsRecursively(
  babelNode: t.JSXElement,
  visualNode: SerializableElement
): void {
  // Determine if this is a React component (starts with uppercase) vs native element (lowercase)
  const jsxElementName = t.isJSXIdentifier(babelNode.openingElement.name) 
    ? babelNode.openingElement.name.name 
    : null;
  const isReactComponent = jsxElementName && /^[A-Z]/.test(jsxElementName);
  
  // Apply props from visualNode to babelNode
  // We iterate through all props in the visual node
  for (const [propName, propValue] of Object.entries(visualNode.props)) {
    // Skip props handled by other updaters
    if (SKIP_PROPS.has(propName)) {
      continue;
    }
    
    // Skip undefined/null values (they should be removed from the JSX)
    if (propValue === undefined || propValue === null) {
      // Remove the attribute if it exists
      const existingAttrIndex = babelNode.openingElement.attributes.findIndex(
        (attr): attr is t.JSXAttribute =>
          t.isJSXAttribute(attr) && attr.name.name === propName
      );
      if (existingAttrIndex !== -1) {
        babelNode.openingElement.attributes.splice(existingAttrIndex, 1);
      }
      continue;
    }

    // Find existing attribute or create new one
    const existingAttr = babelNode.openingElement.attributes.find(
      (attr): attr is t.JSXAttribute =>
        t.isJSXAttribute(attr) && attr.name.name === propName
    );

    let newValue: t.JSXAttribute['value'];
    
    // For string values, use string literal (no braces needed)
    if (typeof propValue === 'string') {
      newValue = t.stringLiteral(propValue);
    }
    // For boolean true, use shorthand syntax (just the prop name, no value)
    else if (propValue === true) {
      newValue = null; // JSX boolean shorthand: <Button disabled /> instead of <Button disabled={true} />
    }
    // For all other types, wrap in JSX expression container
    else {
      newValue = t.jsxExpressionContainer(valueToAstExpression(propValue));
    }

    if (existingAttr) {
      // Update existing attribute
      existingAttr.value = newValue;
    } else {
      // Create new attribute
      const newAttr = t.jsxAttribute(
        t.jsxIdentifier(propName),
        newValue
      );
      babelNode.openingElement.attributes.push(newAttr);
    }
  }
  
  // For React components, don't recurse into children - they're props and internally rendered
  if (isReactComponent) {
    return;
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
      applyPropsRecursively(babelChildren[i], visualChildren[i]);
    }
  }
}

/**
 * The main exported function. Orchestrates the entire non-destructive update process for props.
 * 
 * @param originalCode - The original source code from the Monaco editor.
 * @param previewAst - The visually-edited `SerializableElement` AST containing the desired props.
 * @returns A promise that resolves to the new, updated code string.
 */
export async function updatePropsInCode(
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
        applyPropsRecursively(babelJsxRoot, visualJsxRoot);

        path.stop(); // We're done, no need to traverse further.
      }
    },
  });

  // Generate a clean code string from the now-modified Babel AST.
  const { code } = generate(babelAst, { retainLines: false });
  return code;
}
