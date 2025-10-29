/**
 * AST Manipulation Actions Module
 * 
 * This module contains all actions related to modifying the component's AST:
 * - Setting and updating ASTs
 * - Modifying node styles and classNames
 * - Managing utility class state
 * - Undo/redo functionality
 */

import React from 'react';
import type { StateCreator } from 'zustand';
import type { StoreType, SerializableElement } from './types';
import { generateClassNameFromState } from '@/lib/utilityStateHelpers';

/**
 * Helper function to recursively find and update a node in the AST
 * 
 * This is a pure function that returns a new AST with the specified node updated.
 * It preserves immutability by creating new objects for the modified path.
 * 
 * @param node - Current node being examined
 * @param nodeId - ID of the node to update
 * @param updateFn - Function that transforms the target node
 * @returns New AST with the updated node
 */
const findAndCloneUpdateNode = (
  node: SerializableElement,
  nodeId: string,
  updateFn: (node: SerializableElement) => SerializableElement
): SerializableElement => {
  const newNode = node.id === nodeId ? updateFn(node) : { ...node };

  if (newNode.props.children) {
    newNode.props = {
      ...newNode.props,
      children: newNode.props.children.map((child) => {
        if (typeof child !== 'string') {
          return findAndCloneUpdateNode(child, nodeId, updateFn);
        }
        return child;
      }),
    };
  }
  return newNode;
};

/**
 * Create AST manipulation actions slice
 * 
 * All actions in this slice work with the active component's AST.
 * They maintain history for undo/redo and ensure immutability.
 */
export const createASTActions: StateCreator<
  StoreType,
  [],
  [],
  Pick<
    StoreType,
    | 'setAst'
    | 'setAstWithPreview'
    | 'updateNodeStyle'
    | 'updateNodeClassName'
    | 'updateUtilityClass'
    | 'undo'
    | 'redo'
  >
