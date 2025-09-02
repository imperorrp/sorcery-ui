import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Helper: find a node by id in the serializable AST
const findNodeById = (node: SerializableElement, id: string): SerializableElement | null => {
  if (node.id === id) return node;
  if (node.props.children) {
    for (const child of node.props.children) {
      if (typeof child !== 'string') {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
  }
  return null;
};

export const StyleEditor: React.FC = () => {
  const { selectedNodeId, componentPreviewAst, updateNodeStyle } = useComponentStore();

  // Use the preview AST for editing to avoid side effects
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !componentPreviewAst) return null;
    return findNodeById(componentPreviewAst, selectedNodeId);
  }, [selectedNodeId, componentPreviewAst]);

  // Only call updateNodeStyle from explicit input onChange handlers
  const handleStyleChange = (prop: keyof React.CSSProperties, value: string) => {
    if (selectedNodeId) {
      updateNodeStyle(selectedNodeId, { [prop]: value });
    }
  };

  if (!selectedNode) {
    return <p className="text-sm text-gray-500 text-center py-4">Select an element to inspect its styles.</p>;
  }

  // Read current values directly from the selected node; no local state => no phantom updates
  const currentColor = selectedNode.props.style?.color?.toString() || '#000000';
  const currentBgColor = selectedNode.props.style?.backgroundColor?.toString() || '#ffffff';
  const currentFontSize = parseInt(String(selectedNode.props.style?.fontSize || '16'));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Selected: &lt;{typeof selectedNode.type === 'string' ? selectedNode.type : 'Component'}&gt;</p>
      <div>
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          type="color"
          value={currentColor}
          onChange={(e) => handleStyleChange('color', e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="backgroundColor">Background Color</Label>
        <Input
          id="backgroundColor"
          type="color"
          value={currentBgColor}
          onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="fontSize">Font Size (px)</Label>
        <Input
          id="fontSize"
          type="number"
          value={currentFontSize}
          onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
        />
      </div>
    </div>
  );
};
