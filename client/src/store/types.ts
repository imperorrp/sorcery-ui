/**
 * Store Type Definitions
 * 
 * This file contains all TypeScript interfaces and types used throughout the component store.
 * Separating types improves maintainability and makes the architecture clearer.
 */

import React from 'react';

/**
 * SerializableElement - Lightweight AST representation of React elements
 * 
 * This is our custom AST format that can be safely serialized and manipulated.
 * It represents both native DOM elements and React components in a uniform way.
 */
export interface SerializableElement {
  id: string;
  // type can be a native element string (e.g. 'div') or a React component (function/class)
  type: string | React.ComponentType<unknown>;
  props: {
    [key: string]: unknown; // Use `unknown` instead of `any` to force type checks
    children?: (SerializableElement | string)[];
    style?: React.CSSProperties;
  };
  utilityClassState?: Record<string, string>; // Structured state for utility classes
}

/**
 * JsxLocation - Location of JSX block within source code
 * 
 * Used for highlighting the rendered JSX in the code editor
 */
export type JsxLocation = { start: number; end: number };

/**
 * ElementLocationMap - Map of element IDs to their source code positions
 * 
 * Used for surgical code updates and highlighting
 */
export type ElementLocationMap = Map<string, {
  start: number;
  end: number;
  style?: { start: number; end: number };
}>;

/**
 * HistorySnapshot - Single point in undo/redo history
 * 
 * Captures both the runtime AST and preview AST at a specific moment
 */
export interface HistorySnapshot {
  ast: SerializableElement | null;
  preview: SerializableElement | null;
}

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
  originalPropsJson?: string; // Original props from example, used for reset functionality
  dependencies: string[]; // Array of external CDN URLs to inject
  wrapperCode: string; // Code for React context providers/wrappers
  history: HistorySnapshot[]; // Array of AST snapshots for undo/redo
  historyIndex: number; // Current position in history stack
}

/**
 * ProjectData - A collection of related components
 *
 * Projects group multiple components together (e.g., "Card Dashboard" with Card, CardList, Button).
 * This provides a first-class organizational layer above individual components.
 */
export interface ProjectData {
  id: string; // Unique project identifier
  name: string; // Display name for the project
  components: Record<string, ComponentData>; // All components in this project
  activeComponentId: string | null; // Which component is currently being edited
  createdAt: number; // Timestamp when project was created
  updatedAt: number; // Timestamp when project was last modified
}

/**
 * ComponentState - Global application state interface
 *
 * Contains the complete state of the Live Component Editor including:
 * - Project layer for organizing related components
 * - Global UI state (selection, modes)
 * - Active project and component tracking
 */
export interface ComponentState {
  // Project layer - first-class organizational structure
  projects: Record<string, ProjectData>; // All projects in the workspace
  activeProjectId: string | null; // The ID of the project currently being worked on
  
  examplesVersion: number; // Incremented when example sets are loaded to notify UI
  currentExampleName: string | null; // The name of the currently loaded example
  // Transient helper used to tell UI which component was explicitly opened
  // (as opposed to simply activated via clicking an existing tab).
  lastOpenedTabId?: string | null;

  // Global state that remains outside:
  selectedNodeId: string | null; // Currently selected element ID
  hoveredNodeId: string | null; // Currently hovered element ID (transient)
  selectionMode: 'interact' | 'select'; // Canvas interaction mode
  isDirty: boolean; // isDirty now refers to the active component
  isCodeHighlighted: boolean; // Controls persistent code highlighting
  isRendering: boolean; // Flag indicating whether a render operation is in progress
  themeCss: string; // Theme CSS for CSS variables and arbitrary global styles
  tailwindConfig: string; // Tailwind configuration JavaScript string
}

/**
 * ProjectActions - Project-level CRUD operations
 * 
 * Actions for creating, managing, and switching between projects
 */
