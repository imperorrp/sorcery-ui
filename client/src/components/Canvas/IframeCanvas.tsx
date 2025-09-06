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
  const dependencies = React.useMemo(() => activeComponent?.dependencies ?? [], [activeComponent?.dependencies]);
  
  // Pull snapshot history to recover preview if current state lost it
  const history = activeComponent?.history ?? [];
  const historyIndex = activeComponent?.historyIndex ?? 0;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeBody, setIframeBody] = useState<HTMLBodyElement | null>(null);
  const [depTick, setDepTick] = useState(0);

  // ▼▼▼ DRILL-DOWN SELECTION STATE ▼▼▼
  // State for managing the drill-down menu when Shift+clicking overlapping elements
  const [drillDownMenu, setDrillDownMenu] = useState<{ x: number; y: number; elements: { id: string; name: string }[] } | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // Create a callback that ensures store actions are called from parent context
  const handleElementSelection = React.useCallback((elementId: string) => {
    console.log('🎯 Canvas: handleElementSelection called with:', elementId);
    console.log('🎯 Canvas: Calling setSelectedNodeId...');
    setSelectedNodeId(elementId);
    console.log('🎯 Canvas: setSelectedNodeId call completed');
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
        console.log('Iframe body set');
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

  // ▼▼▼ DEPENDENCY STABILIZATION FIX (v1.1) ▼▼▼
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

  // ▼▼▼ UPDATE REF WHEN DEPENDENCIES CHANGE ▼▼▼
  // Keep the ref in sync with the current dependencies
  // This ensures the ref always has the latest dependency list
  React.useEffect(() => {
    dependenciesRef.current = dependencies;
  }, [dependencies]);
  // ▲▲▲ END REF UPDATE ▲▲▲

  // In case the body becomes available later (e.g., browser quirk), retry when AST changes
  useEffect(() => {
    if (!iframeBody) {
      const iframe = iframeRef.current;
      if (iframe?.contentDocument?.body) {
        setIframeBody(iframe.contentDocument.body as HTMLBodyElement);
      }
    }
  }, [iframeBody, componentAst]);

  // No DOM snapshot needed; navigator uses fully resolved AST

  // Choose AST based on mode (previewAst for selection so nested nodes exist)
  const latestPreview = componentPreviewAst ?? history?.[historyIndex]?.preview ?? null;
  const chosenAst = selectionMode === 'select' ? latestPreview : componentAst;
  // Force full re-render when chosen AST or selection mode changes to refresh handlers inside iframe
  const astKey = chosenAst ? JSON.stringify(chosenAst).length : 0;
  const modeKey = selectionMode;
  const combinedKey = `${astKey}-${modeKey}-${depTick}`;

  // Diagnostics: after render, inspect iframe DOM to verify nodes are present
  useEffect(() => {
    if (!iframeBody) return;
    const doc = iframeBody.ownerDocument;
    if (!doc) return;
    // Defer to next tick to allow portal to commit
    const t = setTimeout(() => {
      try {
        const count = doc.querySelectorAll('[data-node-id]').length;
        const len = doc.body?.innerHTML?.length ?? 0;
        console.log('IframeCanvas - after render: node count =', count, 'body HTML length =', len);
      } catch (e) {
        console.warn('IframeCanvas - post-render inspection failed', e);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [combinedKey, iframeBody]);

  // Hover highlight and context selection wiring when in selection mode
  useEffect(() => {
    if (!iframeBody) return;
    const doc = iframeBody.ownerDocument;
    if (!doc) return;

    let hoverEl: HTMLElement | null = null;
    const hoverStyle = 'outline: 2px dashed hsl(var(--primary)); outline-offset: 2px;';

    const onMove = (e: MouseEvent) => {
      if (selectionMode !== 'select') return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (hoverEl === target) return;
      if (hoverEl) hoverEl.style.outline = '';
      hoverEl = target;
      hoverEl.style.cssText += hoverStyle;
    };

    doc.addEventListener('mousemove', onMove);

    // Capture click for selection mode: select closest data-node-id and block app handlers
    const onClickCapture = (e: MouseEvent) => {
      if (selectionMode !== 'select') return;

      e.preventDefault();
      e.stopPropagation();
      setDrillDownMenu(null); // Always close any existing menu on a new click
      setHoveredElementId(null); // Clear any hovered element

      // ▼▼▼ DRILL-DOWN SELECTION LOGIC ▼▼▼
      // Check if the Shift key is pressed for drill-down selection
      if (e.shiftKey) {
        const doc = iframeBody.ownerDocument;
        if (!doc) return;

        // Use `elementsFromPoint` to get a list of all elements under the cursor
        const elementsAtPoint = doc.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[];

        console.log('🔍 Drill-down: elementsFromPoint found:', elementsAtPoint.length, 'elements');
        console.log('🔍 Drill-down: Raw elements at point:', elementsAtPoint.map(el => el.tagName));

        // Filter this list to get only our unique, selectable component elements
        const selectableNodes = elementsAtPoint
          .map(el => el.closest('[data-node-id]') as HTMLElement | null)
          .filter((el, index, self) => el && self.indexOf(el) === index) // Get unique elements
          .map(el => ({
            id: el!.getAttribute('data-node-id')!,
            // Get the tag name, or the component name for our wrapped components
            name: el!.tagName.toLowerCase() === 'span' && el!.style.display === 'contents'
              ? el!.firstElementChild?.tagName.toLowerCase() || 'Component'
              : el!.tagName.toLowerCase(),
          }));

        console.log('🔍 Drill-down: Selectable nodes found:', selectableNodes);

        if (selectableNodes.length > 1) {
          // If there are multiple layers, open our custom drill-down menu
          // Convert iframe coordinates to parent document coordinates
          const iframeRect = iframeRef.current?.getBoundingClientRect();
          const parentX = iframeRect ? e.pageX + iframeRect.left : e.pageX;
          const parentY = iframeRect ? e.pageY + iframeRect.top : e.pageY;
          
          setDrillDownMenu({ x: parentX, y: parentY, elements: selectableNodes });
        } else if (selectableNodes.length === 1) {
          // If only one selectable element is found, select it directly
          handleElementSelection(selectableNodes[0].id);
        }
      } else {
        // This is the normal click logic (no Shift key)
        const target = e.target as HTMLElement | null;
        const el = target?.closest('[data-node-id]') as HTMLElement | null;
        if (el) {
          const id = el.getAttribute('data-node-id');
          if (id) handleElementSelection(id);
        }
      }
      // ▲▲▲ END DRILL-DOWN SELECTION LOGIC ▲▲▲
    };
    doc.addEventListener('click', onClickCapture, true);
    return () => {
      doc.removeEventListener('mousemove', onMove);
      doc.removeEventListener('click', onClickCapture, true);
      if (hoverEl) hoverEl.style.outline = '';
    };
  }, [iframeBody, selectionMode, handleElementSelection]);

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
        {iframeBody && createPortal(
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
        )}
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
                    console.log('🔍 Drill-down menu: Clicking element with ID:', el.id);
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
