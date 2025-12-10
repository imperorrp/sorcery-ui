/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { serializeComponent, resetIdCounter } from '@/lib/componentParser';
import type { SerializableElement, JsxLocation, ElementLocationMap, ComponentData } from '@/store/componentStore';
// Import the runtime registry
import { RUNTIME_IMPORTS } from './runtimeSystem';

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
 * MISSING COMPONENT DETECTION (v1.2):
 * - Automatically detects JSX component usages that aren't imported or available in library
 * - Creates mock placeholder components with red dashed borders for missing components
 * - Handles both imported missing components and JSX-used missing components
 * - Uses direct global scope injection for reliable component resolution during execution
 *
 * PROCESS FLOW:
 * 1. User pastes JSX/TSX code into Monaco Editor
 * 2. Code is transpiled and executed twice with different React contexts:
 *    - Once with shimmed React to create a preview AST (safe for style editing)
 *    - Once with real React to create a runtime AST (interactive and stateful)
 * 3. Missing components are detected and mock placeholders are created
 * 4. Both ASTs are generated and stored in the component store
 * 5. Runtime AST renders in iframe, Preview AST drives the navigator and style editing
 * 6. Style changes are applied surgically back to source code using Babel AST traversal
 *
 * This architecture treats the user's Source Code as the ultimate source of truth for logic,
 * while using the Visual ASTs as the source of truth for UI state and interaction.
 *
 * NOTES ON TRANSFORMATION & SANITIZATION:
 * - The renderer performs several sanitization and normalization steps before Babel transpilation
 *   to harden against AI-generated code patterns that break the TypeScript/JSX parser
 *   (e.g., top-level parentheses wrappers, IIFE-wrappers, or export-wrapped components).
 * - Import statements are transformed into inline `const` declarations that reference the
 *   `__deps__` runtime mapping (see `RUNTIME_IMPORTS` in `runtimeSystem.ts`). To avoid
 *   statements appearing inside parenthesized expressions (which causes parser errors),
 *   the renderer unwraps common wrappers and cleans common artifacts prior to running Babel.
 * - Missing component detection and automatic runtime mock generation are implemented
 *   so components that are referenced in the code but not available in the library are
 *   safely rendered with a visible placeholder.
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
 * Prunes child components from the preview AST to enforce component boundaries.
 *
 * SMART SELECTION FIX (v1.1):
 * This function implements "Smart Selection" by removing the deep children of any
 * library components found in the AST. This prevents users from selecting and editing
 * elements that belong to child components, maintaining a clear separation between
 * components and their dependencies.
 *
 * The principle: "You can only edit the source code that is currently visible in the editor."
 *
 * @param node The SerializableElement node to process
 * @param libraryComponentNames Array of component names from the library
 * @param depth Current traversal depth (0 for root element)
 * @returns A pruned copy of the node with child component children removed
 */
function pruneChildComponents(
  node: SerializableElement,
  libraryComponentNames: string[],
  depth = 0
): SerializableElement {
  if (typeof node.type !== 'string') {
    const componentName = node.type.displayName || node.type.name;
    // If this is a library component and it's not the root element...
    if (componentName && libraryComponentNames.includes(componentName) && depth > 0) {
      // Return a copy of the node with its children removed.
      return { ...node, props: { ...node.props, children: [] } };
    }
  }

  // If it's not a library component boundary, continue traversing.
  if (node.props.children) {
    return {
      ...node,
      props: {
        ...node.props,
        children: node.props.children.map(child =>
          typeof child === 'string'
            ? child
            : pruneChildComponents(child, libraryComponentNames, depth + 1)
        ),
      },
    };
  }

  return node;
}

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
 * 5. Pruning the preview AST to enforce component boundaries for smart selection
 *
 * @param code The raw TSX/JSX code string from the Monaco editor
 * @param allComponents The complete component library for resolving local imports
 * @param propsJson The JSON string containing props for the component
 * @returns A promise that resolves to an object containing both ASTs and location data
 */
