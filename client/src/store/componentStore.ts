import React from 'react';
import { create } from 'zustand';
// Use the new surgical style updater that preserves component logic
import { updateStylesInCode } from '@/lib/styleUpdater';
import { defaultExample } from '@/examples/examples';

/**
 * Component Store - Central State Management for Live Component Editor
 *
 * This Zustand store manages the application's state for interactive component editing.
 * It supports managing multiple components in a library, with one being "active" at any time.
 * Each component maintains multiple representations to enable different editing modes:
 *
 * Key State Properties:
 * - components: A map of component IDs to their data (multi-component library)
 * - activeComponentId: The ID of the component currently being edited
 * - selectedNodeId: Currently selected element in the active component tree for editing
 * - selectionMode: Either 'interact' or 'select' mode for the canvas
 * - isDirty: Flag indicating whether the active component has changes that haven't been applied back to the code
 * - isCodeHighlighted: Flag to control persistent highlighting in the code editor after changes are applied
 *
 * Architecture:
 * - Multi-component library with full CRUD operations
 * - Dual AST system: runtime AST (interactive) + preview AST (safe for editing)
 * - Surgical code updates that preserve component logic
 * - History stack with unlimited undo/redo
 * - Computed getters for backward compatibility
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

// At the top of the file, above the ComponentState interface
/**
 * ComponentData - Complete state representation for a single component
 *
 * Each component in the library maintains its own complete state including:
 * - Source code and AST representations
 * - Configuration (props, dependencies, wrapper)
 * - Edit history for undo/redo functionality
 * - Metadata (name, ID)
 */
export interface ComponentData {
  id: string; // A unique identifier
  name: string; // Display name for the component
  code: string; // The user's source code string (source of truth for logic)
  componentAst: SerializableElement | null; // Runtime AST created with real React (interactive)
  componentPreviewAst: SerializableElement | null; // Preview AST created with shimmed React (safe for editing)
  jsxLocation: JsxLocation | null; // Location of JSX block in source code for highlighting
  propsJson: string; // JSON string of mock props for component rendering
  dependencies: string[]; // Array of external CDN URLs to inject
  wrapperCode: string; // Code for React context providers/wrappers
  history: HistorySnapshot[]; // Array of AST snapshots for undo/redo
  historyIndex: number; // Current position in history stack
}

// Find and REPLACE the ComponentState interface with this
/**
 * ComponentState - Global application state interface
 *
 * Contains the complete state of the Live Component Editor including:
 * - Multi-component library management
 * - Global UI state (selection, modes)
 * - Active component tracking
 */
interface ComponentState {
  components: Record<string, ComponentData>; // A map of component IDs to their data
  activeComponentId: string | null; // The ID of the component currently being edited

  // Global state that remains outside:
  selectedNodeId: string | null; // Currently selected element ID
  selectionMode: 'interact' | 'select'; // Canvas interaction mode
  isDirty: boolean; // isDirty now refers to the active component
  isCodeHighlighted: boolean; // Controls persistent code highlighting
}

// Define the actions that can be performed on the state
/**
 * ComponentActions - Available actions for state management
 *
 * Comprehensive set of actions for:
 * - Component library CRUD operations
 * - Legacy actions for backward compatibility
 * - UI state management
 * - Code and AST manipulation
 */
interface ComponentActions {
  // Component Library Management
  addComponent: () => void;
  setActiveComponent: (componentId: string) => void;
  updateComponentName: (componentId: string, newName: string) => void;
  updateComponentCode: (code: string) => void;
  updateActiveComponentCode: (newCode: string) => void;
  deleteComponent: (componentId: string) => void;
  saveActiveCodeAsNewComponent: (newName: string) => void;
  loadExampleSet: (components: Record<string, Partial<ComponentData>> | ComponentData[], activeId: string) => void;
  
