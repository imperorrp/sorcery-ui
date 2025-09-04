/**
 * Iframe Canvas - Isolated Component Rendering
 *
 * Renders components in a sandboxed iframe environment with selection
 * and interaction capabilities. Handles dependency injection, DOM events,
 * and portal rendering for isolated component execution.
 */
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useComponentStore } from '@/store/componentStore';
import { renderFromAst } from '@/lib/componentParser';
import type { SerializableElement } from '@/store/componentStore';

/**
 * Iframe-based canvas for isolated component rendering and interaction.
 * Manages sandboxed environment, dependency loading, and selection handling.
 */
export const IframeCanvas: React.FC = () => {
  // Use active component selectors for proper data access
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const componentAst = activeComponent?.componentAst ?? null;
  const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
  const selectionMode = useComponentStore((s) => s.selectionMode);
  const setSelectedNodeId = useComponentStore((s) => s.setSelectedNodeId);
  const dependencies = activeComponent?.dependencies ?? [];
  
  // Pull snapshot history to recover preview if current state lost it
  const history = activeComponent?.history ?? [];
  const historyIndex = activeComponent?.historyIndex ?? 0;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeBody, setIframeBody] = useState<HTMLBodyElement | null>(null);
  const [depTick, setDepTick] = useState(0);

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

  // Effect to manage injected <script> tags for dependencies
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;

    const head = iframe.contentDocument.head;
    // Clear existing scripts to avoid duplicates on re-render
    head.querySelectorAll('script[data-dependency]').forEach(el => el.remove());
  // Also clear mirrored scripts from parent (if any)
  document.head.querySelectorAll('script[data-dependency-mirror]').forEach(el => el.remove());

    // Add new scripts
    dependencies.forEach(url => {
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

  }, [dependencies, iframeBody]); // Re-run whenever the dependencies array or iframe body changes

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
    const hoverStyle = 'outline: 2px dashed #3b82f6; outline-offset: 2px;';

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
      const target = e.target as HTMLElement | null;
      if (!target) return;
      
      const el = target.closest('[data-node-id]') as HTMLElement | null;
      if (el) {
        const id = el.getAttribute('data-node-id');
        if (id) setSelectedNodeId(id);
      }
      e.preventDefault();
      e.stopPropagation();
    };
    doc.addEventListener('click', onClickCapture, true);
    return () => {
      doc.removeEventListener('mousemove', onMove);
      doc.removeEventListener('click', onClickCapture, true);
      if (hoverEl) hoverEl.style.outline = '';
    };
  }, [iframeBody, selectionMode, setSelectedNodeId]);

  return (
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
  );
};