export async function renderCodeToAst(
  code: string,
  allComponents: Record<string, ComponentData>,
  propsJson: string
): Promise<{
  runtimeAst: SerializableElement;
  previewAst: SerializableElement;
  jsxLocation: JsxLocation | null;
  elementLocationMap: ElementLocationMap;
}> {
  const { jsxLocation, elementLocationMap } = await analyzeCode(code);

  // Parse the props string that was passed into the function
  let parsedProps: Record<string, unknown> = {};
  try {
    parsedProps = JSON.parse(propsJson || '{}');
  } catch (e) {
    console.error("Failed to parse props JSON:", e);
    // Silently fail to an empty object if JSON is invalid
  }

  const sourceForTranspile = code
    .replace(/export\s+default\s+/, 'globalThis.USER_COMPONENT = ')
    .replace(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g, 'globalThis.$1 = function $1(');

  // Dynamic import to avoid process reference before shim loads
  const Babel = await import('@babel/standalone');

  // Create a Babel plugin to resolve local component imports
  const componentMap: Record<string, any> = {};

  const resolveLocalComponentsPlugin = () => {
    const detectedJsxComponents = new Set<string>();

    return {
      visitor: {
        // Detect all JSX component usages for missing component analysis
        JSXOpeningElement(path: any) {
          const name = path.node.name;
          if (name.type === 'JSXIdentifier' && name.name[0] === name.name[0].toUpperCase()) {
            // It's a component (starts with capital letter)
            detectedJsxComponents.add(name.name);
          }
        },

        // Find `import { Card } from './Card'` or `import Card from './Card'`
        ImportDeclaration(path: any) {
          const source = path.node.source.value;
          
          // 1. Check Runtime Dependencies (e.g., lucide-react, @/lib/utils)
          if (RUNTIME_IMPORTS[source]) {
            const specifiers = path.node.specifiers;
            const vars = specifiers.map((spec: any) => {
              if (spec.type === 'ImportDefaultSpecifier') {
                 // import X from 'y' -> const X = __deps__['y'].default || __deps__['y']
                 return `const ${spec.local.name} = __deps__['${source}'].default || __deps__['${source}'];`;
              } else if (spec.type === 'ImportSpecifier') {
                 // import { X } from 'y' -> const { X } = __deps__['y']
                 // Handle aliasing: import { X as Y } -> const { X: Y }
                 const imported = spec.imported.name;
                 const local = spec.local.name;
                 return `const { ${imported}: ${local} } = __deps__['${source}'];`;
              } else if (spec.type === 'ImportNamespaceSpecifier') {
                 // import * as X from 'y' -> const X = __deps__['y']
                 return `const ${spec.local.name} = __deps__['${source}'];`;
              }
              return '';
            });
            
            path.replaceWithSourceString(vars.join('\n'));
            return;
          }

          // 2. Check Local Components (e.g., ./Card)
          if (source.startsWith('./')) {
            const componentName = source.substring(2); // Get "Card" from "./Card"
            const componentData = Object.values(allComponents).find(c => c.name === componentName);

            if (componentData) {
              // Transpile the dependency component's code on the fly
              const result = Babel.transform(componentData.code, {
                presets: ['react', 'typescript'],
                plugins: [resolveLocalComponentsPlugin], // Use the same plugin for recursive resolution
                filename: `${componentName}.tsx`, // e.g., 'Card.tsx'
              });
              if (result.code) {
                // We need to get the actual exported function. We can do this with a trick.
                const getComponentFunc = new Function('React', 'exports', '__deps__', `${result.code.replace(/export default/, 'exports.default =')}; return exports.default;`);
                const ComponentFunction = getComponentFunc(React, {}, RUNTIME_IMPORTS);
                componentMap[componentName] = ComponentFunction;

                // We've resolved it, so we can remove the import statement from the final code.
                path.remove();
              }
            } else {
              // ▼▼▼ MISSING COMPONENT DETECTION: Create mock for imported but missing components ▼▼▼
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const MockComponent = (_props: any) => {
                return React.createElement(
                  'div',
                  {
                    style: {
                      border: '2px dashed #ff4757',
                      padding: '1rem',
                      backgroundColor: 'rgba(255, 71, 87, 0.05)',
                      color: '#ff4757',
                      fontFamily: 'monospace',
                    },
                  },
                  `Missing Component: <${componentName} />`
                );
              };
              componentMap[componentName] = MockComponent;
              // We still remove the import declaration.
              path.remove();
              // ▲▲▲ END OF MISSING COMPONENT DETECTION ▲▲▲
            }
          } else {
            // ▼▼▼ UNKNOWN IMPORT FALLBACK: Replace with mock for unknown imports ▼▼▼
            console.warn(`Unknown import: ${source} - replacing with empty object`);
            const specifiers = path.node.specifiers;
            const vars = specifiers.map((spec: any) => {
              if (spec.type === 'ImportDefaultSpecifier') {
                return `const ${spec.local.name} = {};`;
              } else if (spec.type === 'ImportSpecifier') {
                const local = spec.local.name;
                return `const ${local} = {};`;
              } else if (spec.type === 'ImportNamespaceSpecifier') {
                return `const ${spec.local.name} = {};`;
              }
              return '';
            });
            path.replaceWithSourceString(vars.join('\n'));
            // ▲▲▲ END OF UNKNOWN IMPORT FALLBACK ▲▲▲
          }
        },

        // After processing everything, ensure all detected JSX components have mocks
        Program: {
          exit(path: any) {
            // ▼▼▼ MISSING COMPONENT DETECTION: Create mocks for JSX-used missing components ▼▼▼
            // This handles components that are used in JSX but never imported
            detectedJsxComponents.forEach(componentName => {
              if (!componentMap[componentName]) {
                // Check if it's in the library (not just imported)
                const componentData = Object.values(allComponents).find(c => c.name === componentName);
                if (!componentData) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const MockComponent = (_props: any) => {
                    return React.createElement(
                      'div',
                      {
                        style: {
                          border: '2px dashed #ff4757',
                          padding: '1rem',
                          backgroundColor: 'rgba(255, 71, 87, 0.05)',
                          color: '#ff4757',
                          fontFamily: 'monospace',
                        },
                      },
                      `Missing Component: <${componentName} />`
                    );
                  };
                  componentMap[componentName] = MockComponent;
                }
              }
            });

            // DIRECT GLOBAL REFERENCE FIX (v1.2):
            // Replace JSX identifiers with direct global references to avoid Babel transform ordering issues
            // The JSX preset runs after plugins, so we ensure identifiers remain unchanged for global resolution
            path.traverse({
              JSXOpeningElement(jsxPath: any) {
                const name = jsxPath.node.name;
                if (name.type === 'JSXIdentifier' && componentMap[name.name]) {
                  // Keep the original identifier name - it will resolve to the global component
                  // that was injected into globalThis before execution
                }
              },
              JSXClosingElement(jsxPath: any) {
                const name = jsxPath.node.name;
                if (name.type === 'JSXIdentifier' && componentMap[name.name]) {
                  // Keep the original identifier name for global resolution
                }
              }
            });
            // ▲▲▲ END OF DIRECT GLOBAL REFERENCE FIX ▲▲▲
          }
        },

        // Identifier visitor - simplified for direct global resolution
        Identifier(path: any) {
          // Don't modify identifiers that are in componentMap
          // They will resolve to global components injected before execution
          if (componentMap[path.node.name]) {
            // Keep original identifier name for global scope resolution
          }
        }
      }
    };
  };

  // Normalize the source before running Babel.transform to avoid
  // invalid constructs like `(const React = __deps__['react'];)` which
  // occur when the AI returns code wrapped in parentheses and our
  // ImportDeclaration replacement inserts `const` declarations.
  let codeToTranspile = sourceForTranspile.trim();

  // Unwrap a single top-level pair of parentheses, e.g.:
  // `( ...code... )` -> `...code...`
  if (codeToTranspile.startsWith('(') && codeToTranspile.endsWith(')')) {
    codeToTranspile = codeToTranspile.slice(1, -1).trim();
  }

  // Remove common export-wrapping artifacts such as `export default ( ... );`
  // and trailing closing parens left by poorly-formed wrappers.
  codeToTranspile = codeToTranspile
    .replace(/^export\s+default\s*\(\s*/, 'export default ')
    .replace(/\s*\)\s*;?\s*$/, '');

  const result = Babel.transform(codeToTranspile, {
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
    __deps__: RUNTIME_IMPORTS,
  };

  // ▼▼▼ GLOBAL SCOPE INJECTION FOR MISSING COMPONENTS (v1.2) ▼▼▼
  // Inject all components (including mocks) into global scope for reliable JSX resolution
  // This ensures that when Babel's JSX transform creates React.createElement(ComponentName, ...),
  // the ComponentName will be available in the global scope during execution
  Object.keys(componentMap).forEach(componentName => {
    (globalThis as any)[componentName] = componentMap[componentName];
  });

  // Also inject React into global scope for JSX compilation
  (globalThis as any).React = ReactShim;
  // ▲▲▲ END OF GLOBAL SCOPE INJECTION ▲▲▲

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
    __deps__: RUNTIME_IMPORTS,
  };

  // ▼▼▼ RUNTIME GLOBAL SCOPE INJECTION ▼▼▼
  // Ensure all components are available in global scope for runtime execution
  Object.keys(componentMap).forEach(componentName => {
    (globalThis as any)[componentName] = componentMap[componentName];
  });

  // Inject real React for runtime JSX compilation
  (globalThis as any).React = React;
  // ▲▲▲ END OF RUNTIME GLOBAL SCOPE INJECTION ▲▲▲

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

  // ▼▼▼ SMART SELECTION: Prune child components to enforce component boundaries ▼▼▼
  // This prevents users from selecting elements inside child components
  // and enforces the principle that you can only edit what's in your current editor
  const libraryNames = Object.values(allComponents).map(c => c.name);
  const prunedPreviewAst = pruneChildComponents(previewAst, libraryNames);
  // ▲▲▲ END OF SMART SELECTION ▲▲▲
  
  return { runtimeAst, previewAst: prunedPreviewAst, jsxLocation, elementLocationMap };
}
