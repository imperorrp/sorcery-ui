/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { serializeComponent, resetIdCounter } from '@/lib/componentParser';
import type { SerializableElement, ComponentData } from '@/store/componentStore';
import type { JsxLocation, ElementLocationMap } from '@/store/types';

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
  schemaAst: SerializableElement;
  jsxLocation: JsxLocation | null;
  elementLocationMap: ElementLocationMap;
  componentMap: Record<string, any>;
  cssImports?: string[];
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

  // Keep a copy of the original source for diagnostics and safe fallback
  const originalSource = code;
  // Diagnostic: show the original snippet (helps debug when regex empties the source)
  try {
    console.log('renderer: original source snippet:', originalSource.substring(0, 400));
  } catch {
    // ignore diagnostic logging failure
  }

  // Use the original code as the source for transpilation. Export/import
  // nodes will be handled at the AST level by the plugin.
  const sourceForTranspile = code;

  // Dynamic import to avoid process reference before shim loads
  const Babel = await import('@babel/standalone');
  const presetTypeScript: any = await import('@babel/preset-typescript');

  // Create a Babel plugin to resolve local component imports
  const componentMap: Record<string, any> = {};

  /**
   * Create a Babel plugin that strips `import` declarations and rewrites `export`
   * declarations into assignments to `globalThis`. This is an AST-level transform
   * which is far safer than regex-based string replacements.
   *
   * - For `export default ...` we assign the value to `globalThis.USER_COMPONENT`.
   * - If `componentName` is provided (dependency processing), we also assign the
   *   default export to `globalThis[componentName]` so `import Card from './Card'`
   *   resolves correctly.
   * - For named exports we keep the declarations but append `globalThis.<name> = <name>`
   *   statements. For `export { A, B }` we replace with those assignments.
   */
  const createStripExportImportPlugin = (componentName?: string, exportedNames?: string[]) => {
    return (babel: any) => {
      const t = babel.types;
      return {
        visitor: {
          ImportDeclaration(path: any) {
            // Remove all imports; resolving local imports happens outside of this
            path.remove();
          },

          ExportNamedDeclaration(path: any) {
            const node = path.node;
            const nodesToInsert: any[] = [];

            if (node.declaration) {
              // Keep the original declaration (function/var/class)
              nodesToInsert.push(node.declaration);

              // Collect names from the declaration
              const names: string[] = [];
              const decl = node.declaration;
              if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') {
                if (decl.id && decl.id.name) names.push(decl.id.name);
              } else if (decl.type === 'VariableDeclaration') {
                decl.declarations.forEach((d: any) => {
                  if (d.id && d.id.type === 'Identifier') names.push(d.id.name);
                });
              }

              names.forEach(name => {
                nodesToInsert.push(
                  t.expressionStatement(
                    t.assignmentExpression('=', t.memberExpression(t.identifier('globalThis'), t.identifier(name)), t.identifier(name))
                  )
                );
                if (exportedNames) exportedNames.push(name);
              });

              path.replaceWithMultiple(nodesToInsert);
            } else if (node.specifiers && node.specifiers.length) {
              // export { A, B }
              const assignNodes = node.specifiers.map((spec: any) => {
                const local = spec.local.name;
                const exported = spec.exported.name;
                if (exportedNames) exportedNames.push(exported);
                return t.expressionStatement(
                  t.assignmentExpression('=', t.memberExpression(t.identifier('globalThis'), t.identifier(exported)), t.identifier(local))
                );
              });
              path.replaceWithMultiple(assignNodes);
            } else {
              // No declaration and no specifiers - remove safely
              path.remove();
            }
          },

          ExportDefaultDeclaration(path: any) {
            const node = path.node;
            const decl = node.declaration;

            // Helper to create an assignment `globalThis.USER_COMPONENT = <id|uid>`
            const assignUserComponent = (idNode: any) => t.expressionStatement(
              t.assignmentExpression('=', t.memberExpression(t.identifier('globalThis'), t.identifier('USER_COMPONENT')), idNode)
            );

            // Helper to also assign to file-specific global name when provided
            const assignNamed = (idNode: any, name?: string) => {
              if (!name) return null;
              return t.expressionStatement(
                t.assignmentExpression('=', t.memberExpression(t.identifier('globalThis'), t.identifier(name)), idNode)
              );
            };

            if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') {
              if (decl.id && decl.id.name) {
                // function Foo() {} => keep declaration, then assign USER_COMPONENT = Foo
                const nodes = [decl, assignUserComponent(t.identifier(decl.id.name))];
                if (componentName) nodes.push(assignNamed(t.identifier(decl.id.name), componentName));
                if (exportedNames) exportedNames.push(componentName || 'USER_COMPONENT');
                path.replaceWithMultiple(nodes);
                return;
              }
            }

            // For expressions or anonymous default exports, create a uid var and assign
            const uid = path.scope.generateUidIdentifier('defaultExport');
            const varDecl = t.variableDeclaration('const', [t.variableDeclarator(uid, decl)]);
            const nodes: any[] = [varDecl, assignUserComponent(uid)];
            if (componentName) {
              nodes.push(assignNamed(uid, componentName));
              if (exportedNames) exportedNames.push(componentName);
            } else if (exportedNames) {
              exportedNames.push('USER_COMPONENT');
            }
            path.replaceWithMultiple(nodes);
          }
        }
      };
    };
  };

  const resolveLocalComponentsPlugin = (babel: any) => {
    const t = babel.types;
    const detectedJsxComponents = new Set<string>();
    // names imported from external packages (e.g. `import { Button } from '@shadcn/ui'`)
    const externalLibraryNames = new Set<string>();
    // cssImports encountered during transform (e.g. './globals.css' or remote urls)
    const cssImports: string[] = [];

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

        // Rewrite named exports into global assignments for the main source
        ExportNamedDeclaration(path: any) {
          const node = path.node as any;
          if (node.declaration) {
            const nodes: any[] = [node.declaration];
            const names: string[] = [];
            const decl = node.declaration;
            if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') {
              if (decl.id && decl.id.name) names.push(decl.id.name);
            } else if (decl.type === 'VariableDeclaration') {
              decl.declarations.forEach((d: any) => {
                if (d.id && d.id.type === 'Identifier') names.push(d.id.name);
              });
            }
            names.forEach((name: string) => {
              nodes.push(
                t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('globalThis'), t.identifier(name)), t.identifier(name)))
              );
            });
            path.replaceWithMultiple(nodes);
            return;
          }
          if (node.specifiers && node.specifiers.length) {
            const assignNodes = node.specifiers.map((spec: any) => {
              return t.expressionStatement(
                t.assignmentExpression('=', t.memberExpression(t.identifier('globalThis'), t.identifier(spec.exported.name)), t.identifier(spec.local.name))
              );
            });
            path.replaceWithMultiple(assignNodes);
            return;
          }
          path.remove();
        },

        // Rewrite default export into globalThis.USER_COMPONENT for the main source
        ExportDefaultDeclaration(path: any) {
          const node = path.node as any;
          const decl = node.declaration;
          if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') {
            if (decl.id && decl.id.name) {
              const nodes = [decl, t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('globalThis'), t.identifier('USER_COMPONENT')), t.identifier(decl.id.name)))];
              path.replaceWithMultiple(nodes);
              return;
            }
          }
          const uid = path.scope.generateUidIdentifier('defaultExport');
          const varDecl = t.variableDeclaration('const', [t.variableDeclarator(uid, decl)]);
          const assign = t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('globalThis'), t.identifier('USER_COMPONENT')), uid));
          path.replaceWithMultiple([varDecl, assign]);
        },

        // Find `import { Card } from './Card'` or `import Card from './Card'`
        ImportDeclaration(path: any) {
          const source = path.node.source.value;

          // If it's a CSS import (local or remote), record it and remove the import.
          if (typeof source === 'string' && source.endsWith('.css')) {
            cssImports.push(source);
            path.remove();
            return;
          }

          // A simple heuristic: if the import is local, try to resolve a project component
          if (source.startsWith('./')) {
            const componentName = source.substring(2); // Get "Card" from "./Card"
            const componentData = Object.values(allComponents).find(c => c.name === componentName);

            if (componentData) {
              // Process dependency code with an AST-level plugin that strips imports
              // and rewrites exports into globalThis assignments.
              const exportedNames: string[] = [];
              const stripPlugin = createStripExportImportPlugin(componentName, exportedNames);
              const result = Babel.transform(componentData.code, {
                presets: ['react', presetTypeScript.default],
                plugins: [stripPlugin],
                filename: `${componentName}.tsx`,
              });
              if (result && typeof result.code === 'string') {
                const processedCode = result.code;
                try {
                  const componentCreator = new Function('React', processedCode);
                  componentCreator(React);
                } catch (e) {
                  console.error('renderer: failed to execute processed dependency code for', componentName, e);
                }

                exportedNames.forEach(name => {
                  const globalComponent = (globalThis as any)[name];
                  if (globalComponent !== undefined) componentMap[name] = globalComponent;
                });

                if (!exportedNames.length && (globalThis as any)[componentName]) {
                  componentMap[componentName] = (globalThis as any)[componentName];
                }

                path.remove();
              }
            } else {
              // Create a mock for missing local component imports
                const MockComponent = () => React.createElement('div', {
                style: { border: '2px dashed #ff4757', padding: '1rem', backgroundColor: 'rgba(255,71,87,0.05)', color: '#ff4757', fontFamily: 'monospace' }
              }, `Missing Component: <${componentName} />`);
              componentMap[componentName] = MockComponent;
              path.remove();
            }
          } else {
            // Non-local imports (third-party packages). Record any capitalized
            // specifiers as external library component names (for pruning) then remove.
            const specifiers = path.node.specifiers || [];
            specifiers.forEach((spec: any) => {
              if (spec.local && spec.local.name && /^[A-Z]/.test(spec.local.name)) {
                externalLibraryNames.add(spec.local.name);
              }
            });
            path.remove();
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
                  const MockComponent = () => {
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
            try {
              // Expose captured metadata for later stages (pruning and css injection)
              (resolveLocalComponentsPlugin as any).__externalLibraryNames = Array.from(externalLibraryNames);
              (resolveLocalComponentsPlugin as any).__cssImports = cssImports;
            } catch {
              // ignore
            }
          }
        },
      }
    };
  };

  // We rely on the AST-level plugin to remove/transform import/export nodes
  // instead of brittle regex replacements.
  let processedMainSource = sourceForTranspile;

  // Diagnostic: show processed main source snippet
  try {
    console.log('renderer: processedMainSource snippet:', processedMainSource.substring(0, 400));
  } catch (e) {
    console.warn('renderer: failed to log processedMainSource', e);
  }

  // Safety: if our regex normalization accidentally emptied the source, fall back to the
  // original source (safer than passing an empty string to Babel.transform).
  if (!processedMainSource || processedMainSource.trim().length === 0) {
    console.warn('renderer: processedMainSource is empty after normalization — falling back to original source');
    processedMainSource = originalSource;
  }

  let transpiledCode: string | undefined;
  try {
    const result = Babel.transform(processedMainSource, {
      presets: ['react', presetTypeScript.default],
      plugins: [resolveLocalComponentsPlugin], // Use the plugin here
      filename: 'UserComponent.tsx',
    });
    transpiledCode = typeof result?.code === 'string' ? result.code : undefined;
    if (!transpiledCode) {
      throw new Error('Babel.transform returned no code (result.code is falsy)');
    }
  } catch (err: any) {
    // Provide much more context in the console so the caller can paste diagnostics
    try {
      console.error('renderer: Babel.transform ERROR -', err && err.message ? err.message : err);
      console.error('renderer: processedMainSource (first 2000 chars):\n', processedMainSource.slice(0, 2000));
    } catch (e) {
      console.error('renderer: failed to log processedMainSource for Babel error', e);
    }
    // Re-throw so higher-level code sees the original error (keeps existing behavior)
    throw err;
  }
  // Diagnostic logs to help trace why components may not render in iframe
  try {
    console.log('renderer: transpiledCode snippet:', transpiledCode.substring(0, 400));
    console.log('renderer: componentMap keys:', Object.keys(componentMap));
  } catch (e) {
    // Non-fatal diagnostic failure
    console.warn('renderer: diagnostic logging failed', e);
  }

  const ReactShim = { ...(React as any), useState: (v: any) => [v, () => {}], useEffect: () => {} };

  // The context object now includes our resolved library components
  // Build a minimal execution scope to avoid parameter name collisions when
  // creating the function via `new Function(...keys, code)`. Spreading
  // `componentMap` into the function parameters can collide with declarations
  // in the user's file (e.g. `const buttonVariants = ...`) and cause
  // "Identifier ... has already been declared" errors. We instead inject
  // resolved components into `globalThis` (done above) and only pass React
  // plus a pointer to the local components map.
  const executionScope = {
    React: ReactShim,
    __localComponents__: componentMap,
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
  // Parse the processed main source to discover exported names before executing
  // the code. This lets us check which globals should appear after execution
  // and log useful diagnostics.
  let exportedNamesMain: string[] = [];
  try {
    const [{ parse }, traverseModule] = await Promise.all([
      import('@babel/parser'),
      import('@babel/traverse'),
    ]);
    const traverse = traverseModule.default;
    const mainAst = parse(processedMainSource, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    exportedNamesMain = [];
    traverse(mainAst, {
      ExportNamedDeclaration(path: any) {
        const node = path.node as any;
        if (node.declaration) {
          const decl = node.declaration;
          if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') {
            if (decl.id && decl.id.name) exportedNamesMain.push(decl.id.name);
          } else if (decl.type === 'VariableDeclaration') {
            decl.declarations.forEach((d: any) => {
              if (d.id && d.id.type === 'Identifier') exportedNamesMain.push(d.id.name);
            });
          }
        }
        if (node.specifiers && node.specifiers.length) {
          node.specifiers.forEach((s: any) => exportedNamesMain.push(s.exported.name));
        }
      },
      ExportDefaultDeclaration() {
        exportedNamesMain.push('USER_COMPONENT');
      }
    });
  } catch (e) {
    console.warn('renderer: could not parse main source to collect exports before exec', e);
  }

  const componentCreator = new Function(...keys, transpiledCode);

  (globalThis as any).USER_COMPONENT = undefined;
  componentCreator(...values); // This will attach USER_COMPONENT to globalThis

  // After execution, check which exported names are present on globalThis and
  // populate componentMap appropriately. Also log the presence of the globals
  // for debugging why the wrong export may have been chosen.
  try {
    console.log('renderer: exportedNamesMain (pre-exec):', exportedNamesMain);
    exportedNamesMain.forEach(name => {
      const g = (globalThis as any)[name];
      console.log(`renderer: global ${name} ->`, typeof g);
      if (g !== undefined) componentMap[name] = g;
    });
  } catch (e) {
    console.warn('renderer: error inspecting globals after exec', e);
  }

  // Select USER_COMPONENT if none set by default export. Use runtime verification
  // to ensure we pick a real React component (handles forwardRef objects too).
  // Heuristic order:
  // 1. If USER_COMPONENT already assigned by a default export, verify it.
  // 2. Uppercase-named exports (likely components) in declaration order.
  // 3. Any exported names.
  // 4. Any keys present in componentMap.
  // For each candidate we try React.createElement and React.isValidElement using the
  // shim React (ReactShim). If none validate, fall back to a visible placeholder component.
  if ((globalThis as any).USER_COMPONENT === undefined) {
    const verifyIsComponent = (candidate: any, reactForTest: any) => {
      try {
        const maybeEl = reactForTest.createElement(candidate, {});
        const isValid = reactForTest.isValidElement(maybeEl);
        console.log('renderer: verify candidate', typeof candidate, 'isValid:', isValid);
        return isValid;
      } catch (e) {
        console.log('renderer: verify candidate failed:', e instanceof Error ? e.message : String(e));
        return false;
      }
    };

    const candidates: string[] = [];
    // If a default export already wrote USER_COMPONENT, test it first
    if ((globalThis as any).USER_COMPONENT !== undefined) candidates.push('USER_COMPONENT');

    // Uppercase exports are likely components
    exportedNamesMain.forEach(n => { if (n && /^[A-Z]/.test(n)) candidates.push(n); });
    // Then include any remaining exported names
    exportedNamesMain.forEach(n => { if (n && !candidates.includes(n)) candidates.push(n); });
    // Finally include any resolved componentMap keys as a last resort
    Object.keys(componentMap).forEach(k => { if (!candidates.includes(k)) candidates.push(k); });

    console.log('renderer: candidates for selection:', candidates);

    let selectedName: string | null = null;
    for (const name of candidates) {
      const val = (globalThis as any)[name];
      if (val === undefined) continue;
      if (verifyIsComponent(val, ReactShim)) {
        (globalThis as any).USER_COMPONENT = val;
        selectedName = name;
        console.log('renderer: selected candidate:', name);
        break;
      }
    }

    if (!selectedName) {
      console.log('renderer: no valid component found, using placeholder');
      // Nothing validated as a component — use a friendly placeholder so we don't
      // end up rendering primitive strings (like class lists) to the preview.
      const Placeholder = () => React.createElement(
        'div',
        { style: { padding: 12, border: '1px dashed #f39c12', color: '#333', fontFamily: 'monospace' } },
        'No renderable component found in this file. (preview placeholder)'
      );
      (globalThis as any).USER_COMPONENT = Placeholder;
      componentMap['__PLACEHOLDER__'] = (globalThis as any).USER_COMPONENT;
    }
  }

  try {
    console.log('renderer: componentMap keys after main exec:', Object.keys(componentMap));
    console.log('renderer: USER_COMPONENT selected after exec:', (globalThis as any).USER_COMPONENT && ((globalThis as any).USER_COMPONENT.displayName || (globalThis as any).USER_COMPONENT.name || typeof (globalThis as any).USER_COMPONENT));
  } catch {
    // ignore
  }

  const UserComponentForPreview = (globalThis as any).USER_COMPONENT;

  // Now execute with real React for the runtime version
  const runtimeExecutionScope = {
    React: React,
    __localComponents__: componentMap,
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
  const isRuntimeValid = (() => {
    try {
      return React.isValidElement(React.createElement(UserComponentForRuntime, {}));
    } catch {
      return false;
    }
  })();
  const isPreviewValid = (() => {
    try {
      return React.isValidElement(React.createElement(UserComponentForPreview, {}));
    } catch {
      return false;
    }
  })();
  if (!isRuntimeValid && !isPreviewValid) {
    throw new Error('The code must have a default export that is a React component.');
  }

  // PHASE 9 ENHANCEMENT: Different expansion strategies for different AST purposes
  // RUNTIME AST: Expand components for full interactivity and rendering
  resetIdCounter();
  const runtimeElement = React.createElement(UserComponentForRuntime || UserComponentForPreview, parsedProps);
  const runtimeAst = serializeComponent(runtimeElement, { expandComponents: true }) as SerializableElement;

  // PREVIEW AST: Expand components for selection/navigation/updates (DOM structure matching)
  // This maintains compatibility with existing selection mechanism and surgical updaters
  resetIdCounter();
  const previewElement = React.createElement(UserComponentForPreview || UserComponentForRuntime, parsedProps);
  const previewAst = serializeComponent(previewElement, { expandComponents: true }) as SerializableElement;

  // SCHEMA AST: DO NOT expand components - keep component structure for prop editing and schema detection
  // This allows the inspector to detect Button/Card/etc and show variant editors
  resetIdCounter();
  const schemaElement = React.createElement(UserComponentForPreview || UserComponentForRuntime, parsedProps);
  const schemaAst = serializeComponent(schemaElement, { expandComponents: false }) as SerializableElement;

  // ▼▼▼ SMART SELECTION: Prune child components that come from external libraries
  // (not project-local components). Try to use the set captured by the plugin,
  // otherwise infer external names from the resolved componentMap.
  let libraryNames: string[] = [];
  try {
    libraryNames = (resolveLocalComponentsPlugin as any).__externalLibraryNames || [];
  } catch {
    libraryNames = [];
  }

  if (!libraryNames || libraryNames.length === 0) {
    const projectNames = new Set(Object.values(allComponents).map(c => c.name));
    libraryNames = Object.keys(componentMap).filter(k => !projectNames.has(k));
  }

  const prunedPreviewAst = pruneChildComponents(previewAst, libraryNames);

  // Collect cssImports captured by the plugin for the caller
  let capturedCssImports: string[] = [];
  try {
    capturedCssImports = (resolveLocalComponentsPlugin as any).__cssImports || [];
  } catch {
    capturedCssImports = [];
  }

  return { runtimeAst, previewAst: prunedPreviewAst, schemaAst, jsxLocation, elementLocationMap, componentMap, cssImports: capturedCssImports };
}
