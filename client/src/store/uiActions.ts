/**
 * UI Actions Module
 * 
 * This module contains all actions related to UI state management:
 * - Selection and hover state
 * - Canvas interaction modes
 * - Dirty flags and code highlighting
 * - Component metadata detection (Phase 9)
 */

import type { StateCreator } from 'zustand';
import type { StoreType, SerializableElement, ComponentSchema, ComponentData } from './types';
import { detectAndExtractSchema } from '@/lib/componentDetector';

/**
 * Create UI actions slice
 * 
 * These actions manage the visual state of the editor UI.
 * They don't modify component data, just the UI's current state.
 */
export const createUIActions: StateCreator<
  StoreType,
  [],
  [],
  Pick<
    StoreType,
    | 'setSelectedNodeId'
    | 'setHoveredNodeId'
    | 'setSelectionMode'
    | 'setDirty'
    | 'clearCodeHighlight'
  >
> = (set, get) => ({
  
  /**
   * Set the currently selected node ID
   * 
   * When a user clicks an element in the canvas, this tracks which node is selected
   * so the Inspector can show the appropriate controls.
   * 
   * Phase 9 enhancement: Also detects if the selected element is a shadcn-like
   * component and extracts its variant schema for the VariantEditor.
   * 
   * @param nodeId - The ID of the selected node, or null to clear selection
   */
  setSelectedNodeId: (nodeId) => {
    set({ selectedNodeId: nodeId });
    console.log('[UI] Selected node:', nodeId || 'none');
    
    // Clear metadata if no node selected
    if (!nodeId) {
      set({ selectedComponentMetadata: null });
      return;
    }
    
    // Phase 9: Detect component metadata on selection
    const { getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();
    
    if (!project || !component) {
      set({ selectedComponentMetadata: null });
      return;
    }
    
    // Find the selected node in the preview AST
    const findNode = (node: SerializableElement | null): SerializableElement | null => {
      if (!node) return null;
      if (node.id === nodeId) return node;
      
      const children = node.props.children || [];
      for (const child of children) {
        if (typeof child !== 'string') {
          const found = findNode(child);
          if (found) return found;
        }
      }
      return null;
    };
    
    const selectedNode = findNode(component.componentPreviewAst);
    if (!selectedNode) {
      set({ selectedComponentMetadata: null });
      return;
    }
    
    // Check if node already has metadata (cached from previous detection)
    if (selectedNode.componentMetadata) {
      set({ selectedComponentMetadata: selectedNode.componentMetadata });
      console.log('[Phase 9] Using cached component metadata:', selectedNode.componentMetadata.name);
      return;
    }
    
    // Determine component name and whether it's a React component
    const componentType = typeof selectedNode.type === 'string' ? selectedNode.type : selectedNode.type.name || 'Unknown';
    
    // Only attempt detection for React components (not native HTML elements)
    // Native elements are lowercase (div, span, button), React components are uppercase (Button, Card)
    const isNativeElement = typeof selectedNode.type === 'string' && /^[a-z]/.test(selectedNode.type);
    if (isNativeElement) {
      set({ selectedComponentMetadata: null });
      return;
    }
    
    console.log('[Phase 9] Attempting schema detection for:', componentType);
    
    // Try to find the component's source code in the project
    let componentSourceCode = '';
    let componentName = componentType;
    
    // Check if this component is defined in one of the project's components
    const projectComponent = Object.values(project.components).find(
      (c): c is ComponentData => (c as ComponentData).name === componentType
    );
    if (projectComponent) {
      componentSourceCode = projectComponent.code;
      componentName = projectComponent.name;
      console.log('[Phase 9] Found component in project:', componentName);
    } else {
      // Component not found in project - might be a library component
      // For now, we can't extract schema without source code
      console.log('[Phase 9] Component not found in project, cannot extract schema');
      set({ selectedComponentMetadata: null });
      return;
    }
    
    // Attempt async schema detection
    detectAndExtractSchema(componentSourceCode, componentName)
      .then((schema: ComponentSchema | null) => {
        if (schema) {
          console.log('[Phase 9] Detected component schema:', schema);
          set({ selectedComponentMetadata: schema });
        } else {
          console.log('[Phase 9] No schema detected for:', componentName);
          set({ selectedComponentMetadata: null });
        }
      })
      .catch((error: unknown) => {
        console.error('[Phase 9] Schema detection failed:', error);
        set({ selectedComponentMetadata: null });
      });
  },

  /**
   * Set the currently hovered node ID
   * 
   * Tracks which element the user is hovering over for visual feedback.
   * This is transient state that doesn't persist.
   * 
   * @param nodeId - The ID of the hovered node, or null to clear hover
   */
  setHoveredNodeId: (nodeId) => {
    set({ hoveredNodeId: nodeId });
    // Don't log hover changes - too noisy
  },

  /**
   * Set the canvas interaction mode
   * 
   * - 'interact': Users can interact with the component (click buttons, etc.)
   * - 'select': Users can select elements for editing
   * 
   * @param mode - The interaction mode
   */
  setSelectionMode: (mode) => {
    set({ selectionMode: mode });
    console.log('[UI] Selection mode:', mode);
  },

  /**
   * Set the dirty flag
   * 
   * Indicates whether the active component has unsaved changes.
   * When true, the "Apply Changes" button is enabled.
   * 
   * @param dirty - Whether there are unsaved changes
   */
  setDirty: (dirty: boolean) => {
    set({ isDirty: dirty });
    if (dirty) {
      console.log('[UI] Component marked as dirty (has unsaved changes)');
    }
  },

  /**
   * Clear the code highlight flag
   * 
   * After changes are applied to the code, the JSX block is highlighted.
   * This action clears that highlight.
   */
  clearCodeHighlight: () => {
    set({ isCodeHighlighted: false });
    console.log('[UI] Cleared code highlight');
  },
});
