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
  let wrapperSourceFromStore = '';
  try {
    // This is safe at call time from React runtime; avoid using hooks here.
    const store = (useComponentStore as unknown as { getState: () => { propsJson: string; wrapperCode: string } }).getState();
    if (store && typeof store.propsJson === 'string') {
      try {
        parsedProps = JSON.parse(store.propsJson || '{}');
      } catch {
        parsedProps = {};
      }
    }
    if (store && typeof store.wrapperCode === 'string') {
      wrapperSourceFromStore = store.wrapperCode;
    }
  } catch {
    parsedProps = {};
  }
  // 1. Clean up any previous component from the global scope to prevent stale references.
  (globalThis as any).USER_COMPONENT = undefined;
  (globalThis as any).WRAPPER_COMPONENT = undefined;

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

  // 3b. Transpile wrapper source if provided. Default to a pass-through wrapper if missing/invalid.
  let wrapperTranspiledCode = '';
  try {
    let wrapperSource = wrapperSourceFromStore || '';
    if (!wrapperSource.trim()) {
      wrapperSource = `function Wrapper({ children }) { return children; }\nexport default Wrapper;`;
    }
    // Replace export default and attach named declarations similarly
    let wrapperSourceForTranspile = wrapperSource.replace(/export\s+default\s+/, 'globalThis.WRAPPER_COMPONENT = ');
    wrapperSourceForTranspile = wrapperSourceForTranspile.replace(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/g, 'globalThis.$1 = function $1(');
    wrapperSourceForTranspile = wrapperSourceForTranspile.replace(/class\s+([A-Z][A-Za-z0-9_]*)\s*/g, 'globalThis.$1 = class $1 ');
    const wrapperResult = Babel.transform(wrapperSourceForTranspile, {
      presets: ['react', 'typescript'],
      filename: 'WrapperComponent.tsx',
    });
    wrapperTranspiledCode = wrapperResult?.code || '';
  } catch {
    wrapperTranspiledCode = `globalThis.WRAPPER_COMPONENT = function Wrapper({ children }) { return children; };`;
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
  (globalThis as any).WRAPPER_COMPONENT = undefined;
  new Function('React', transpiledCode)(ReactShim);
  if (wrapperTranspiledCode) new Function('React', wrapperTranspiledCode)(ReactShim);

  // 5. Retrieve the shim-executed component from the global scope (for preview resolution only).
  const UserComponentForPreview = (globalThis as any).USER_COMPONENT;
  const WrapperComponentForPreview = (globalThis as any).WRAPPER_COMPONENT;

  // 6. Clean up the global variable immediately after retrieval.
  (globalThis as any).USER_COMPONENT = undefined;
  (globalThis as any).WRAPPER_COMPONENT = undefined;

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

      if (typeof t === 'string') {
        const rawChildren = props.children;
        // Remove children from props when constructing host elements; they'll be provided as variadic args
        delete (props as any).children;
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
          // For function components, pass props WITH children so wrappers can forward children correctly
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
  (globalThis as any).WRAPPER_COMPONENT = undefined;
  new Function('React', transpiledCode)(React);
  if (wrapperTranspiledCode) new Function('React', wrapperTranspiledCode)(React);
  const UserComponentForRuntime = (globalThis as any).USER_COMPONENT;
  const WrapperComponentForRuntime = (globalThis as any).WRAPPER_COMPONENT;
  (globalThis as any).USER_COMPONENT = undefined;
  (globalThis as any).WRAPPER_COMPONENT = undefined;

  if (typeof UserComponentForRuntime !== 'function') {
    throw new Error('The code must have a default export that is a React component.');
  }

  // Reset counter at the start to ensure consistent ID assignment
  resetIdCounter();

  // Create runtime AST first (with real React for interactivity)
  const childRuntime = React.createElement(UserComponentForRuntime, parsedProps);
  const runtimeElement = WrapperComponentForRuntime
    ? React.createElement(WrapperComponentForRuntime, null, childRuntime)
    : childRuntime;
  const runtimeAst = serializeComponent(runtimeElement) as SerializableElement;

  // Then create preview AST (with resolved components for navigator)
  const childPreview = React.createElement(UserComponentForPreview, parsedProps);
  const previewWrapped = WrapperComponentForPreview
    ? React.createElement(WrapperComponentForPreview, null, childPreview)
    : childPreview;
  const resolvedTree = resolveNode(previewWrapped);
  try {
    console.log('renderer - resolvedTree isValidElement:', React.isValidElement(resolvedTree), 'isArray:', Array.isArray(resolvedTree as any));
    if (React.isValidElement(resolvedTree)) {
      const rt: any = resolvedTree;
      const len = Array.isArray(rt.props?.children) ? rt.props.children.length : (rt.props?.children ? 1 : 0);
      console.log('renderer - resolvedTree type:', rt.type, 'children length:', len);
    }
  } catch {
    // ignore diagnostic logging errors
  }
  const rootElement = React.isValidElement(resolvedTree)
    ? (resolvedTree as React.ReactElement)
    : React.createElement('div', null, resolvedTree);
  try {
    const re: any = rootElement;
    const len = Array.isArray(re.props?.children) ? re.props.children.length : (re.props?.children ? 1 : 0);
    console.log('renderer - rootElement type:', re.type, 'children length:', len);
  } catch {
    // ignore diagnostic logging errors
  }
  const previewAst = serializeComponent(rootElement) as SerializableElement;

  console.log('renderCodeToAst - runtimeAst:', runtimeAst);
  console.log('renderCodeToAst - runtimeAst children length:', Array.isArray((runtimeAst as any)?.props?.children) ? (runtimeAst as any).props.children.length : ((runtimeAst as any)?.props?.children ? 1 : 0));
  console.log('renderCodeToAst - previewAst:', previewAst);
  console.log('renderCodeToAst - previewAst children length:', Array.isArray((previewAst as any)?.props?.children) ? (previewAst as any).props.children.length : ((previewAst as any)?.props?.children ? 1 : 0));
  if (((previewAst as any)?.props?.children == null || (Array.isArray((previewAst as any).props.children) && (previewAst as any).props.children.length === 0)) &&
      ((runtimeAst as any)?.props?.children != null && (!Array.isArray((runtimeAst as any).props.children) || (runtimeAst as any).props.children.length > 0))) {
    console.warn('renderCodeToAst - previewAst has no children but runtimeAst does. Your wrapper may be swallowing children. Ensure it returns {children}.');
  }

  reviveTypes(runtimeAst);
  return { runtimeAst, previewAst };
}
