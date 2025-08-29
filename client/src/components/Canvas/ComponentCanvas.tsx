import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { renderFromAst } from '@/lib/componentParser';

export const ComponentCanvas = () => {
  const { componentAst, selectedNodeId, setSelectedNodeId } = useComponentStore();

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const renderedComponent = componentAst ? renderFromAst(componentAst, handleSelectNode) : null;

  // We add a key to the root div to force a re-mount when the AST changes fundamentally.
  // This helps clear old state and prevents stale closures in event handlers.
  const astKey = componentAst ? JSON.stringify(componentAst).length : 0;

  return (
    <div key={astKey} className="relative w-full h-full p-4 overflow-auto">
      {renderedComponent}
      {selectedNodeId && <SelectionHighlighter ast={componentAst} />}
    </div>
  );
};

// A helper component to draw the selection outline
const SelectionHighlighter = ({ ast }: { ast: SerializableElement | null }) => {
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);

  // Use a ref to get the actual DOM element corresponding to the selected node ID
  const [element, setElement] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    if (selectedNodeId) {
      const el = document.querySelector(`[data-node-id="${selectedNodeId}"]`) as HTMLElement;
      setElement(el);
    } else {
      setElement(null);
    }
  }, [selectedNodeId, ast]); // Re-run when selection or the whole tree changes

  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const canvasRect = element.parentElement?.getBoundingClientRect();

  if (!canvasRect) return null;

  // Calculate position relative to the canvas
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${rect.left - canvasRect.left}px`,
    top: `${rect.top - canvasRect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: '2px solid #3b82f6', // A nice blue outline
    pointerEvents: 'none', // Make sure it doesn't interfere with clicks
    zIndex: 100,
  };

  return <div style={style} />;
};