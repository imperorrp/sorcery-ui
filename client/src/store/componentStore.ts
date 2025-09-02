import React from 'react';
import { create } from 'zustand';
// Use the new surgical style updater that preserves component logic
import { updateStylesInCode } from '@/lib/styleUpdater';

/**
 * Component Store - Central State Management for Component Editing
 *
 * This Zustand store manages the application's state for interactive component editing.
 * It maintains multiple representations of the component to enable different editing modes:
 *
 * Key State Properties:
 * - componentAst: The runtime AST created with real React, used for live interaction in the iframe
 * - componentPreviewAst: The preview AST created with shimmed React, used for safe style editing and navigation
 * - originalCode: The source-of-truth code string from the Monaco editor, preserved for surgical updates
 * - isDirty: Flag indicating whether the AST has changes that haven't been applied back to the code
 * - jsxLocation: Location of the main JSX block in the source code for highlighting
 * - selectedNodeId: Currently selected element in the component tree for editing
 * - history: Undo/redo stack of AST states for non-destructive editing
 */

// Define the structure of our serializable element AST
export interface SerializableElement {
  id: string;
  // type can be a native element string (e.g. 'div') or a React component (function/class)
  type: string | React.ComponentType<unknown>;
  props: {
    [key: string]: unknown; // Use `unknown` instead of `any` to force type checks
    children?: (SerializableElement | string)[];
    style?: React.CSSProperties;
  };
}

// Location of the returned JSX within source code
export type JsxLocation = { start: number; end: number };

// Map of element IDs to their locations in source code
export type ElementLocationMap = Map<string, {
  start: number;
  end: number;
  style?: { start: number; end: number };
}>;

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
  // Source-of-truth code tracking
  originalCode: string | null;
  jsxLocation: JsxLocation | null;
  isDirty: boolean;
  isCodeHighlighted: boolean; // Add this for persistent highlighting
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
  /**
   * Sets the render output after transpiling and executing component code.
   *
   * This is called after renderCodeToAst successfully processes the code.
   * It updates the source-of-truth code, both ASTs, and resets the dirty flag.
   * Also initializes the history stack with the new state.
   *
   * @param code The original source code string
   * @param runtimeAst The interactive AST created with real React
   * @param previewAst The safe AST created with shimmed React
   * @param jsxLocation Location of the main JSX block for highlighting
   */
  setRenderOutput: (
    code: string,
    runtimeAst: SerializableElement | null,
    previewAst: SerializableElement | null,
    jsxLocation: JsxLocation | null
  ) => void;
  /**
   * Applies accumulated AST changes back to the original source code.
   *
   * This function uses the new AST-to-code generation approach to create clean,
   * formatted JSX from the preview AST and replaces the JSX block in the original code.
   *
   * @returns A promise that resolves to the updated code string, or null if update fails
   */
  applyAstChangesToCode: () => Promise<string | null>;
  setDirty: (dirty: boolean) => void;
  clearCodeHighlight: () => void; // Add this for clearing persistent highlighting
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
  originalCode: null,
  jsxLocation: null,
  isDirty: false,
  isCodeHighlighted: false, // Add initial value for persistent highlighting

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
      isDirty: true,
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
  setRenderOutput: (code, runtimeAst, previewAst, jsxLocation) => set((state) => {
    const newHistory = [{ ast: runtimeAst, preview: previewAst }];
    return {
      originalCode: code,
      jsxLocation,
      isDirty: false,
      isCodeHighlighted: false, // Clear highlight when rendering new code
      componentAst: runtimeAst,
      componentPreviewAst: previewAst,
      selectedNodeId: null,
      history: newHistory,
      historyIndex: 0,
      dependencies: state.dependencies,
      wrapperCode: state.wrapperCode,
    };
  }),
  setDirty: (dirty: boolean) => set({ isDirty: dirty }),
  clearCodeHighlight: () => set({ isCodeHighlighted: false }), // Add clearCodeHighlight action
  applyAstChangesToCode: async (): Promise<string | null> => {
    const { originalCode, componentPreviewAst } = get();

    if (!originalCode || !componentPreviewAst) {
      console.error('Apply Changes Aborted: Missing original code or preview AST.');
      return null;
    }

    try {
      // Call our new, logic-preserving updater
      const newCode = await updateStylesInCode(originalCode, componentPreviewAst);

      set({ originalCode: newCode, isDirty: false, isCodeHighlighted: true });
      return newCode;

    } catch (error) {
      console.error('Failed to apply style changes to code:', error);
      return null;
    }
  },
}));