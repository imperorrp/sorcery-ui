import React from 'react';
import { create } from 'zustand';

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
interface HistorySnapshot {
  ast: SerializableElement | null;
  preview: SerializableElement | null;
}
interface ComponentState {
  componentAst: SerializableElement | null;
  componentPreviewAst: SerializableElement | null;
  selectedNodeId: string | null;
  history: HistorySnapshot[];
  historyIndex: number;
  propsJson: string;
  selectionMode: 'interact' | 'select';
  dependencies: string[]; // Add this
  wrapperCode: string;   // Add this
}

// Define the actions that can be performed on the state
interface ComponentActions {
  setAst: (ast: SerializableElement | null) => void;
  setAstWithPreview: (ast: SerializableElement | null, preview: SerializableElement | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  updateNodeStyle: (nodeId: string, newStyle: React.CSSProperties) => void;
  undo: () => void;
  redo: () => void;
  setPropsJson: (json: string) => void;
  setSelectionMode: (mode: 'interact' | 'select') => void;
  addDependency: (url: string) => void;     // Add this
  removeDependency: (url: string) => void; // Add this
  setDependencies: (urls: string[]) => void; // Add this
  setWrapperCode: (code: string) => void;  // Add this
}

// Helper function to recursively find and update a node in the AST
// This is a pure function that returns a new AST
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

const initialWrapperCode = `// Wrap your component here
// e.g., <MyTheme><{children} /></MyTheme>
// Use {children} as a placeholder.

function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;
`;

export const useComponentStore = create<ComponentState & ComponentActions>((set, get) => ({
  // Initial State
  componentAst: null,
  componentPreviewAst: null,
  selectedNodeId: null,
  history: [{ ast: null, preview: null }],
  historyIndex: 0,
  propsJson: '{}',
  selectionMode: 'interact',
  dependencies: [],
  wrapperCode: initialWrapperCode,

  // Actions
  setAst: (ast) =>
    set({
      componentAst: ast,
      componentPreviewAst: null,
      selectedNodeId: null, // Reset selection on new component
  history: [{ ast: ast, preview: null }],
      historyIndex: 0,
    }),

  setAstWithPreview: (ast, preview) => {
    console.log('setAstWithPreview called with ast:', ast, 'preview:', preview);
    set({
      componentAst: ast,
      componentPreviewAst: preview,
      selectedNodeId: null,
      history: [{ ast, preview }],
      historyIndex: 0,
    });
  },  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  updateNodeStyle: (nodeId, newStyle) => {
    const { componentAst, componentPreviewAst, history, historyIndex } = get();

    const updateFn = (node: SerializableElement) => ({
      ...node,
      props: {
        ...node.props,
        style: { ...node.props.style, ...newStyle },
      },
    });

    let newComponentAst = componentAst;
    if (componentAst) {
      newComponentAst = findAndCloneUpdateNode(componentAst, nodeId, updateFn);
    }

    let newComponentPreviewAst = componentPreviewAst;
    if (componentPreviewAst) {
      newComponentPreviewAst = findAndCloneUpdateNode(
        componentPreviewAst,
        nodeId,
        updateFn
      );
    }

  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push({ ast: newComponentAst, preview: newComponentPreviewAst });

    set({
      componentAst: newComponentAst,
      componentPreviewAst: newComponentPreviewAst,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      set({
        historyIndex: newIndex,
        componentAst: entry.ast,
        componentPreviewAst: entry.preview,
        selectedNodeId: null,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      set({
        historyIndex: newIndex,
        componentAst: entry.ast,
        componentPreviewAst: entry.preview,
        selectedNodeId: null,
      });
    }
  },

  setPropsJson: (json: string) => set({ propsJson: json }),
  setSelectionMode: (mode) => set({ selectionMode: mode }),
  addDependency: (url) => set((state) => ({ dependencies: [...state.dependencies, url] })),
  removeDependency: (url) => set((state) => ({ dependencies: state.dependencies.filter(d => d !== url) })),
  setDependencies: (urls) => set({ dependencies: urls }),
  setWrapperCode: (code) => set({ wrapperCode: code }),
}));