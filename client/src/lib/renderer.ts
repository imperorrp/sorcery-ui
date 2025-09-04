/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { serializeComponent, resetIdCounter } from '@/lib/componentParser';
import type { SerializableElement, JsxLocation, ElementLocationMap, ComponentData } from '@/store/componentStore';
import { useComponentStore } from '@/store/componentStore';

/**
 * Renderer Library - Dual-AST Strategy for Interactive Component Editing
 *
 * This module implements the core "Dual-AST" approach that enables live, interactive editing
 * of React components while preserving their logic and functionality.
 *
 * ARCHITECTURE OVERVIEW:
 *
 * 1. **Runtime AST (componentAst)**: Created with the real React library, allowing full interactivity,
 *    state management, and side effects. This is rendered in the iframe for live interaction.
 *
 * 2. **Preview AST (componentPreviewAst)**: Created with a "shimmed" React that replaces stateful hooks
 *    (useState, useEffect) with no-op functions. This generates a complete, serializable tree of the
 *    component's potential output without executing stateful logic, enabling safe style editing and
 *    component tree navigation.
 *
 * KEY BENEFITS:
 * - Users can interact with their components in real-time (runtime AST)
 * - Style changes can be applied safely without triggering stateful code (preview AST)
 * - The component tree can be analyzed for navigation and selection (preview AST)
 * - Surgical code updates preserve all component logic and event handlers
 *
 * PROCESS FLOW:
 * 1. User pastes JSX/TSX code into Monaco Editor
 * 2. Code is transpiled and executed twice with different React contexts
 * 3. Both ASTs are generated and stored in the component store
 * 4. Runtime AST renders in iframe, Preview AST drives the navigator and style editing
 * 5. Style changes are applied surgically back to source code using Babel AST traversal
 *
 * Both ASTs are generated from the same source code but with different React contexts to achieve
 * this separation of concerns while maintaining perfect synchronization.
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
 * @param allComponents The complete component library for resolving local imports
 * @returns A promise that resolves to an object containing both ASTs and location data
 */
export async function renderCodeToAst(
  code: string,
  allComponents: Record<string, ComponentData>
): Promise<{
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

  // Create a Babel plugin to resolve local component imports
  const componentMap: Record<string, any> = {};

  const resolveLocalComponentsPlugin = () => {
    return {
      visitor: {
        // Find `import { Card } from './Card'` or `import Card from './Card'`
        ImportDeclaration(path: any) {
          const source = path.node.source.value;
          // A simple heuristic: if the import is local, treat it as a library component
          if (source.startsWith('./')) {
            const componentName = source.substring(2); // Get "Card" from "./Card"
            const componentData = Object.values(allComponents).find(c => c.name === componentName);

            if (componentData) {
              // Transpile the dependency component's code on the fly
              const result = Babel.transform(componentData.code, {
                presets: ['react', 'typescript'],
              });
              if (result.code) {
                // We need to get the actual exported function. We can do this with a trick.
                const getComponentFunc = new Function('React', 'exports', `${result.code.replace(/export default/, 'exports.default =')}; return exports.default;`);
                const ComponentFunction = getComponentFunc(React, {});
                componentMap[componentName] = ComponentFunction;

                // We've resolved it, so we can remove the import statement from the final code.
                path.remove();
              }
            }
          }
        },
        // Now, find where the component is used, e.g., `<Card ... />`
        Identifier(path: any) {
          if (componentMap[path.node.name]) {
            // Replace the identifier "Card" with a direct reference
            // that we can pass into the execution scope.
            path.node.name = `__localComponents__.${path.node.name}`;
          }
        }
      }
    };
  };

  const result = Babel.transform(sourceForTranspile, {
    presets: ['react', 'typescript'],
    plugins: [resolveLocalComponentsPlugin], // Use the plugin here
    filename: 'UserComponent.tsx',
  });
  const transpiledCode = result?.code;
  if (!transpiledCode) throw new Error('Babel transpilation failed.');

  const ReactShim = { ...(React as any), useState: (v: any) => [v, () => {}], useEffect: () => {} };

  // The context object now includes our resolved library components
  const executionScope = {
    React: ReactShim,
    __localComponents__: componentMap,
  };

  // We use `new Function` to execute the code in a controlled scope
  const keys = Object.keys(executionScope);
  const values = Object.values(executionScope);
  const componentCreator = new Function(...keys, transpiledCode);

  (globalThis as any).USER_COMPONENT = undefined;
  componentCreator(...values); // This will attach USER_COMPONENT to globalThis

  const UserComponentForPreview = (globalThis as any).USER_COMPONENT;

  // Now execute with real React for the runtime version
  const runtimeExecutionScope = {
    React: React,
    __localComponents__: componentMap,
  };

  const runtimeKeys = Object.keys(runtimeExecutionScope);
  const runtimeValues = Object.values(runtimeExecutionScope);
  const runtimeComponentCreator = new Function(...runtimeKeys, transpiledCode);

  (globalThis as any).USER_COMPONENT = undefined;
  runtimeComponentCreator(...runtimeValues); // This will attach USER_COMPONENT to globalThis

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
