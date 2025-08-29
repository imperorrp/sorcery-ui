import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SerializableElement } from '@/store/componentStore';
import { useTheme } from '@/contexts/ThemeContext';

export const InspectorPanel: React.FC = () => {
  const { componentAst, selectedNodeId, updateNodeStyle } = useComponentStore();
  const { theme } = useTheme();

  // Find the selected node in the AST
  const findSelectedNode = (node: SerializableElement | null): SerializableElement | null => {
    if (!node) return null;
    if (node.id === selectedNodeId) return node;

    if (node.props?.children) {
      for (const child of node.props.children) {
        if (typeof child !== 'string') {
          const found = findSelectedNode(child);
          if (found) return found;
        }
      }
    }
    return null;
  };

  const selectedNode = selectedNodeId ? findSelectedNode(componentAst) : null;

  const handleStyleChange = (property: string, value: string) => {
    if (!selectedNodeId) return;

    const numValue = parseFloat(value);
    const styleUpdate: React.CSSProperties = {};

    switch (property) {
      case 'width':
        styleUpdate.width = isNaN(numValue) ? value : `${numValue}px`;
        break;
      case 'height':
        styleUpdate.height = isNaN(numValue) ? value : `${numValue}px`;
        break;
      case 'backgroundColor':
        styleUpdate.backgroundColor = value;
        break;
      case 'color':
        styleUpdate.color = value;
        break;
      case 'fontSize':
        styleUpdate.fontSize = isNaN(numValue) ? value : `${numValue}px`;
        break;
      case 'padding':
        styleUpdate.padding = isNaN(numValue) ? value : `${numValue}px`;
        break;
      case 'margin':
        styleUpdate.margin = isNaN(numValue) ? value : `${numValue}px`;
        break;
      case 'borderRadius':
        styleUpdate.borderRadius = isNaN(numValue) ? value : `${numValue}px`;
        break;
    }

    updateNodeStyle(selectedNodeId, styleUpdate);
  };

  if (!selectedNode) {
    return (
      <div className={`w-80 h-full p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Inspector</h3>
        <p className={`text-gray-500 ${theme === 'dark' ? 'text-gray-400' : ''}`}>Select an element to inspect its properties</p>
      </div>
    );
  }

  return (
    <div className={`w-80 h-full p-4 overflow-y-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Inspector</h3>

      {/* Element Info */}
      <div className="mb-6">
        <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Element</h4>
        <div className={`bg-white p-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
          <p className={theme === 'dark' ? 'text-gray-100' : ''}><strong className={theme === 'dark' ? 'text-gray-300' : ''}>Type:</strong> {selectedNode.type}</p>
          <p className={theme === 'dark' ? 'text-gray-100' : ''}><strong className={theme === 'dark' ? 'text-gray-300' : ''}>ID:</strong> {selectedNode.id}</p>
        </div>
      </div>

      {/* Style Controls */}
      <div className="mb-6">
        <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Style</h4>
        <div className="space-y-3">
          <div>
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              placeholder="auto"
              defaultValue={selectedNode.props?.style?.width || ''}
              onChange={(e) => handleStyleChange('width', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              placeholder="auto"
              defaultValue={selectedNode.props?.style?.height || ''}
              onChange={(e) => handleStyleChange('height', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="backgroundColor">Background Color</Label>
            <Input
              id="backgroundColor"
              placeholder="#ffffff"
              defaultValue={selectedNode.props?.style?.backgroundColor || ''}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="color">Text Color</Label>
            <Input
              id="color"
              placeholder="#000000"
              defaultValue={selectedNode.props?.style?.color || ''}
              onChange={(e) => handleStyleChange('color', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="fontSize">Font Size</Label>
            <Input
              id="fontSize"
              placeholder="16px"
              defaultValue={selectedNode.props?.style?.fontSize || ''}
              onChange={(e) => handleStyleChange('fontSize', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="padding">Padding</Label>
            <Input
              id="padding"
              placeholder="0px"
              defaultValue={selectedNode.props?.style?.padding || ''}
              onChange={(e) => handleStyleChange('padding', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="margin">Margin</Label>
            <Input
              id="margin"
              placeholder="0px"
              defaultValue={selectedNode.props?.style?.margin || ''}
              onChange={(e) => handleStyleChange('margin', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="borderRadius">Border Radius</Label>
            <Input
              id="borderRadius"
              placeholder="0px"
              defaultValue={selectedNode.props?.style?.borderRadius || ''}
              onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Props Section (for future expansion) */}
      <div className="mb-6">
        <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Properties</h4>
        <div className={`bg-white p-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
          <p className={`text-gray-500 text-sm ${theme === 'dark' ? 'text-gray-400' : ''}`}>Additional properties will be shown here</p>
        </div>
      </div>
    </div>
  );
};