  // Legacy actions for backward compatibility (now operate on active component)
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

// Computed state properties for backward compatibility
/**
 * ComputedState - Computed getters for backward compatibility
 *
 * These getters derive values from the active component to maintain
 * compatibility with existing code that expects single-component state.
 * They automatically track the currently active component.
 */
interface ComputedState {
  // Legacy getters that derive from the active component
  componentAst: SerializableElement | null;
  componentPreviewAst: SerializableElement | null;
  history: HistorySnapshot[];
  historyIndex: number;
  propsJson: string;
  dependencies: string[];
  wrapperCode: string;
  originalCode: string | null;
  jsxLocation: JsxLocation | null;
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

export const useComponentStore = create<ComponentState & ComponentActions & ComputedState>((set, get) => {
  // In the create() call, update the initial state object
  const defaultComponentId = 'default-1';
  const defaultComponent: ComponentData = {
    id: defaultComponentId,
    name: 'Untitled Component',
    code: defaultExample.code, // Use the blank slate code from examples
    componentAst: null,
    componentPreviewAst: null,
    jsxLocation: null,
    propsJson: JSON.stringify(defaultExample.props || {}, null, 2),
    dependencies: defaultExample.dependency ? [defaultExample.dependency] : [],
    wrapperCode: initialWrapperCode, // Use the wrapper code from your store
    history: [{ ast: null, preview: null }],
    historyIndex: 0,
  };

  return {
    // Initial State
    components: {
      [defaultComponentId]: defaultComponent,
    },
    activeComponentId: defaultComponentId,
    selectedNodeId: null,
    selectionMode: 'interact',
    isDirty: false,
    isCodeHighlighted: false,

    // Computed properties for backward compatibility
    get componentAst() {
      const state = get();
      const activeComponent = state.activeComponentId ? state.components[state.activeComponentId] : null;
      return activeComponent?.componentAst || null;
    },
    get componentPreviewAst() {
      const state = get();
      const activeComponent = state.activeComponentId ? state.components[state.activeComponentId] : null;
      return activeComponent?.componentPreviewAst || null;
    },
    get history() {
      const state = get();
      const activeComponent = state.activeComponentId ? state.components[state.activeComponentId] : null;
      return activeComponent?.history || [{ ast: null, preview: null }];
    },
    get historyIndex() {
      const state = get();
      const activeComponent = state.activeComponentId ? state.components[state.activeComponentId] : null;
      return activeComponent?.historyIndex || 0;
    },
    get propsJson() {
      const state = get();
      const activeComponent = state.activeComponentId ? state.components[state.activeComponentId] : null;
      return activeComponent?.propsJson || '{}';
    },
    get dependencies() {
      const state = get();
      const activeComponent = state.activeComponentId ? state.components[state.activeComponentId] : null;
      return activeComponent?.dependencies || [];
    },
    get wrapperCode() {
      const state = get();
      const activeComponent = state.activeComponentId ? state.components[state.activeComponentId] : null;
      return activeComponent?.wrapperCode || initialWrapperCode;
    },
    get originalCode() {
      const state = get();
      const activeComponent = state.activeComponentId ? state.components[state.activeComponentId] : null;
      return activeComponent?.code || null;
    },
    get jsxLocation() {
      const state = get();
      const activeComponent = state.activeComponentId ? state.components[state.activeComponentId] : null;
      return activeComponent?.jsxLocation || null;
    },

    // Actions
    // Component Library Management
    addComponent: () => {
      const newId = `component-${Date.now()}`;
      const newComponent: ComponentData = {
        id: newId,
        name: `Component ${Object.keys(get().components).length + 1}`,
        code: defaultExample.code,
        componentAst: null,
        componentPreviewAst: null,
        jsxLocation: null,
        propsJson: JSON.stringify(defaultExample.props || {}, null, 2),
        dependencies: defaultExample.dependency ? [defaultExample.dependency] : [],
        wrapperCode: initialWrapperCode,
        history: [{ ast: null, preview: null }],
        historyIndex: 0,
      };
      set((state) => ({
        components: {
          ...state.components,
          [newId]: newComponent,
        },
        activeComponentId: newId, // Automatically make the new component active
        selectedNodeId: null,
        isDirty: false,
        isCodeHighlighted: false,
      }));
    },

    setActiveComponent: (componentId) => set({ 
      activeComponentId: componentId, 
      selectedNodeId: null, 
      isDirty: false,
      isCodeHighlighted: false,
    }),

    updateComponentName: (componentId, newName) => {
      set((state) => ({
        components: {
          ...state.components,
          [componentId]: {
            ...state.components[componentId],
            name: newName,
          },
        },
      }));
    },

    updateComponentCode: (code) => {
      const { activeComponentId } = get();
      if (!activeComponentId) return;
      
      set((state) => ({
        components: {
          ...state.components,
          [activeComponentId]: {
            ...state.components[activeComponentId],
            code: code,
          },
        },
      }));
    },

    updateActiveComponentCode: (newCode: string) => {
      const { activeComponentId } = get();
      if (!activeComponentId) return;

      set(state => ({
        components: {
          ...state.components,
          [activeComponentId]: {
            ...state.components[activeComponentId],
            code: newCode,
          },
        },
      }));
    },

    deleteComponent: (componentId) => {
      set((state) => {
        const newComponents = { ...state.components };
        delete newComponents[componentId];
        
        // Don't leave the app in a state with no active component
        const newActiveId = state.activeComponentId === componentId
          ? Object.keys(newComponents)[0] || null
          : state.activeComponentId;
          
        return { 
          components: newComponents, 
          activeComponentId: newActiveId,
          selectedNodeId: null,
          isDirty: false,
          isCodeHighlighted: false,
        };
      });
    },

    saveActiveCodeAsNewComponent: (newName) => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;

      const activeComponent = components[activeComponentId];
      const newId = `component-${Date.now()}`;
      const newComponent: ComponentData = {
        ...activeComponent, // Inherit everything from the active component
        id: newId,
        name: newName,
        // Reset ASTs and history, as this is a new "saved" version
        componentAst: null,
        componentPreviewAst: null,
        jsxLocation: null,
        history: [{ ast: null, preview: null }],
        historyIndex: 0,
      };
      
      set((state) => ({
        components: { 
          ...state.components, 
          [newId]: newComponent 
        },
        activeComponentId: newId, // Switch to the newly saved component
        selectedNodeId: null,
        isDirty: false,
        isCodeHighlighted: false,
      }));
    },

    loadExampleSet: (componentsToLoad, activeId) => {
      const newComponents: Record<string, ComponentData> = {};

      // Handle array format (existing multiComponentExamples)
      if (Array.isArray(componentsToLoad)) {
        componentsToLoad.forEach(comp => {
          newComponents[comp.id] = comp;
        });
      }
      // Handle record format (new exampleSets)
      else {
        for (const id in componentsToLoad) {
          const partial = componentsToLoad[id];
          // Merge with defaults to create a full ComponentData object
          newComponents[id] = {
            id: partial.id!,
            name: partial.name!,
            code: partial.code!,
            propsJson: partial.propsJson || '{}',
            componentAst: null,
            componentPreviewAst: null,
            jsxLocation: null,
            dependencies: [],
            wrapperCode: initialWrapperCode,
            history: [{ ast: null, preview: null }],
            historyIndex: 0,
          };
        }
      }

      set({
        components: newComponents,
        activeComponentId: activeId,
        selectedNodeId: null,
        isDirty: false,
        isCodeHighlighted: false,
      });
    },

    // Legacy actions for backward compatibility (now operate on active component)
    setAst: (ast) => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;
      
      const activeComponent = components[activeComponentId];
      const updatedComponent = {
        ...activeComponent,
        componentAst: ast,
        componentPreviewAst: null,
        history: [{ ast: ast, preview: null }],
        historyIndex: 0,
      };

      set((state) => ({
        components: {
          ...state.components,
          [activeComponentId]: updatedComponent,
        },
        selectedNodeId: null,
      }));
    },

    setAstWithPreview: (ast, preview) => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;
      
      console.log('setAstWithPreview called with ast:', ast, 'preview:', preview);
      const activeComponent = components[activeComponentId];
      const updatedComponent = {
        ...activeComponent,
        componentAst: ast,
        componentPreviewAst: preview,
        history: [{ ast, preview }],
        historyIndex: 0,
      };

      set((state) => ({
        components: {
          ...state.components,
          [activeComponentId]: updatedComponent,
        },
        selectedNodeId: null,
      }));
    },

