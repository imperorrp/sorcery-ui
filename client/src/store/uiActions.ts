/**
 * UI Actions Module
 * 
 * This module contains all actions related to UI state management:
 * - Selection and hover state
 * - Canvas interaction modes
 * - Dirty flags and code highlighting
 */

import type { StateCreator } from 'zustand';
import type { StoreType } from './types';

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
> = (set) => ({
  
  /**
   * Set the currently selected node ID
   * 
   * When a user clicks an element in the canvas, this tracks which node is selected
   * so the Inspector can show the appropriate controls.
   * 
   * @param nodeId - The ID of the selected node, or null to clear selection
   */
  setSelectedNodeId: (nodeId) => {
    set({ selectedNodeId: nodeId });
    console.log('[UI] Selected node:', nodeId || 'none');
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
