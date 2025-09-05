import React from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Style Editor - Visual Style Modification Panel
 *
 * Provides an interface for modifying CSS properties of selected DOM elements
 * in the component canvas. Changes are applied to the preview AST and reflected
 * in real-time in the iframe canvas.
 */

/**
 * Recursively searches for a node by ID in the serializable AST tree
 * @param node - The root node to start searching from
 * @param id - The target node ID to find
 * @returns The found node or null if not found
 */
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

/**
 * StyleEditor Component - Main style editing interface
 *
 * Displays controls for modifying CSS properties of the currently selected element.
 * Supports color pickers, text inputs, and numeric inputs for various style properties.
 * Includes smart component boundary detection to prevent editing child components.
 */
export const StyleEditor: React.FC = () => {
  // Use active component selectors for proper data access
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);
  const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
  const updateNodeStyle = useComponentStore((s) => s.updateNodeStyle);

  // Debug log to see when selectedNodeId changes
  React.useEffect(() => {
    console.log('🔍 Inspector: selectedNodeId changed to:', selectedNodeId);
  }, [selectedNodeId]);

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

  // ▼▼▼ DISCLAIMER LOGIC FIX (v1.1) ▼▼▼
  // A component is a "child" if its type is not a string AND its ID is not the same as the root component's ID.
  // This prevents the disclaimer from showing for the root component itself.
  // Previously, the logic incorrectly showed disclaimers for root components.
  const isChildComponent =
    typeof selectedNode.type !== 'string' &&
    selectedNode.id !== componentPreviewAst?.id;
  // ▲▲▲ END OF DISCLAIMER LOGIC FIX ▲▲▲

  // Read current values directly from the selected node; no local state => no phantom updates
  const currentColor = selectedNode.props.style?.color?.toString() || '#000000';
  const currentBgColor = selectedNode.props.style?.backgroundColor?.toString() || '#ffffff';
  const currentFontSize = parseInt(String(selectedNode.props.style?.fontSize || '16'));

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">Selected: &lt;{typeof selectedNode.type === 'string' ? selectedNode.type : 'Component'}&gt;</p>

      {/* Smart Selection Disclaimer for Library Components */}
      {isChildComponent && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-md border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400">💡</span>
            <div>
              <p className="font-medium mb-1">Component Boundary</p>
              <p>This is a child component. To edit its internal styles, please select it from the Component Library.</p>
            </div>
          </div>
        </div>
      )}

      {/* Only show style controls for DOM elements, not library components */}
      {!isChildComponent && (
        <>
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
        </>
      )}
    </div>
  );
};
