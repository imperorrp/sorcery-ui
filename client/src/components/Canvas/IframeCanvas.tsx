/**
 * Iframe Canvas - Isolated Component Rendering with Advanced Selection
 *
 * Renders components in a sandboxed iframe environment with comprehensive selection
 * and interaction capabilities. Features include:
 * - Dependency injection with stabilization
 * - Advanced drill-down selection for overlapping elements (Shift+click)
 * - Live element highlighting during selection
 * - DOM event handling and portal rendering
 * - Context isolation management for proper store access
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
 * - Dependency management and script injection
 * - Selection mode switching (interact/select)
 */
export const IframeCanvas: React.FC = () => {
  // Use active component selectors for proper data access
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const componentAst = activeComponent?.componentAst ?? null;
  const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
  const selectionMode = useComponentStore((s) => s.selectionMode);
  const setSelectedNodeId = useComponentStore((s) => s.setSelectedNodeId);
  const setHoveredNodeId = useComponentStore((s) => s.setHoveredNodeId);
  const dependencies = React.useMemo(() => activeComponent?.dependencies ?? [], [activeComponent?.dependencies]);
  const globalCss = useComponentStore((s) => s.globalCss);
  
  // Pull snapshot history to recover preview if current state lost it
  const history = activeComponent?.history ?? [];
  const historyIndex = activeComponent?.historyIndex ?? 0;
  // history and historyIndex are retained for potential undo/preview logic; acknowledge to avoid linter complaints
  void history;
  void historyIndex;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeBody, setIframeBody] = useState<HTMLBodyElement | null>(null);
  const [depTick, setDepTick] = useState(0);
  // acknowledge depTick is intentionally present to force re-renders when deps load
  void depTick;

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
    let globalStyleEl = head.querySelector('#global-styles') as HTMLStyleElement;

    if (!globalStyleEl) {
      globalStyleEl = iframe.contentDocument.createElement('style');
      globalStyleEl.id = 'global-styles';
      head.appendChild(globalStyleEl);
    }

    globalStyleEl.innerHTML = globalCss;
  }, [iframeBody, globalCss]);
  // ▲▲▲ END GLOBAL CSS INJECTION ▲▲▲

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
