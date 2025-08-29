import * as Babel from '@babel/standalone';
import React from 'react';
import { createAst } from '@/lib/componentParser';

/**
 * Transpile, execute and return an AST for a user-provided component source string.
 * Throws on errors.
 */
export function renderCodeToAst(code: string) {
  // 1. Clean up any previous component from the global scope to prevent stale references.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).USER_COMPONENT = undefined;

  // 2. Prepare source for transpilation:
  // - Attach named function/class declarations to globalThis so revive can
  //   resolve component names later
  // - Replace `export default` with assignment to our USER_COMPONENT global.
  let sourceForTranspile = code.replace(/export\s+default\s+/, 'globalThis.USER_COMPONENT = ');

  // Attach named function declarations to globalThis
  sourceForTranspile = sourceForTranspile.replace(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g, 'globalThis.$1 = function $1(');
  // Attach named class declarations to globalThis
  sourceForTranspile = sourceForTranspile.replace(/class\s+([A-Z][A-Za-z0-9_]*)\s*/g, 'globalThis.$1 = class $1 ');

  // 3. Transpile the modified source code. Babel only needs to handle JSX/TS.
  const result = Babel.transform(sourceForTranspile, {
    presets: ['react', 'typescript'],
    filename: 'UserComponent.tsx',
  });

  const transpiledCode = result?.code;
  if (!transpiledCode) {
    throw new Error('Babel transpilation failed.');
  }

  // 4. Execute the plain JavaScript. It will assign the component to our global variable.
  // Provide React as the runtime global.
  // Using Function constructor intentionally for isolated execution.
  new Function('React', transpiledCode)(React);

  // 5. Retrieve the component from the global scope.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const UserComponent = (globalThis as any).USER_COMPONENT;

  // 6. Clean up the global variable immediately after retrieval.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).USER_COMPONENT = undefined;

  if (typeof UserComponent !== 'function') {
    throw new Error('The code must have a default export that is a React component.');
  }

  const componentInstance = React.createElement(UserComponent);
  const ast = createAst(componentInstance);

  // Recovery: sometimes component types are serialized as string names.
  // If a node has a type that's a capitalized string and a same-named
  // function exists on globalThis, replace the string with the function.
  const reviveTypes = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (typeof n.type === 'string' && /^[A-Z]/.test(n.type)) {
      const fn = (globalThis as Record<string, unknown>)[n.type as string];
      if (typeof fn === 'function' || typeof fn === 'object') {
        n.type = fn;
      }
    }
    const children = (n.props as { children?: unknown[] })?.children;
    if (Array.isArray(children)) {
      children.forEach((c: unknown) => {
        if (typeof c === 'object' && c !== null) reviveTypes(c);
      });
    }
  };

  reviveTypes(ast);
  return ast;
}