    setSelectedNodeId: (nodeId) => {
      console.log('🏪 Store: setSelectedNodeId called with:', nodeId);
      set({ selectedNodeId: nodeId });
      console.log('🏪 Store: selectedNodeId set successfully');
    },

    /**
     * Updates the style of a specific node in the active component's AST
     *
     * STATE MANAGEMENT FIX (v1.1):
     * - Fixed race conditions by using atomic updates within set() callback
     * - Proper immutable updates to prevent state mutation bugs
     * - Correctly sets isDirty flag when changes are made
     * - Maintains history stack for undo/redo functionality
     *
     * @param nodeId - The ID of the node to update
     * @param newStyle - The new CSS properties to apply
     */
    updateNodeStyle: (nodeId, newStyle) => {
      set((state) => {
        const { activeComponentId, components } = state;

        // 1. Guard Clause: Don't do anything if there's no active component.
        if (!activeComponentId) {
          return state; // Return the original state unmodified
        }

        // 2. Get a reference to the specific component data we need to update.
        const activeComponentData = components[activeComponentId];
        if (!activeComponentData) {
          return state; // Safety check
        }

        const { componentAst, componentPreviewAst, history, historyIndex } = activeComponentData;

        // 3. Define the update function (this part is the same as before).
        const updateFn = (node: SerializableElement): SerializableElement => ({
          ...node,
          props: {
            ...node.props,
            style: { ...node.props.style, ...newStyle },
          },
        });

        // 4. Create the new, updated versions of the ASTs.
        const newComponentAst = componentAst
          ? findAndCloneUpdateNode(componentAst, nodeId, updateFn)
          : null;
        const newComponentPreviewAst = componentPreviewAst
          ? findAndCloneUpdateNode(componentPreviewAst, nodeId, updateFn)
          : null;

        // 5. Create the new history entry for the component.
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ ast: newComponentAst, preview: newComponentPreviewAst });

        // 6. Create the single, updated ComponentData object.
        const updatedComponentData: ComponentData = {
          ...activeComponentData,
          componentAst: newComponentAst,
          componentPreviewAst: newComponentPreviewAst,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };

        // 7. Create the new, top-level state object.
        // This is the most critical step: we create a new `components` map
        // and place our updated component data inside it.
        const newState: Partial<ComponentState> = {
          components: {
            ...state.components,
            [activeComponentId]: updatedComponentData,
          },
          isDirty: true, // <<< Set the dirty flag!
        };

        return newState;
      });
    },

    undo: () => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;

      const activeComponent = components[activeComponentId];
      const { history, historyIndex } = activeComponent;
      
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const entry = history[newIndex];
        const updatedComponent = {
          ...activeComponent,
          historyIndex: newIndex,
          componentAst: entry.ast,
          componentPreviewAst: entry.preview,
        };

        set((state) => ({
          components: {
            ...state.components,
            [activeComponentId]: updatedComponent,
          },
          selectedNodeId: null, // Clear selection when time-traveling
          isDirty: true, // Undoing a change makes the code dirty relative to the last save
        }));
      }
    },

    redo: () => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;

      const activeComponent = components[activeComponentId];
      const { history, historyIndex } = activeComponent;
      
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const entry = history[newIndex];
        const updatedComponent = {
          ...activeComponent,
          historyIndex: newIndex,
          componentAst: entry.ast,
          componentPreviewAst: entry.preview,
        };

        set((state) => ({
          components: {
            ...state.components,
            [activeComponentId]: updatedComponent,
          },
          selectedNodeId: null, // Clear selection when time-traveling
          isDirty: true, // Redoing a change makes the code dirty relative to the last save
        }));
      }
    },

    setPropsJson: (json: string) => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;

      const activeComponent = components[activeComponentId];
      const updatedComponent = {
        ...activeComponent,
        propsJson: json,
      };

      set((state) => ({
        components: {
          ...state.components,
          [activeComponentId]: updatedComponent,
        },
      }));
    },

    setSelectionMode: (mode) => set({ selectionMode: mode }),

    addDependency: (url) => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;

      const activeComponent = components[activeComponentId];
      const updatedComponent = {
        ...activeComponent,
        dependencies: [...activeComponent.dependencies, url],
      };

      set((state) => ({
        components: {
          ...state.components,
          [activeComponentId]: updatedComponent,
        },
      }));
    },

    removeDependency: (url) => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;

      const activeComponent = components[activeComponentId];
      const updatedComponent = {
        ...activeComponent,
        dependencies: activeComponent.dependencies.filter(d => d !== url),
      };

      set((state) => ({
        components: {
          ...state.components,
          [activeComponentId]: updatedComponent,
        },
      }));
    },

    setDependencies: (urls) => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;

      const activeComponent = components[activeComponentId];
      const updatedComponent = {
        ...activeComponent,
        dependencies: urls,
      };

      set((state) => ({
        components: {
          ...state.components,
          [activeComponentId]: updatedComponent,
        },
      }));
    },

    setWrapperCode: (code) => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;

      const activeComponent = components[activeComponentId];
      const updatedComponent = {
        ...activeComponent,
        wrapperCode: code,
      };

      set((state) => ({
        components: {
          ...state.components,
          [activeComponentId]: updatedComponent,
        },
      }));
    },

    setRenderOutput: (code, runtimeAst, previewAst, jsxLocation) => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return;

      const activeComponent = components[activeComponentId];
      const { history, historyIndex } = activeComponent;

      // Add the new state to history, keeping only states up to current index + 1
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ ast: runtimeAst, preview: previewAst });

      const updatedComponent = {
        ...activeComponent,
        code,
        jsxLocation,
        componentAst: runtimeAst,
        componentPreviewAst: previewAst,
        history: newHistory,
        historyIndex: newHistory.length - 1, // Point to the latest entry
      };

      set((state) => ({
        components: {
          ...state.components,
          [activeComponentId]: updatedComponent,
        },
        isDirty: false,
        isCodeHighlighted: false,
        selectedNodeId: null,
      }));
    },

    setDirty: (dirty: boolean) => set({ isDirty: dirty }),
    clearCodeHighlight: () => set({ isCodeHighlighted: false }),

    applyAstChangesToCode: async (): Promise<string | null> => {
      const { activeComponentId, components } = get();
      if (!activeComponentId) return null;

      const activeComponent = components[activeComponentId];
      const { code: originalCode, componentPreviewAst } = activeComponent;

      if (!originalCode || !componentPreviewAst) {
        console.error('Apply Changes Aborted: Missing original code or preview AST.');
        return null;
      }

      try {
        // Call our new, logic-preserving updater
        const newCode = await updateStylesInCode(originalCode, componentPreviewAst);

        const updatedComponent = {
          ...activeComponent,
          code: newCode,
        };

        set((state) => ({
          components: {
            ...state.components,
            [activeComponentId]: updatedComponent,
          },
          isDirty: false,
          isCodeHighlighted: true,
        }));
        
        return newCode;

      } catch (error) {
        console.error('Failed to apply style changes to code:', error);
        return null;
      }
    },
  };
});