> = (set, get) => ({
  
  /**
   * Set the AST of the active component
   * 
   * This replaces the component's AST and resets the history.
   * Used primarily for initial rendering.
   * 
   * @param ast - The new AST to set
   */
  setAst: (ast) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();
    
    if (!project || !activeProjectId || !component) {
      console.warn('[AST] Cannot set AST: no active component');
      return;
    }

    const updatedComponent = {
      ...component,
      componentAst: ast,
      componentPreviewAst: null,
      history: [{ ast: ast, preview: null }],
      historyIndex: 0,
    };

    const updatedProject = {
      ...project,
      components: {
        ...project.components,
        [component.id]: updatedComponent,
      },
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
      selectedNodeId: null,
    });

    console.log('[AST] Set AST for component:', component.name);
  },

  /**
   * Set both runtime and preview ASTs of the active component
   * 
   * This is the primary method used after rendering. It sets both ASTs
   * and initializes the history stack.
   * 
   * @param ast - The runtime AST (created with real React)
   * @param preview - The preview AST (created with shimmed React)
   */
  setAstWithPreview: (ast, preview) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();
    
    if (!project || !activeProjectId || !component) {
      console.warn('[AST] Cannot set AST: no active component');
      return;
    }

    const updatedComponent = {
      ...component,
      componentAst: ast,
      componentPreviewAst: preview,
      history: [{ ast, preview }],
      historyIndex: 0,
    };

    const updatedProject = {
      ...project,
      components: {
        ...project.components,
        [component.id]: updatedComponent,
      },
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
      selectedNodeId: null,
    });

    console.log('[AST] Set AST with preview for component:', component.name);
  },

  /**
   * Update the inline style of a specific node in the active component's AST
   * 
   * This merges the new style properties with existing ones and adds the
   * change to the history stack for undo/redo.
   * 
   * @param nodeId - The ID of the node to update
   * @param newStyle - The new style properties to apply (merged with existing)
   */
  updateNodeStyle: (nodeId: string, newStyle: React.CSSProperties) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();

    if (!project || !activeProjectId || !component) {
      console.warn('[AST] Cannot update style: no active component');
      return;
    }

    const { componentAst, componentPreviewAst, history, historyIndex } = component;

    // Define the update function for style - merge with existing
    const updateFn = (node: SerializableElement): SerializableElement => {
      const prevStyle = (node.props?.style as React.CSSProperties) || {};
      return {
        ...node,
        props: {
          ...node.props,
          style: {
            ...prevStyle,
            ...newStyle,
          },
        },
      };
    };

    // Update both ASTs
    const newComponentAst = componentAst
      ? findAndCloneUpdateNode(componentAst, nodeId, updateFn)
      : null;
    const newComponentPreviewAst = componentPreviewAst
      ? findAndCloneUpdateNode(componentPreviewAst, nodeId, updateFn)
      : null;

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ast: newComponentAst, preview: newComponentPreviewAst });

    const updatedComponent = {
      ...component,
      componentAst: newComponentAst,
      componentPreviewAst: newComponentPreviewAst,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };

    const updatedProject = {
      ...project,
      components: {
        ...project.components,
        [component.id]: updatedComponent,
      },
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
      isDirty: true,
    });

    console.log('[AST] Updated node style:', nodeId);
  },

  /**
   * Update the className of a specific node in the active component's AST
   * 
   * This replaces the node's className and adds the change to history.
   * 
   * @param nodeId - The ID of the node to update
   * @param newClassName - The new className string to apply
   */
  updateNodeClassName: (nodeId: string, newClassName: string) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();

    if (!project || !activeProjectId || !component) {
      console.warn('[AST] Cannot update className: no active component');
      return;
    }

    const { componentAst, componentPreviewAst, history, historyIndex } = component;

    // Define the update function for className
    const updateFn = (node: SerializableElement): SerializableElement => ({
      ...node,
      props: {
        ...node.props,
        className: newClassName,
      },
    });

    // If previewAst is missing but runtime ast exists, use runtime as base
    const basePreviewAst = componentPreviewAst || componentAst;

    const newComponentAst = componentAst
      ? findAndCloneUpdateNode(componentAst, nodeId, updateFn)
      : null;
    const newComponentPreviewAst = basePreviewAst
      ? findAndCloneUpdateNode(basePreviewAst, nodeId, updateFn)
      : null;

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ast: newComponentAst, preview: newComponentPreviewAst });

    const updatedComponent = {
      ...component,
      componentAst: newComponentAst,
      componentPreviewAst: newComponentPreviewAst,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };

    const updatedProject = {
      ...project,
      components: {
        ...project.components,
        [component.id]: updatedComponent,
      },
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
      isDirty: true,
    });

    console.log('[AST] Updated node className:', nodeId);
  },

  /**
   * Update a utility class in the structured state for a specific node
   * 
   * This updates the node's utilityClassState and regenerates the className
   * from the structured state, preserving unmanaged classes.
   * 
   * @param nodeId - The ID of the node to update
   * @param category - The category of the utility class (e.g., 'borderColor')
   * @param newClass - The new class value or null to remove
   */
  updateUtilityClass: (nodeId: string, category: string, newClass: string | null) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();

    if (!project || !activeProjectId || !component) {
      console.warn('[AST] Cannot update utility class: no active component');
      return;
    }

    const { componentAst, componentPreviewAst, history, historyIndex } = component;

    // Define the update function for utility class state
    const updateFn = (node: SerializableElement): SerializableElement => {
      // Start from existing utility state and apply the change
      const prevUtilityState = node.utilityClassState || {};
      const newUtilityState: Record<string, string> = { ...prevUtilityState };
      if (newClass) {
        newUtilityState[category] = newClass;
      } else {
        delete newUtilityState[category]; // Remove if null/empty
      }

      // Preserve unmanaged classes: anything in className but not from previous utility state
      const prevUtilityValues = new Set(Object.values(prevUtilityState).filter(Boolean));
      const classNameString = (node.props?.className as string) || '';
      const currentTokens = classNameString.split(/\s+/).filter(Boolean);
      const unmanagedTokens = currentTokens.filter(t => !prevUtilityValues.has(t));

      // Generate the final className string from updated utility state + unmanaged tokens
      const newClassNameString = generateClassNameFromState(newUtilityState, unmanagedTokens);

      return {
        ...node,
        utilityClassState: newUtilityState,
        props: { ...node.props, className: newClassNameString },
      };
    };

    // If previewAst is missing but runtime ast exists, use runtime as base
    const basePreviewAst = componentPreviewAst || componentAst;

    const newComponentAst = componentAst
      ? findAndCloneUpdateNode(componentAst, nodeId, updateFn)
      : null;
    const newComponentPreviewAst = basePreviewAst
      ? findAndCloneUpdateNode(basePreviewAst, nodeId, updateFn)
      : null;

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ast: newComponentAst, preview: newComponentPreviewAst });

    const updatedComponent = {
      ...component,
      componentAst: newComponentAst,
      componentPreviewAst: newComponentPreviewAst,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };

    const updatedProject = {
      ...project,
      components: {
        ...project.components,
        [component.id]: updatedComponent,
      },
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
      isDirty: true,
    });

    console.log('[AST] Updated utility class:', nodeId, category, '→', newClass);
  },

  /**
   * Undo the last change to the active component's AST
   * 
   * Moves back one step in the history stack.
   */
  undo: () => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();

    if (!project || !activeProjectId || !component) {
      console.warn('[AST] Cannot undo: no active component');
      return;
    }

    const { history, historyIndex } = component;

    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];

      const updatedComponent = {
        ...component,
        historyIndex: newIndex,
        componentAst: entry.ast,
        componentPreviewAst: entry.preview,
      };

      const updatedProject = {
        ...project,
        components: {
          ...project.components,
          [component.id]: updatedComponent,
        },
        updatedAt: Date.now(),
      };

      set({
        projects: {
          ...projects,
          [activeProjectId]: updatedProject,
        },
        selectedNodeId: null, // Clear selection when time-traveling
        isDirty: true,
      });

      console.log('[AST] Undo to index:', newIndex);
    }
  },

  /**
   * Redo the next change to the active component's AST
   * 
   * Moves forward one step in the history stack.
   */
  redo: () => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();

    if (!project || !activeProjectId || !component) {
      console.warn('[AST] Cannot redo: no active component');
      return;
    }

    const { history, historyIndex } = component;

    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];

      const updatedComponent = {
        ...component,
        historyIndex: newIndex,
        componentAst: entry.ast,
        componentPreviewAst: entry.preview,
      };

      const updatedProject = {
        ...project,
        components: {
          ...project.components,
          [component.id]: updatedComponent,
        },
        updatedAt: Date.now(),
      };

      set({
        projects: {
          ...projects,
          [activeProjectId]: updatedProject,
        },
        selectedNodeId: null, // Clear selection when time-traveling
        isDirty: true,
      });

      console.log('[AST] Redo to index:', newIndex);
    }
  },
});
