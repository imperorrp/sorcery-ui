/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { serializeComponent, resetIdCounter } from '@/lib/componentParser';
import type { SerializableElement, JsxLocation, ElementLocationMap } from '@/store/componentStore';
import { useComponentStore } from '@/store/componentStore';
import type { NodePath } from '@babel/traverse';
import type { JSXOpeningElement, JSXAttribute, JSXIdentifier, JSXExpressionContainer } from '@babel/types';

/**
 * Renderer Library - Dual-AST Strategy for Interactive Component Editing
 *
 * This module implements a "Dual-AST" approach to enable live, interactive editing of React components:
 *
 * 1. **Runtime AST (componentAst)**: Created with the real React library, allowing full interactivity,
 *    state management, and side effects. This is rendered in the iframe for live interaction.
 *
 * 2. **Preview AST (componentPreviewAst)**: Created with a "shimmed" React that replaces stateful hooks
 *    (useState, useEffect) with no-op functions. This generates a complete, serializable tree of the
 *    component's potential output without executing stateful logic, enabling safe style editing and
 *    component tree navigation.
 *
 * The dual approach ensures that:
 * - Users can interact with their components in real-time (runtime AST)
 * - Style changes can be applied safely without triggering stateful code (preview AST)
 * - The component tree can be analyzed for navigation and selection (preview AST)
 *
 * Both ASTs are generated from the same source code but with different React contexts to achieve
 * this separation of concerns.
 */

/**
 * Analyzes the provided code string to locate JSX elements and their positions.
 *
 * This function parses the code using Babel to find the main JSX return statement
 * and creates a mapping of element locations for surgical code updates. It identifies
 * the default exported component's return statement and traverses its JSX structure
 * to build an element location map.
 *
 * @param code The raw TSX/JSX code string from the editor
 * @returns A promise resolving to an object containing the JSX location and element location map
 */
const analyzeCode = async (code: string): Promise<{ jsxLocation: JsxLocation | null; elementLocationMap: ElementLocationMap }> => {
  const elementLocationMap: ElementLocationMap = new Map();
  let jsxLocation: JsxLocation | null = null;
  let idCounter = 0;

  try {
    const [{ parse }, traverseModule] = await Promise.all([
      import('@babel/parser'),
      import('@babel/traverse'),
    ]);
    const traverse = traverseModule.default;

    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let returnStatementPath: any = null;

    traverse(ast, {
      ExportDefaultDeclaration(path: NodePath) {
        const declaration = path.node.declaration;
        let functionBody;

        if (declaration.type === 'FunctionDeclaration') {
          // Handles: export default function MyComponent() { ... }
          functionBody = declaration.body;
        } else if (declaration.type === 'Identifier') {
          // Handles: function MyComponent() { ... }; export default MyComponent;
          const componentName = declaration.name;
          const binding = path.scope.getBinding(componentName);
          if (binding && binding.path.isFunctionDeclaration()) {
            functionBody = binding.path.node.body;
          }
        }

        if (functionBody) {
          traverse(functionBody, {
            ReturnStatement(returnPath: NodePath) {
              if (returnPath.node.argument?.type === 'JSXElement' || returnPath.node.argument?.type === 'JSXFragment') {
                returnStatementPath = returnPath;
                // Stop traversing the inner part once we find the return
                returnPath.stop();
              }
            },
            // Do not traverse into nested functions
            Function(innerPath: NodePath) {
              innerPath.skip();
            }
          });
        }
        // Stop the main traversal once we've processed the export default
        path.stop();
      }
    });

    if (returnStatementPath) {
      const argument = returnStatementPath.node.argument;
      if (argument && argument.start != null && argument.end != null) {
        jsxLocation = { start: argument.start, end: argument.end };

        // Create a minimal AST to traverse the JSX argument
        const jsxAst = { ...argument, type: 'Program', body: [argument] };
        traverse(jsxAst, {
          JSXOpeningElement(elPath: NodePath<JSXOpeningElement>) {
            const nodeId = `node-${idCounter++}`;
            const styleAttr = elPath.node.attributes.find(
              (attr): attr is JSXAttribute => attr.type === 'JSXAttribute' && 
                attr.name.type === 'JSXIdentifier' && 
                attr.name.name === 'style'
            );
            
            elementLocationMap.set(nodeId, {
              start: elPath.node.start!,
              end: elPath.node.end!,
              style: styleAttr ? { 
                start: styleAttr.start!, 
                end: styleAttr.end! 
              } : undefined,
            });
          },
        });
      }
    }

  } catch (error) {
    console.error("Babel parsing error for location mapping:", error);
  }

  return { jsxLocation, elementLocationMap };
};


/**
 * Transpile, execute and return an AST for a user-provided component source string.
 *
 * This is the main entry point for converting raw code into interactive and previewable ASTs.
 * The process involves:
 * 1. Analyzing the code to find JSX locations and element mappings
 * 2. Transpiling the code using Babel with React and TypeScript presets
 * 3. Executing the transpiled code twice with different React contexts:
 *    - Once with shimmed React to create a preview AST (safe for style editing)
 *    - Once with real React to create a runtime AST (interactive and stateful)
 * 4. Serializing both executions into SerializableElement trees
 *
 * @param code The raw TSX/JSX code string from the Monaco editor
 * @returns A promise that resolves to an object containing both ASTs and location data
 */
export async function renderCodeToAst(code: string): Promise<{
  runtimeAst: SerializableElement;
  previewAst: SerializableElement;
  jsxLocation: JsxLocation | null;
  elementLocationMap: ElementLocationMap;
}> {
  const { jsxLocation, elementLocationMap } = await analyzeCode(code);

  let parsedProps: Record<string, unknown> = {};
  try {
    const store = (useComponentStore as any).getState();
    parsedProps = JSON.parse(store.propsJson || '{}');
  } catch { /* ignore */ }

  const sourceForTranspile = code
    .replace(/export\s+default\s+/, 'globalThis.USER_COMPONENT = ')
    .replace(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g, 'globalThis.$1 = function $1(');

  // Dynamic import to avoid process reference before shim loads
  const Babel = await import('@babel/standalone');
  
  const result = Babel.transform(sourceForTranspile, {
    presets: ['react', 'typescript'],
    filename: 'UserComponent.tsx',
  });
  const transpiledCode = result?.code;
  if (!transpiledCode) throw new Error('Babel transpilation failed.');

  const ReactShim = { ...(React as any), useState: (v: any) => [v, () => {}], useEffect: () => {} };
  (globalThis as any).USER_COMPONENT = undefined;
  new Function('React', transpiledCode)(ReactShim);
  const UserComponentForPreview = (globalThis as any).USER_COMPONENT;

  (globalThis as any).USER_COMPONENT = undefined;
  new Function('React', transpiledCode)(React);
  const UserComponentForRuntime = (globalThis as any).USER_COMPONENT;
  if (typeof UserComponentForRuntime !== 'function' && typeof UserComponentForPreview !== 'function') {
    throw new Error('The code must have a default export that is a React component.');
  }

  resetIdCounter();
  const runtimeElement = React.createElement(UserComponentForRuntime || UserComponentForPreview, parsedProps);
  const runtimeAst = serializeComponent(runtimeElement) as SerializableElement;

  resetIdCounter();
  const previewElement = React.createElement(UserComponentForPreview || UserComponentForRuntime, parsedProps);
  const previewAst = serializeComponent(previewElement) as SerializableElement;
  
  return { runtimeAst, previewAst, jsxLocation, elementLocationMap };
}
