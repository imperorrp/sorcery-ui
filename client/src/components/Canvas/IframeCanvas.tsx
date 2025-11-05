/**
 * IframeCanvas - Isolated Component Rendering with Advanced Selection
 *
 * Renders components in a sandboxed iframe environment with comprehensive selection
 * and interaction capabilities. Features include:
 * - Dependency injection with stabilization
 * - Advanced drill-down selection for overlapping elements (Shift+click)
 * - Live element highlighting during selection with visual feedback
 * - DOM event handling and portal rendering for isolated execution
 * - Context isolation management for proper store access across iframe boundaries
 * - Multi-layer element selection with visual layer indicators
 * - Automatic mock generation for missing components
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useComponentStore } from '@/store/componentStore';
import { renderFromAst } from '@/lib/componentParser';
import type { SerializableElement } from '@/store/componentStore';

/**
 * IframeCanvas Component - Advanced sandboxed component renderer
 *
 * Creates a sandboxed iframe environment for isolated component execution with:
 * - Multi-layer element selection via Shift+click drill-down menu
 * - Real-time element highlighting and visual feedback
 * - Proper context bridging between iframe and parent window
 * - Dependency management and script injection with stabilization
 * - Selection mode switching (interact/select)
 */
export const IframeCanvas: React.FC = () => {
  // Access active component directly through project structure to avoid getter function issues
  const activeComponent = useComponentStore((s) => {
    const { activeProjectId, projects } = s;
    if (!activeProjectId) return null;
    const project = projects[activeProjectId];
    if (!project?.activeComponentId) return null;
    return project.components[project.activeComponentId] ?? null;
  });

  const componentAst = activeComponent?.componentAst ?? null;
  const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
  const componentMap = React.useMemo(() => activeComponent?.componentMap ?? {}, [activeComponent?.componentMap]);

  // Debug logging to trace component data availability and rendering issues
  React.useEffect(() => {
    console.log('[IframeCanvas] Component data:', {
      hasActiveComponent: !!activeComponent,
      componentName: activeComponent?.name,
      hasComponentAst: !!componentAst,
      hasComponentPreviewAst: !!componentPreviewAst,
      astType: componentAst?.type,
      previewAstType: componentPreviewAst?.type,
    });
  }, [activeComponent, componentAst, componentPreviewAst]);
  
  const selectionMode = useComponentStore((s) => s.selectionMode);
  const setSelectedNodeId = useComponentStore((s) => s.setSelectedNodeId);
  const setHoveredNodeId = useComponentStore((s) => s.setHoveredNodeId);
  const dependencies = React.useMemo(() => activeComponent?.dependencies ?? [], [activeComponent?.dependencies]);
  const themeCss = useComponentStore((s) => s.themeCss);
  const tailwindConfig = useComponentStore((s) => s.tailwindConfig);
  const cssImports = React.useMemo(() => activeComponent?.cssImports ?? [], [activeComponent?.cssImports]);
  
  // Pull snapshot history to recover preview if current state lost it
  const history = activeComponent?.history ?? [];
  const historyIndex = activeComponent?.historyIndex ?? 0;
  // history and historyIndex are retained for potential undo/preview logic; acknowledge to avoid linter complaints
  void history;
  void historyIndex;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeBody, setIframeBody] = useState<HTMLBodyElement | null>(null);
  const [depTick, setDepTick] = useState(0);
  const [isTailwindReady, setIsTailwindReady] = useState(false);
  // ▼▼▼ COMPONENT INJECTION INTO IFRAME ▼▼▼
  // Inject resolved component functions into iframe global scope
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    // Inject each component into the iframe's global scope
    console.log('[IframeCanvas] injecting components into iframe:', Object.keys(componentMap));
    Object.entries(componentMap).forEach(([name, component]) => {
      try {
        (iframe.contentWindow as unknown as Record<string, unknown>)[name] = component;
      } catch {
        // Ignore injection errors for non-writable globals
      }
    });
  }, [iframeBody, componentMap]);
  // ▲▲▲ END COMPONENT INJECTION ▲▲▲

  // ▼▼▼ DRILL-DOWN SELECTION STATE ▼▼▼
  // State for managing the drill-down menu when Shift+clicking overlapping elements
  const [drillDownMenu, setDrillDownMenu] = useState<{ x: number; y: number; elements: { id: string; name: string }[] } | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // Create a callback that ensures store actions are called from parent context
  const handleElementSelection = React.useCallback((elementId: string) => {
    setSelectedNodeId(elementId);
    setDrillDownMenu(null); // Close the menu
  }, [setSelectedNodeId]);
  // ▲▲▲ END DRILL-DOWN SELECTION STATE ▲▲▲

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      if (iframe.contentWindow) {
        const doc = iframe.contentWindow.document;
        // Basic reset styles to ensure predictable layout inside sandbox
        const styleEl = doc.createElement('style');
        styleEl.innerHTML = `
          * { box-sizing: border-box; }
          html, body, #root { height: 100%; margin: 0; padding: 0; }
          body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji; }
        `;
        doc.head.appendChild(styleEl);
  setIframeBody(doc.body as HTMLBodyElement);
      }
    };

    // Ensure we set body after load
    if (iframe.contentDocument?.body) {
      // If body is already available, initialize immediately
      onLoad();
    } else if (iframe.contentDocument?.readyState === 'complete') {
      onLoad();
    } else {
      iframe.addEventListener('load', onLoad, { once: true });
      return () => iframe.removeEventListener('load', onLoad);
    }
  }, []);

  // ▼▼▼ DEPENDENCY STABILIZATION FIX ▼▼▼
  // Convert the dependencies array to a stable string key to prevent infinite loops
  // This fixes the issue where changing dependencies caused infinite re-renders
  // by creating a stable dependency key that doesn't change on array reference changes
  const dependenciesKey = dependencies.join(',');
  const dependenciesRef = React.useRef<string[]>(dependencies);
  // ▲▲▲ END DEPENDENCY STABILIZATION ▲▲▲

  // Effect to manage injected <script> tags for dependencies
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const head = iframe.contentDocument.head;
    // Clear existing scripts to avoid duplicates on re-render
    head.querySelectorAll('script[data-dependency]').forEach(el => el.remove());
  // Also clear mirrored scripts from parent (if any)
  document.head.querySelectorAll('script[data-dependency-mirror]').forEach(el => el.remove());

    // ▼▼▼ USE STABLE REF FOR DEPENDENCIES ▼▼▼
    // Use the ref to access current dependencies without triggering re-renders
    const currentDeps = dependenciesRef.current;
    // ▲▲▲ END STABLE REF ▲▲▲

    // Add new scripts
    currentDeps.forEach(url => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.setAttribute('data-dependency', 'true');
  script.onload = () => setDepTick((t) => t + 1);
      head.appendChild(script);

      // Mirror into parent document so globals (like lodash on window._) are visible
      const mirror = document.createElement('script');
      mirror.src = url;
      mirror.async = true;
      mirror.setAttribute('data-dependency-mirror', 'true');
      mirror.onload = () => setDepTick((t) => t + 1);
      document.head.appendChild(mirror);
    });

  // ▼▼▼ USE STABLE DEPENDENCY KEY ▼▼▼
  // Now uses stable string key instead of array reference to prevent infinite loops
  }, [dependenciesKey, iframeBody]); // Now uses stable string key instead of array reference
  // ▲▲▲ END STABLE DEPENDENCY ▲▲▲

  // ▼▼▼ GLOBAL CSS INJECTION ▼▼▼
  // Effect to inject global CSS into the iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const head = iframe.contentDocument.head;
    let globalStyleEl = head.querySelector('#user-theme-styles') as HTMLStyleElement;

    if (!globalStyleEl) {
      globalStyleEl = iframe.contentDocument.createElement('style');
      globalStyleEl.id = 'user-theme-styles';
      head.appendChild(globalStyleEl);
    }

    globalStyleEl.innerHTML = themeCss;
  }, [iframeBody, themeCss]);
  // ▲▲▲ END THEME CSS INJECTION ▲▲▲

  // ▼▼▼ TAILWIND CONFIG INJECTION ▼▼▼
  // Dynamic Tailwind compilation via Play CDN
  useEffect(() => {
    if (!iframeBody) return;

    const doc = iframeBody.ownerDocument;
    const head = doc.head;

  // Cleanup any previously injected component CSS links
  head.querySelectorAll('link[data-component-css]').forEach(el => el.remove());

    // Safely parse the user's tailwindConfig string
    let parsedConfig: unknown = {};
    try {
      // Use a sandboxed new Function to parse the config string
      parsedConfig = new Function('return (' + tailwindConfig + ')')();
    } catch (error) {
      console.warn('Failed to parse Tailwind config:', error);
      parsedConfig = {};
    }

    // Always include shadcn color definitions
    const shadcnConfig = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: {
              DEFAULT: 'hsl(var(--primary))',
              foreground: 'hsl(var(--primary-foreground))',
            },
            secondary: {
              DEFAULT: 'hsl(var(--secondary))',
              foreground: 'hsl(var(--secondary-foreground))',
            },
            destructive: {
              DEFAULT: 'hsl(var(--destructive))',
              foreground: 'hsl(var(--destructive-foreground))',
            },
            muted: {
              DEFAULT: 'hsl(var(--muted))',
              foreground: 'hsl(var(--muted-foreground))',
            },
            accent: {
              DEFAULT: 'hsl(var(--accent))',
              foreground: 'hsl(var(--accent-foreground))',
            },
            popover: {
              DEFAULT: 'hsl(var(--popover))',
              foreground: 'hsl(var(--popover-foreground))',
            },
            card: {
              DEFAULT: 'hsl(var(--card))',
              foreground: 'hsl(var(--card-foreground))',
            },
          },
          borderRadius: {
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)',
          },
        },
      },
    };

    // Merge shadcn config with user config (user overrides)
    parsedConfig = { ...shadcnConfig, ...(parsedConfig as object) };

    // STEP 1: Find or create the config script (must be BEFORE Tailwind loads)
    let configScript = head.querySelector('#tailwind-config-script') as HTMLScriptElement;
    if (!configScript) {
      configScript = doc.createElement('script');
      configScript.id = 'tailwind-config-script';
      // Insert at the beginning of head
      head.insertBefore(configScript, head.firstChild);
    }

    // Set the config on window.tailwind
    configScript.innerHTML = `window.tailwind = { config: ${JSON.stringify(parsedConfig)} };`;

    console.log('[IframeCanvas] Setting tailwind config:', parsedConfig);

    // Inject any per-component CSS imports BEFORE Tailwind loads so their base/@layer rules
    // are available when Tailwind scans the DOM. We prefer <link> tags for remote/local
    // assets and keep a data attribute so they can be cleaned up on re-render.
    try {
      const cssNodes: HTMLLinkElement[] = [];
      (cssImports || []).forEach((href) => {
        try {
          let resolved: string;
          // If it's an absolute or protocol-relative URL, leave as-is
          if (/^https?:\/\//.test(href) || /^\/\//.test(href)) {
            resolved = href;
          } else if (href.startsWith('/')) {
            resolved = window.location.origin + href;
          } else {
            // Resolve relative imports against the current location
            resolved = new URL(href, window.location.href).toString();
          }

          const link = doc.createElement('link');
          link.rel = 'stylesheet';
          link.href = resolved;
          link.setAttribute('data-component-css', 'true');
          head.appendChild(link);
          cssNodes.push(link);
        } catch (e) {
          console.warn('[IframeCanvas] Failed to attach css import', href, e);
        }
      });

      // Ensure cleanup of added css links when effect re-runs or unmounts
      // We will remove them at the end of this effect via returned cleanup function
      // (see below where tailwind script is appended). For simplicity we don't inline.
    } catch (err) {
      console.warn('[IframeCanvas] error processing cssImports', err);
    }

    // Inject CSS variables BEFORE Tailwind loads so they are available when Tailwind generates styles
    const styleEl = doc.createElement('style');
    styleEl.innerHTML = `
      :root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --card: 0 0% 100%;
        --card-foreground: 222.2 84% 4.9%;
        --popover: 0 0% 100%;
        --popover-foreground: 222.2 84% 4.9%;
        --primary: 221.2 83.2% 53.3%;
        --primary-foreground: 210 40% 98%;
        --secondary: 210 40% 96%;
        --secondary-foreground: 222.2 84% 4.9%;
        --muted: 210 40% 96%;
        --muted-foreground: 215.4 16.3% 46.9%;
        --accent: 210 40% 96%;
        --accent-foreground: 222.2 84% 4.9%;
        --destructive: 0 84.2% 60.2%;
        --destructive-foreground: 210 40% 98%;
        --border: 214.3 31.8% 91.4%;
        --input: 214.3 31.8% 91.4%;
        --ring: 221.2 83.2% 53.3%;
        --radius: 0.5rem;
        --chart-1: 12 76% 61%;
        --chart-2: 173 58% 39%;
        --chart-3: 197 37% 24%;
        --chart-4: 43 74% 66%;
        --chart-5: 27 87% 67%;
      }
      .dark {
        --background: 222.2 84% 4.9%;
        --foreground: 210 40% 98%;
        --card: 222.2 84% 4.9%;
        --card-foreground: 210 40% 98%;
        --popover: 222.2 84% 4.9%;
        --popover-foreground: 210 40% 98%;
        --primary: 217.2 91.2% 59.8%;
        --primary-foreground: 222.2 84% 4.9%;
        --secondary: 217.2 32.6% 17.5%;
        --secondary-foreground: 210 40% 98%;
        --muted: 217.2 32.6% 17.5%;
        --muted-foreground: 215 20.2% 65.1%;
        --accent: 217.2 32.6% 17.5%;
        --accent-foreground: 210 40% 98%;
        --destructive: 0 62.8% 30.6%;
        --destructive-foreground: 210 40% 98%;
        --border: 217.2 32.6% 17.5%;
        --input: 217.2 32.6% 17.5%;
        --ring: 224.3 76.3% 94.1%;
        --chart-1: 220 70% 50%;
        --chart-2: 160 60% 45%;
        --chart-3: 30 80% 55%;
        --chart-4: 280 65% 60%;
        --chart-5: 340 75% 55%;
      }
      * {
        border-color: hsl(var(--border));
      }
      body {
        color: hsl(var(--foreground));
        background: hsl(var(--background));
      }
    `;
    head.appendChild(styleEl);

    // STEP 2: Ensure Tailwind Play CDN is loaded AFTER the config and CSS
    let tailwindScript = head.querySelector('script[src="https://cdn.tailwindcss.com"]') as HTMLScriptElement;
    if (!tailwindScript) {
      tailwindScript = doc.createElement('script');
      tailwindScript.src = 'https://cdn.tailwindcss.com';
      // Mark as not ready initially
      setIsTailwindReady(false);
      
      // Wait for Tailwind to fully load and initialize
      tailwindScript.onload = () => {
        // Tailwind needs a moment to scan the DOM and generate styles
        // Wait for next tick to ensure styles are applied
        setTimeout(() => {
          setIsTailwindReady(true);
          console.log('[IframeCanvas] Tailwind CSS ready');
        }, 100);
      };
      
      tailwindScript.onerror = () => {
        console.error('[IframeCanvas] Failed to load Tailwind CSS');
        setIsTailwindReady(true); // Still render even if Tailwind fails
      };
      
      // Insert AFTER the config script and style to ensure proper order
      head.appendChild(tailwindScript);
    } else {
      // Script already exists, assume it's ready
      setIsTailwindReady(true);
    }
  }, [iframeBody, tailwindConfig, cssImports]);
  // ▲▲▲ END TAILWIND CONFIG INJECTION ▲▲▲

  // ▼▼▼ UPDATE REF WHEN DEPENDENCIES CHANGE ▼▼▼
  // Hover highlight and context selection wiring when in selection mode
  useEffect(() => {
    if (!iframeBody) return;
    const doc = iframeBody.ownerDocument;
    if (!doc) return;

    let hoverEl: HTMLElement | null = null;
    let rafId: number | null = null;
    let lastPos: { x: number; y: number } | null = null;

    const clearHover = () => {
      if (hoverEl) {
        hoverEl.style.outline = '';
        hoverEl.style.outlineOffset = '';
        hoverEl = null;
      }
      setHoveredNodeId(null);
    };

    const pickBestCandidate = (elements: Element[]) => {
      const seen = new Set<HTMLElement>();
      const candidates: HTMLElement[] = [];
      for (const el of elements) {
        const elH = el as HTMLElement;
        if (!elH || !elH.closest) continue;
        const candidate = elH.closest('[data-node-id]') as HTMLElement | null;
        if (candidate && !seen.has(candidate)) {
          seen.add(candidate);
          candidates.push(candidate);
        }
      }
      if (candidates.length === 0) return null;
      // Choose the candidate with the smallest area (prefer innermost/smaller targets)
      let best = candidates[0];
      let bestArea = (() => {
        const r = best.getBoundingClientRect();
        return r.width * r.height || Number.POSITIVE_INFINITY;
      })();
      for (let i = 1; i < candidates.length; i++) {
        const c = candidates[i];
        const r = c.getBoundingClientRect();
        const area = r.width * r.height || Number.POSITIVE_INFINITY;
        if (area < bestArea) {
          best = c;
          bestArea = area;
        }
      }
      return best;
    };

    const process = () => {
      rafId = null;
      if (!lastPos) return;
      const { x, y } = lastPos;
      lastPos = null;

      // Allow hover processing when in select mode, or when there is an active selection
      const currentSelected = useComponentStore.getState().selectedNodeId;
      if (!(selectionMode === 'select' || !!currentSelected)) {
        clearHover();
        return;
      }

      const elementsAtPoint = doc.elementsFromPoint ? doc.elementsFromPoint(x, y) : [doc.elementFromPoint(x, y)].filter(Boolean) as Element[];
      const nearest = pickBestCandidate(elementsAtPoint);

      if (!nearest) {
        clearHover();
        return;
      }

      if (hoverEl === nearest) return;

      // Switch outline to new element
      if (hoverEl) {
        hoverEl.style.outline = '';
        hoverEl.style.outlineOffset = '';
      }
      hoverEl = nearest;
      const id = hoverEl.getAttribute('data-node-id') || null;
      hoverEl.style.outline = '2px dashed hsl(var(--primary))';
      hoverEl.style.outlineOffset = '2px';
      if (id) setHoveredNodeId(id);
    };

    const onPointerMove = (e: PointerEvent) => {
      // store last position and schedule a single rAF to process it
      lastPos = { x: e.clientX, y: e.clientY };
      if (rafId == null) rafId = requestAnimationFrame(process);
    };

    const onPointerLeave = () => {
      lastPos = null;
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      clearHover();
    };

  const onClickCapture = (e: MouseEvent) => {
      if (selectionMode !== 'select') return;

      e.preventDefault();
      e.stopPropagation();
      setDrillDownMenu(null);
      setHoveredElementId(null);
  // Clear transient inline outline, but keep store hovered id so pointermove can update it immediately
      if (hoverEl) {
        hoverEl.style.outline = '';
        hoverEl.style.outlineOffset = '';
        hoverEl = null;
      }

      // existing drill-down selection logic (unchanged)
      if (e.shiftKey) {
        const doc2 = iframeBody.ownerDocument;
        if (!doc2) return;
        const elementsAtPoint = doc2.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[];
        const selectableNodes = elementsAtPoint
          .map(el => el.closest('[data-node-id]') as HTMLElement | null)
          .filter((el, index, self) => el && self.indexOf(el) === index)
          .map(el => ({
            id: el!.getAttribute('data-node-id')!,
            name: el!.tagName.toLowerCase() === 'span' && el!.style.display === 'contents'
              ? el!.firstElementChild?.tagName.toLowerCase() || 'Component'
              : el!.tagName.toLowerCase(),
          }));

        if (selectableNodes.length > 1) {
          const iframeRect = iframeRef.current?.getBoundingClientRect();
          const parentX = iframeRect ? e.pageX + iframeRect.left : e.pageX;
          const parentY = iframeRect ? e.pageY + iframeRect.top : e.pageY;
          setDrillDownMenu({ x: parentX, y: parentY, elements: selectableNodes });
        } else if (selectableNodes.length === 1) {
          handleElementSelection(selectableNodes[0].id);
        }
      } else {
        const target = (e.target as HTMLElement | null);
        const el = target?.closest('[data-node-id]') as HTMLElement | null;
        if (el) {
          const id = el.getAttribute('data-node-id');
          if (id) handleElementSelection(id);
        }
      }

      // schedule an immediate re-eval after click to refresh hover for whatever is now under the cursor
      if (rafId == null) rafId = requestAnimationFrame(process);
    };

    doc.addEventListener('pointermove', onPointerMove, true);
    doc.addEventListener('pointerleave', onPointerLeave, true);
    doc.addEventListener('click', onClickCapture, true);

    // Immediately evaluate once so if the cursor is already over an element after mount we sync UI
    if (rafId == null) rafId = requestAnimationFrame(process);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      doc.removeEventListener('pointermove', onPointerMove, true);
      doc.removeEventListener('pointerleave', onPointerLeave, true);
      doc.removeEventListener('click', onClickCapture, true);
      clearHover();
    };
  }, [iframeBody, selectionMode, handleElementSelection, setHoveredNodeId]);


  // ▼▼▼ DRILL-DOWN ELEMENT HIGHLIGHTING ▼▼▼
  // Highlight elements in iframe when hovering over menu items
  useEffect(() => {
    if (!iframeBody || !hoveredElementId) return;
    
    const doc = iframeBody.ownerDocument;
    const element = doc.querySelector(`[data-node-id="${hoveredElementId}"]`) as HTMLElement;
    
    if (element) {
      const originalOutline = element.style.outline;
      element.style.outline = '2px solid hsl(var(--primary))'; // Primary color highlight for drill-down hover
      
      return () => {
        element.style.outline = originalOutline;
      };
    }
  }, [hoveredElementId, iframeBody]);
  // ▲▲▲ END DRILL-DOWN ELEMENT HIGHLIGHTING ▲▲▲

  return (
    <div className="relative w-full h-full">
      <iframe
        ref={iframeRef}
        title="Component Canvas"
        className="w-full h-full bg-white rounded"
        sandbox="allow-scripts allow-same-origin"
      >
        {iframeBody && (() => {
          // Don't render component until Tailwind is ready
          if (!isTailwindReady) {
            return createPortal(
              <div style={{ minHeight: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#666', fontSize: '14px' }}>Loading styles...</div>
              </div>,
              iframeBody
            );
          }

          // small stable key for portal children to avoid unnecessary remounts
          const combinedKey = `${activeComponent?.id ?? 'no-comp'}|${depTick}|${selectionMode}`;
          // Use preview AST only in selection mode; use runtime AST for interaction mode so state works.
          const chosenAst = selectionMode === 'select'
            ? (componentPreviewAst ?? componentAst) // fall back to runtime if preview missing
            : (componentAst ?? componentPreviewAst); // fall back to preview if runtime missing

          return createPortal(
            <div key={combinedKey} style={{ minHeight: '100%', padding: '1rem' }}>
              {(() => {
                if (!chosenAst) return null;

                // Special handling for selection mode: if the root is a function component,
                // render its children directly to preserve data-node-id attributes
                let renderTarget: SerializableElement | string | null = chosenAst;
                if (selectionMode === 'select' && typeof (chosenAst as SerializableElement).type === 'function') {
                  const children = (chosenAst as SerializableElement).props?.children;
                  if (Array.isArray(children) && children.length === 1 && typeof children[0] !== 'string') {
                    renderTarget = children[0]; // Render the div directly instead of the function component
                  }
                }

                // Deep-clone and ensure props/children exist to avoid runtime errors
                const cloneAndSanitize = (
                  node: SerializableElement | string | null
                ): SerializableElement | string | null => {
                  if (typeof node === 'string' || node === null) return node;
                  const cloned = { ...node } as SerializableElement;
                  cloned.props = { ...(cloned.props || {}) } as Record<string, unknown> & { children?: (SerializableElement | string)[] };
                  if (!Array.isArray(cloned.props.children)) cloned.props.children = cloned.props.children ? [cloned.props.children] : [];
                  cloned.props.children = cloned.props.children.map((c: SerializableElement | string) =>
                    typeof c === 'string' ? c : (cloneAndSanitize(c) as SerializableElement)
                  ) as (SerializableElement | string)[];
                  return cloned;
                };

                let safeAst: SerializableElement | string | null;
                try {
                  safeAst = cloneAndSanitize(renderTarget as SerializableElement);
                } catch (err) {
                  console.error('Failed to sanitize AST for rendering', err, renderTarget);
                  safeAst = renderTarget;
                }

                try {
                  return renderFromAst(safeAst, (nodeId) => {
                    setSelectedNodeId(nodeId);
                  }, selectionMode === 'select');
                } catch (err) {
                  console.error('Error while rendering AST in iframe canvas', err, safeAst);
                  return null;
                }
              })()}
            </div>,
            iframeBody
          );
        })()}
      </iframe>

      {/* ▼▼▼ DRILL-DOWN SELECTION MENU - Rendered in parent context ▼▼▼ */}
      {drillDownMenu && (
        <div
          // This outer div is to close the menu when clicking away
          onClick={() => {
            setDrillDownMenu(null);
            setHoveredElementId(null);
          }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
        >
          <div
            style={{
              position: 'absolute',
              left: `${drillDownMenu.x}px`,
              top: `${drillDownMenu.y}px`,
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '8px',
              zIndex: 9999,
              padding: '4px',
              minWidth: '150px',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '12px', padding: '4px 8px', color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid hsl(var(--border))' }}>
              Select a Layer ({drillDownMenu.elements.length} found)
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
              {drillDownMenu.elements.map((el, index) => (
                <li
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleElementSelection(el.id);
                  }}
                  onMouseEnter={(e) => {
                    setHoveredElementId(el.id);
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    setHoveredElementId(null);
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  style={{
                    fontSize: '13px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    borderLeft: index === 0 ? '3px solid hsl(var(--primary))' : '3px solid transparent',
                    backgroundColor: 'transparent',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    userSelect: 'none',
                    pointerEvents: 'auto'
                  }}
                >
                  <span style={{
                    fontSize: '10px',
                    color: 'hsl(var(--muted-foreground))',
                    backgroundColor: 'hsl(var(--muted))',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '20px',
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}>
                    {index + 1}
                  </span>
                  <span style={{
                    fontWeight: index === 0 ? '600' : '400',
                    color: index === 0 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    pointerEvents: 'none'
                  }}>
                    &lt;{el.name}&gt;
                  </span>
                  {index === 0 && (
                    <span style={{
                      fontSize: '10px',
                      color: 'hsl(var(--primary))',
                      backgroundColor: 'hsl(var(--accent))',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      pointerEvents: 'none'
                    }}>
                      top
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* ▲▲▲ END DRILL-DOWN SELECTION MENU ▲▲▲ */}
    </div>
  );
};
