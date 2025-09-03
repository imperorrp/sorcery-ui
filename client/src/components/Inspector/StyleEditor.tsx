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
    <div className="space-y-6">
      <p className="text-sm text-gray-400">Selected: &lt;{typeof selectedNode.type === 'string' ? selectedNode.type : 'Component'}&gt;</p>

      {/* Color and Background Color in a compact grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="color" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Text Color
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="color"
              type="color"
              value={currentColor}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              className="w-12 h-8 p-1 border rounded cursor-pointer"
            />
            <Input
              type="text"
              value={currentColor}
              onChange={(e) => handleStyleChange('color', e.target.value)}
              className="flex-1 text-xs font-mono"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="backgroundColor" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Background
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="backgroundColor"
              type="color"
              value={currentBgColor}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="w-12 h-8 p-1 border rounded cursor-pointer"
            />
            <Input
              type="text"
              value={currentBgColor}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="flex-1 text-xs font-mono"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>

      {/* Font Size with a more compact layout */}
      <div>
        <Label htmlFor="fontSize" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Font Size
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="fontSize"
            type="number"
            value={currentFontSize}
            onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
            className="w-20 text-sm"
            min="8"
            max="72"
          />
          <span className="text-xs text-gray-500">px</span>
          <div className="flex-1 text-xs text-gray-400">
            Current: {currentFontSize}px
          </div>
        </div>
      </div>

      {/* Additional styling controls can be added here */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 mb-3">
          💡 Tip: Select elements in the canvas to style them individually, or use the component props for dynamic styling.
        </p>
      </div>
    </div>
  );
};