export interface ProjectActions {
  initProjectLayer: () => void; // Initialize project layer and migrate legacy data
  createProject: (name?: string) => string; // Create a new project and return its ID
  renameProject: (projectId: string, name: string) => void; // Rename an existing project
  setActiveProject: (projectId: string) => void; // Switch to a different project
  deleteProject: (projectId: string) => void; // Delete a project
}

/**
 * ComponentCRUDActions - Component-level CRUD operations
 * 
 * Actions for managing components within the active project
 */
export interface ComponentCRUDActions {
  addComponent: () => void;
  setActiveComponent: (componentId: string) => void;
  updateComponentName: (componentId: string, newName: string) => void;
  updateComponentCode: (code: string) => void;
  updateActiveComponentCode: (newCode: string) => void;
  deleteComponent: (componentId: string) => void;
  saveActiveCodeAsNewComponent: (newName: string) => void;
  openComponent: (componentId: string) => void; // Open a component and mark it as explicitly opened
  clearLastOpenedTab: () => void;
}

/**
 * ASTActions - AST manipulation operations
 * 
 * Actions for modifying the component's AST (styles, classes, structure)
 */
export interface ASTActions {
  setAst: (ast: SerializableElement | null) => void;
  setAstWithPreview: (ast: SerializableElement | null, preview: SerializableElement | null) => void;
  updateNodeStyle: (nodeId: string, newStyle: React.CSSProperties) => void;
  updateNodeClassName: (nodeId: string, newClassName: string) => void;
  updateUtilityClass: (nodeId: string, category: string, newClass: string | null) => void;
  undo: () => void;
  redo: () => void;
}

/**
 * RenderActions - Rendering and code generation operations
 * 
 * Actions for transpiling, rendering, and applying changes back to source code
 */
export interface RenderActions {
  renderActiveComponent: () => Promise<void>;
  setRenderOutput: (
    code: string,
    runtimeAst: SerializableElement | null,
    previewAst: SerializableElement | null,
    jsxLocation: JsxLocation | null
  ) => void;
  applyAstChangesToCode: () => Promise<string | null>;
  loadExample: (key: string) => void;
  loadExampleSet: (components: Record<string, Partial<ComponentData>> | ComponentData[], activeId: string) => void;
}

/**
 * ConfigActions - Configuration operations
 * 
 * Actions for managing props, dependencies, theme, and other settings
 */
export interface ConfigActions {
  setPropsJson: (json: string) => void;
  addDependency: (url: string) => void;
  removeDependency: (url: string) => void;
  setDependencies: (urls: string[]) => void;
  setWrapperCode: (code: string) => void;
  setThemeCss: (css: string) => void;
  setTailwindConfig: (config: string) => void;
}

/**
 * UIActions - UI state operations
 * 
 * Actions for managing selection, modes, and UI flags
 */
export interface UIActions {
  setSelectedNodeId: (nodeId: string | null) => void;
  setHoveredNodeId: (nodeId: string | null) => void;
  setSelectionMode: (mode: 'interact' | 'select') => void;
  setDirty: (dirty: boolean) => void;
  clearCodeHighlight: () => void;
}

/**
 * ComponentActions - Combined action interface
 * 
 * Union of all action interfaces for the complete store API
 */
export interface ComponentActions extends
  ProjectActions,
  ComponentCRUDActions,
  ASTActions,
  RenderActions,
  ConfigActions,
  UIActions {}

/**
 * ComputedState - Computed getters for backward compatibility and convenience
 *
 * These getters derive values from the active project and component to maintain
 * compatibility with existing code that expects single-component state.
 * They automatically track the currently active project and component.
 */
export interface ComputedState {
  // New project-aware getters
  getActiveProject: () => ProjectData | null; // Get the currently active project
  getActiveComponent: () => ComponentData | null; // Get the currently active component
  getAllComponents: () => ComponentData[]; // Get all components in the active project
  
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

/**
 * StoreType - Complete store type combining state, actions, and computed values
 */
export type StoreType = ComponentState & ComponentActions & ComputedState;
