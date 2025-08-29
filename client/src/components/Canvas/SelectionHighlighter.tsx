import React from 'react';
import type { SerializableElement } from '@/store/componentStore';

interface SelectionHighlighterProps {
  ast: SerializableElement;
}

export const SelectionHighlighter: React.FC<SelectionHighlighterProps> = ({ ast }) => {
  // This component will render a visual overlay to highlight the selected element
  // For now, we'll implement a basic version that shows a border around the selected element

  const renderHighlight = (element: SerializableElement, depth = 0): React.ReactElement | null => {
    if (!element) return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      border: '2px solid #3b82f6',
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: 1000 + depth,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
    };

    return (
      <div key={`highlight-${element.id}`} style={style}>
        {element.props.children?.map((child: SerializableElement | string) => {
          if (typeof child === 'string') return null;
          return renderHighlight(child, depth + 1);
        })}
      </div>
    );
  };

  return renderHighlight(ast);
};
