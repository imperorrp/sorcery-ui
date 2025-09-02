/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { serializeComponent, resetIdCounter } from '@/lib/componentParser';
import type { SerializableElement, JsxLocation, ElementLocationMap } from '@/store/componentStore';
import { useComponentStore } from '@/store/componentStore';

/**
 * THIS IS THE CORRECTED LOGIC.
 * It robustly finds the default exported component and its return statement.
 * Uses dynamic imports to avoid process reference before shim loads.
 * 
 * NOTE: This function analyzes the code STRUCTURE for locations but doesn't generate
 * the actual node IDs that will be used in the AST. The actual node IDs are generated
 * during AST creation in componentParser.ts, so this elementLocationMap is mainly
 * for surgical code updates, not for selection mapping.
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
      ExportDefaultDeclaration(path: any) {
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
            ReturnStatement(returnPath: any) {
              if (returnPath.node.argument?.type === 'JSXElement' || returnPath.node.argument?.type === 'JSXFragment') {
                returnStatementPath = returnPath;
                // Stop traversing the inner part once we find the return
                returnPath.stop();
              }
            },
            // Do not traverse into nested functions
            Function(innerPath: any) {
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
          JSXOpeningElement(elPath: any) {
            const nodeId = `node-${idCounter++}`;
            const styleAttr = elPath.node.attributes.find(
              (attr: any) => attr.type === 'JSXAttribute' && attr.name.name === 'style'
            );
            
            elementLocationMap.set(nodeId, {
              start: elPath.node.start,
              end: elPath.node.end,
              style: styleAttr ? { 
                start: styleAttr.start, 
                end: styleAttr.end 
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
