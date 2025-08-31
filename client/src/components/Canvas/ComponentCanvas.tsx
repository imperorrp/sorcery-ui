import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { IframeCanvas } from './IframeCanvas';

export const ComponentCanvas = () => {
  const { componentAst, componentPreviewAst, selectionMode, selectedNodeId } = useComponentStore();
  const chosenAst = selectionMode === 'select' ? componentPreviewAst : componentAst;
  return (
    <div className="relative w-full h-full" data-canvas-overlay-container>
      <IframeCanvas />
      {selectedNodeId && <SelectionHighlighter ast={chosenAst} />}
    </div>
  );
};

// A helper component to draw the selection outline
const SelectionHighlighter = ({ ast }: { ast: SerializableElement | null }) => {
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);

  // Use a ref to get the actual DOM element corresponding to the selected node ID
  const [element, setElement] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      const iframe = document.querySelector('iframe[title="Component Canvas"]') as HTMLIFrameElement | null;
      if (selectedNodeId && iframe && iframe.contentDocument) {
        const el = iframe.contentDocument.querySelector(`[data-node-id="${selectedNodeId}"]`) as HTMLElement | null;
        setElement(el);
      } else {
        setElement(null);
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [selectedNodeId, ast]);

  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const iframeEl = document.querySelector('iframe[title="Component Canvas"]') as HTMLIFrameElement | null;
  const iframeRect = iframeEl?.getBoundingClientRect();
  const container = document.querySelector('[data-canvas-overlay-container]') as HTMLElement | null;
  const containerRect = container?.getBoundingClientRect();

  if (!iframeRect || !containerRect) return null;

  // Calculate position relative to the canvas
  const style: React.CSSProperties = {
    position: 'absolute',
  left: `${iframeRect.left + rect.left - containerRect.left}px`,
  top: `${iframeRect.top + rect.top - containerRect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: '2px solid #3b82f6', // A nice blue outline
    pointerEvents: 'none', // Make sure it doesn't interfere with clicks
    zIndex: 100,
  };

  return <div style={style} />;
};