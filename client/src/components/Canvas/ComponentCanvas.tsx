/**
 * Component Canvas - Live Component Rendering
 *
 * Main canvas component that renders components in an iframe and handles
 * element selection with visual highlighting. Manages the display of
 * rendered components with interactive selection capabilities.
 */
import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { IframeCanvas } from './IframeCanvas';

/**
 * Canvas component that orchestrates component rendering and selection.
 * Handles iframe rendering, selection highlighting, and state management.
 */
export const ComponentCanvas = () => {
  // Use active component selectors for proper data access
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const componentAst = activeComponent?.componentAst ?? null;
  const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
  const selectionMode = useComponentStore((s) => s.selectionMode);
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);
  const hoveredNodeId = useComponentStore((s) => s.hoveredNodeId);
  const history = activeComponent?.history ?? [];
  const historyIndex = activeComponent?.historyIndex ?? 0;
  const latestPreview = componentPreviewAst ?? history?.[historyIndex]?.preview ?? null;
  const chosenAst = selectionMode === 'select' ? latestPreview : componentAst;
  return (
    <div className="relative w-full h-full" data-canvas-overlay-container>
      <IframeCanvas />
      {(selectedNodeId || hoveredNodeId) && <SelectionHighlighter ast={chosenAst} />}
    </div>
  );
};

/**
 * Visual highlighter for selected elements in the canvas.
 * Draws blue outline around selected components for user feedback.
 */
const SelectionHighlighter = ({ ast }: { ast: SerializableElement | null }) => {
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);
  const hoveredNodeId = useComponentStore((s) => s.hoveredNodeId);

  const [selectedEl, setSelectedEl] = React.useState<HTMLElement | null>(null);
  const [hoveredEl, setHoveredEl] = React.useState<HTMLElement | null>(null);

  // lookup selected element
  React.useEffect(() => {
    const t = setTimeout(() => {
      const iframe = document.querySelector('iframe[title="Component Canvas"]') as HTMLIFrameElement | null;
      if (selectedNodeId && iframe && iframe.contentDocument) {
        const el = iframe.contentDocument.querySelector(`[data-node-id="${selectedNodeId}"]`) as HTMLElement | null;
        setSelectedEl(el);
      } else {
        setSelectedEl(null);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [selectedNodeId, ast]);

  // lookup hovered element (transient)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const iframe = document.querySelector('iframe[title="Component Canvas"]') as HTMLIFrameElement | null;
      if (hoveredNodeId && iframe && iframe.contentDocument) {
        const el = iframe.contentDocument.querySelector(`[data-node-id="${hoveredNodeId}"]`) as HTMLElement | null;
        setHoveredEl(el);
      } else {
        setHoveredEl(null);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [hoveredNodeId, ast]);

  const iframeEl = document.querySelector('iframe[title="Component Canvas"]') as HTMLIFrameElement | null;
  const iframeRect = iframeEl?.getBoundingClientRect();
  const container = document.querySelector('[data-canvas-overlay-container]') as HTMLElement | null;
  const containerRect = container?.getBoundingClientRect();

  if (!iframeRect || !containerRect) return null;

  const makeStyle = (rect: DOMRect, zIndex: number, dashed: boolean): React.CSSProperties => ({
    position: 'absolute',
    left: `${iframeRect.left + rect.left - containerRect.left}px`,
    top: `${iframeRect.top + rect.top - containerRect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: dashed ? '2px dashed hsla(210, 100%, 50%, 0.9)' : '2px solid hsl(var(--primary))',
    pointerEvents: 'none',
    zIndex,
  });

  return (
    <>
      {selectedEl && (() => {
        const rect = selectedEl.getBoundingClientRect();
        const style = makeStyle(rect, 90, false);
        return <div key={`sel-${selectedNodeId}`} style={style} />;
      })()}
      {hoveredEl && hoveredNodeId !== selectedNodeId && (() => {
        const rect = hoveredEl.getBoundingClientRect();
        const style = makeStyle(rect, 100, true);
        return <div key={`hov-${hoveredNodeId}`} style={style} />;
      })()}
    </>
  );
};