/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { serializeComponent, resetIdCounter } from '@/lib/componentParser';
import type { SerializableElement, JsxLocation, ElementLocationMap } from '@/store/componentStore';
import { useComponentStore } from '@/store/componentStore';

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

    // The corrected logic: We use a single, top-level traversal.
    traverse(ast, {
      // Find the main return statement of the default exported function.
      ReturnStatement(path) {
        // We only care about returns that are inside a Function scope,
        // and are returning JSX.
        if (
          path.getFunctionParent() &&
          (path.node.argument?.type === 'JSXElement' || path.node.argument?.type === 'JSXFragment')
        ) {
          const argument = path.node.argument;
          if (argument && argument.start != null && argument.end != null) {
            // Success! We found the location.
            jsxLocation = { start: argument.start, end: argument.end };

            // Now, traverse just this JSX fragment to map element locations.
            path.traverse({
              JSXOpeningElement(elPath) {
                const nodeId = `node-${idCounter++}`;
                const styleAttr = elPath.node.attributes.find(
                  (attr: any) => attr.type === 'JSXAttribute' && attr.name.name === 'style'
                );
                
                // Only add to map if positions are available
                if (elPath.node.start != null && elPath.node.end != null) {
                  elementLocationMap.set(nodeId, {
                    start: elPath.node.start,
                    end: elPath.node.end,
                    style: styleAttr && styleAttr.start != null && styleAttr.end != null 
                      ? { start: styleAttr.start, end: styleAttr.end } 
                      : undefined,
                  });
                }
              },
            });

            // Stop the entire traversal since we've found what we need.
            path.stop();
          }
        }
      },
    });

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
