import React from 'react';
import { create } from 'zustand';
import { produce } from 'immer';

// Define the structure of our serializable element AST
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SerializableElement {
  id: string;
  // type can be a native element string (e.g. 'div') or a React component (function/class)
  type: string | React.ComponentType<any>;
  props: {
    [key: string]: any;
    children?: (SerializableElement | string)[];
    style?: React.CSSProperties;
  };
}

// Define the state of our application
interface ComponentState {
  componentAst: SerializableElement | null;
  selectedNodeId: string | null;
  history: (SerializableElement | null)[];
  historyIndex: number;
}

// Define the actions that can be performed on the state
interface ComponentActions {
  setAst: (ast: SerializableElement | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  updateNodeStyle: (nodeId: string, style: React.CSSProperties) => void;
  undo: () => void;
  redo: () => void;
}

// Helper function to recursively find and update a node in the AST
const findAndUpdateNode = (
  node: SerializableElement,
  nodeId: string,
  style: React.CSSProperties
): SerializableElement => {
  if (node.id === nodeId) {
    node.props.style = { ...node.props.style, ...style };
    return node;
  }
  if (node.props.children) {
    node.props.children = node.props.children.map((child) => {
      if (typeof child !== 'string') {
        return findAndUpdateNode(child, nodeId, style);
      }
      return child;
    });
  }
  return node;
};

export const useComponentStore = create<ComponentState & ComponentActions>((set) => ({
  // Initial State
  componentAst: null,
  selectedNodeId: null,
  history: [null],
  historyIndex: 0,

  // Actions
  setAst: (ast) =>
    set({
      componentAst: ast,
      selectedNodeId: null, // Reset selection on new component
      history: [ast],
      historyIndex: 0,
    }),

  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  updateNodeStyle: (nodeId, style) =>
    set(
      produce((draft: ComponentState) => {
        if (draft.componentAst) {
          const newAst = findAndUpdateNode(draft.componentAst, nodeId, style);

          // Manage history
          const newHistory = draft.history.slice(0, draft.historyIndex + 1);
          newHistory.push(newAst);

          draft.componentAst = newAst;
          draft.history = newHistory;
          draft.historyIndex = newHistory.length - 1;
        }
      })
    ),

  undo: () =>
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          historyIndex: newIndex,
          componentAst: state.history[newIndex],
          selectedNodeId: null, // Deselect on undo/redo
        };
      }
      return {};
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          historyIndex: newIndex,
          componentAst: state.history[newIndex],
          selectedNodeId: null,
        };
      }
      return {};
    }),
}));