/**
 * ComponentCanvas - Live Component Rendering with Selection Highlighting
 *
 * Main canvas component that renders components in an iframe environment with interactive
 * element selection capabilities. Provides visual feedback through selection highlighting
 * and manages the display of rendered components with hover and selection states.
 */
import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { IframeCanvas } from './IframeCanvas';

/**
 * ComponentCanvas - Main canvas component orchestrating rendering and selection
 *
 * Handles iframe-based component rendering, selection highlighting, and state management.
 * Coordinates between the iframe canvas and overlay selection indicators.
 */
export const ComponentCanvas = () => {
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
 * SelectionHighlighter - Visual overlay for selected and hovered elements
 *
 * Renders highlight borders around selected and hovered DOM elements within the iframe canvas.
 * Provides visual feedback for user interactions with solid borders for selections and
 * dashed borders for hover states. Calculates positioning relative to iframe and container.
 */
const SelectionHighlighter = ({ ast }: { ast: SerializableElement | null }) => {
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);
  const hoveredNodeId = useComponentStore((s) => s.hoveredNodeId);

  const [selectedEl, setSelectedEl] = React.useState<HTMLElement | null>(null);
  const [hoveredEl, setHoveredEl] = React.useState<HTMLElement | null>(null);

  // Lookup selected element in iframe document
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

  // Lookup hovered element in iframe document (transient highlighting)
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

  /**
   * Create highlight style for element positioning and visual appearance
   * Positions highlight relative to iframe within container and applies appropriate border styling
   */
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