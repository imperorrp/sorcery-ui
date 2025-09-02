import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/useDebounce';

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

  // Local state for debounced inputs
  const [fontSize, setFontSize] = React.useState<number>(16);
  const [color, setColor] = React.useState<string>('#000000');
  const [backgroundColor, setBackgroundColor] = React.useState<string>('#ffffff');

  // Update local state when selectedNode changes
  React.useEffect(() => {
    if (selectedNode) {
      setFontSize(parseInt(String(selectedNode.props.style?.fontSize || '16')));
      setColor(String(selectedNode.props.style?.color || '#000000'));
      setBackgroundColor(String(selectedNode.props.style?.backgroundColor || '#ffffff'));
    }
  }, [selectedNode]);

  // Debounced update functions
  const debouncedUpdateFontSize = useDebounce(fontSize, 300);
  const debouncedUpdateColor = useDebounce(color, 300);
  const debouncedUpdateBackgroundColor = useDebounce(backgroundColor, 300);

  // Apply debounced changes to the store
  React.useEffect(() => {
    if (selectedNodeId && debouncedUpdateFontSize !== parseInt(String(selectedNode?.props.style?.fontSize || '16'))) {
      updateNodeStyle(selectedNodeId, { fontSize: `${debouncedUpdateFontSize}px` });
    }
  }, [debouncedUpdateFontSize, selectedNodeId, selectedNode?.props.style?.fontSize, updateNodeStyle]);

  React.useEffect(() => {
    if (selectedNodeId && debouncedUpdateColor !== String(selectedNode?.props.style?.color || '#000000')) {
      updateNodeStyle(selectedNodeId, { color: debouncedUpdateColor });
    }
  }, [debouncedUpdateColor, selectedNodeId, selectedNode?.props.style?.color, updateNodeStyle]);

  React.useEffect(() => {
    if (selectedNodeId && debouncedUpdateBackgroundColor !== String(selectedNode?.props.style?.backgroundColor || '#ffffff')) {
      updateNodeStyle(selectedNodeId, { backgroundColor: debouncedUpdateBackgroundColor });
    }
  }, [debouncedUpdateBackgroundColor, selectedNodeId, selectedNode?.props.style?.backgroundColor, updateNodeStyle]);

  if (!selectedNode) {
    return <p className="text-sm text-gray-500 text-center py-4">Select an element to inspect its styles.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Selected: &lt;{typeof selectedNode.type === 'string' ? selectedNode.type : 'Component'}&gt;</p>
      <div>
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="backgroundColor">Background</Label>
        <Input
          id="backgroundColor"
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="fontSize">Font Size (px)</Label>
        <Input
          id="fontSize"
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
        />
      </div>
    </div>
  );
};
