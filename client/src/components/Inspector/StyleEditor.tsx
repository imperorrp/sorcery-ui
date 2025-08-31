import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const { selectedNodeId, componentAst, componentPreviewAst, selectionMode, updateNodeStyle } = useComponentStore();

  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId) return null;
    const ast = selectionMode === 'select' ? componentPreviewAst : componentAst;
    if (!ast) return null;
    return findNodeById(ast, selectedNodeId);
  }, [selectedNodeId, componentAst, componentPreviewAst, selectionMode]);

  const handleStyleChange = (prop: keyof React.CSSProperties, value: string) => {
    if (selectedNodeId) {
      updateNodeStyle(selectedNodeId, { [prop]: value });
    }
  };

  if (!selectedNode) {
    return <p className="text-sm text-gray-500 text-center py-4">Select an element to inspect its styles.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Selected: &lt;{typeof selectedNode.type === 'string' ? selectedNode.type : 'Component'}&gt;</p>
      <div>
        <Label htmlFor="color">Color</Label>
        <Input id="color" type="color" value={selectedNode.props.style?.color?.toString() || '#000000'} onChange={(e) => handleStyleChange('color', e.target.value)} />
      </div>
      <div>
        <Label htmlFor="backgroundColor">Background</Label>
        <Input id="backgroundColor" type="color" value={selectedNode.props.style?.backgroundColor?.toString() || '#ffffff'} onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} />
      </div>
      <div>
        <Label htmlFor="fontSize">Font Size (px)</Label>
        <Input id="fontSize" type="number" value={parseInt(String(selectedNode.props.style?.fontSize || '16'))} onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)} />
      </div>
    </div>
  );
};
