/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Babel from '@babel/standalone';
import React from 'react';
import { serializeComponent, resetIdCounter } from '@/lib/componentParser';
import type { SerializableElement } from '@/store/componentStore';
import { useComponentStore } from '@/store/componentStore';


/**
 * Transpile, execute and return an AST for a user-provided component source string.
 * Throws on errors.
 */
export function renderCodeToAst(code: string): { runtimeAst: SerializableElement; previewAst: SerializableElement } {
  // Access props JSON from store if available
  let parsedProps: Record<string, unknown> = {};
  try {
    // This is safe at call time from React runtime; avoid using hooks here.
    const store = (useComponentStore as unknown as { getState: () => { propsJson: string } }).getState();
    if (store && typeof store.propsJson === 'string') {
      try {
        parsedProps = JSON.parse(store.propsJson || '{}');
      } catch {
        parsedProps = {};
      }
    }
  } catch {
    parsedProps = {};
  }
  // 1. Clean up any previous component from the global scope to prevent stale references.
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

  // 4. Execute the plain JavaScript with a hooks-friendly React shim so executing
  // function/class components won't throw inside useState/useEffect at eval time for PREVIEW ONLY.
  const ReactShim: typeof React & {
    useState: <T>(init: T | (() => T)) => [T, (v: T | ((p: T) => T)) => void];
    useReducer: <S, A>(reducer: (s: S, a: A) => S, initArg: S, init?: (arg: S) => S) => [S, (a: A) => void];
    useEffect: (..._args: any[]) => void;
    useLayoutEffect: (..._args: any[]) => void;
    useRef: <T>(v?: T) => { current: T | undefined };
    useMemo: <T>(factory: () => T, _deps: any[]) => T;
    useCallback: <T extends (...a: any[]) => any>(fn: T, _deps: any[]) => T;
  } = {
    ...(React as any),
    useState: <T,>(init: T | (() => T)) => [typeof init === 'function' ? (init as () => T)() : init, () => {}],
    useReducer: <S, A>(_reducer: (s: S, a: A) => S, initArg: S, init?: (arg: S) => S) => [init ? init(initArg) : initArg, () => {}],
    useEffect: () => {},
    useLayoutEffect: () => {},
    useRef: <T,>(v?: T) => ({ current: v }),
    useMemo: <T,>(factory: () => T) => factory(),
    useCallback: <T extends (...a: any[]) => any>(fn: T) => fn,
  } as any;

  // First pass: evaluate with ReactShim to safely resolve a fully expanded preview tree.
  (globalThis as any).USER_COMPONENT = undefined;
  new Function('React', transpiledCode)(ReactShim);

  // 5. Retrieve the shim-executed component from the global scope (for preview resolution only).
  const UserComponentForPreview = (globalThis as any).USER_COMPONENT;

  // 6. Clean up the global variable immediately after retrieval.
  (globalThis as any).USER_COMPONENT = undefined;

  if (typeof UserComponentForPreview !== 'function') {
    throw new Error('The code must have a default export that is a React component.');
  }

  // Resolve the component tree by executing function/class components into host elements
  const resolveNode = (node: any): any => {
    if (node == null || typeof node === 'boolean') return null;
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(resolveNode).filter((n) => n != null);

    if (typeof node === 'object' && (node as any).type) {
      const el = node as React.ReactElement<any>;
      const t = el.type as any;
      const props = { ...(el.props || {}) } as Record<string, any>;
      const rawChildren = props.children;
      delete props.children;

      if (typeof t === 'string') {
        const children = Array.isArray(rawChildren)
          ? rawChildren.map(resolveNode)
          : rawChildren != null
          ? [resolveNode(rawChildren)]
          : [];
        return React.createElement(t, props, ...children);
      }

      try {
        let rendered: any;
        if (t.prototype && (t.prototype.isReactComponent || typeof t.prototype.render === 'function')) {
          const inst = new t(props);
          rendered = inst.render?.();
        } else {
          rendered = t(props);
        }
        return resolveNode(rendered);
  } catch {
        return el; // fallback without resolving
      }
    }

    return node;
  };

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

  // Second pass: evaluate with REAL React so runtime components use real hooks/state.
  // This ensures interaction mode behaves correctly (e.g., setState increments).
  (globalThis as any).USER_COMPONENT = undefined;
  new Function('React', transpiledCode)(React);
  const UserComponentForRuntime = (globalThis as any).USER_COMPONENT;
  (globalThis as any).USER_COMPONENT = undefined;

  if (typeof UserComponentForRuntime !== 'function') {
    throw new Error('The code must have a default export that is a React component.');
  }

  // Reset counter at the start to ensure consistent ID assignment
  resetIdCounter();

  // Create runtime AST first (with real React for interactivity)
  const runtimeElement = React.createElement(UserComponentForRuntime, parsedProps);
  const runtimeAst = serializeComponent(runtimeElement) as SerializableElement;

  // Then create preview AST (with resolved components for navigator)
  const resolvedTree = resolveNode(React.createElement(UserComponentForPreview, parsedProps));
  const rootElement = React.isValidElement(resolvedTree)
    ? (resolvedTree as React.ReactElement)
    : React.createElement('div', null, resolvedTree);
  const previewAst = serializeComponent(rootElement) as SerializableElement;

  reviveTypes(runtimeAst);
  return { runtimeAst, previewAst };
}
