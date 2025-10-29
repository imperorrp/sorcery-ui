/**
 * Component CRUD Actions Module
 * 
 * This module contains all actions related to component management within projects:
 * - Adding, renaming, and deleting components
 * - Switching between components
 * - Saving variations of components
 */

import type { StateCreator } from 'zustand';
import type { StoreType, ComponentData } from './types';
import { initialWrapperCode } from './projectActions';
import { defaultExample } from '@/examples/examples';

/**
 * Helper function to generate unique IDs
 */
const generateId = (): string => {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Create component CRUD actions slice
 * 
 * All actions in this slice operate on components within the active project.
 * They use the getActiveProject() selector to ensure they're modifying the correct project.
 */
export const createComponentActions: StateCreator<
  StoreType,
  [],
  [],
  Pick<
    StoreType,
    | 'addComponent'
    | 'setActiveComponent'
    | 'updateComponentName'
    | 'updateComponentCode'
    | 'updateActiveComponentCode'
    | 'deleteComponent'
    | 'saveActiveCodeAsNewComponent'
    | 'openComponent'
    | 'clearLastOpenedTab'
  >
> = (set, get) => ({
  
  /**
   * Add a new component to the active project
   * 
   * Creates a blank component with default settings and makes it active.
   * The component is added to the currently active project.
   */
  addComponent: () => {
    const { projects, activeProjectId, getActiveProject } = get();
    const project = getActiveProject();
    
    if (!project || !activeProjectId) {
      console.warn('[Component] Cannot add: no active project');
      return;
    }

    const newId = generateId();
    const componentCount = Object.keys(project.components).length;
    
    const newComponent: ComponentData = {
      id: newId,
      name: `Component ${componentCount + 1}`,
      code: defaultExample.code,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: JSON.stringify(defaultExample.props || {}, null, 2),
      originalPropsJson: JSON.stringify(defaultExample.props || {}, null, 2),
      dependencies: defaultExample.dependency 
        ? (Array.isArray(defaultExample.dependency) ? defaultExample.dependency : [defaultExample.dependency]) 
        : ['https://cdn.tailwindcss.com'],
      wrapperCode: initialWrapperCode,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    };

    const updatedProject = {
      ...project,
      components: {
        ...project.components,
        [newId]: newComponent,
      },
      activeComponentId: newId, // Make the new component active
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
      selectedNodeId: null,
      isDirty: false,
      isCodeHighlighted: false,
      lastOpenedTabId: newId,
    });

    console.log('[Component] Added component:', newId, newComponent.name, 'to project:', project.name);
  },

  /**
   * Switch to a different component within the active project
   * 
   * @param componentId - ID of the component to activate
   */
  setActiveComponent: (componentId) => {
    const { projects, activeProjectId, getActiveProject } = get();
    const project = getActiveProject();
    
    if (!project || !activeProjectId) {
      console.warn('[Component] Cannot switch: no active project');
      return;
    }

    if (!project.components[componentId]) {
      console.warn('[Component] Cannot switch: component not found:', componentId);
      return;
    }

    const updatedProject = {
      ...project,
      activeComponentId: componentId,
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
      selectedNodeId: null,
      hoveredNodeId: null,
      isDirty: false,
      isCodeHighlighted: false,
    });

    console.log('[Component] Switched to component:', componentId, project.components[componentId].name);
  },

  /**
   * Update the name of a component
   * 
   * @param componentId - ID of the component to rename
   * @param newName - New name for the component
   */
  updateComponentName: (componentId, newName) => {
    const { projects, activeProjectId, getActiveProject } = get();
    const project = getActiveProject();
    
    if (!project || !activeProjectId) {
      console.warn('[Component] Cannot rename: no active project');
      return;
    }

    const component = project.components[componentId];
    if (!component) {
      console.warn('[Component] Cannot rename: component not found:', componentId);
      return;
    }

    const updatedProject = {
      ...project,
      components: {
        ...project.components,
        [componentId]: {
          ...component,
          name: newName,
        },
      },
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
    });

    console.log('[Component] Renamed component:', componentId, '→', newName);
  },

  /**
   * Update the code of a specific component
   * 
   * This is typically used when the code editor content changes.
   * 
   * @param code - New code string
   */
  updateComponentCode: (code) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();
    
    if (!project || !activeProjectId || !component) {
      console.warn('[Component] Cannot update code: no active component');
      return;
    }

    const updatedProject = {
      ...project,
      components: {
        ...project.components,
        [component.id]: {
          ...component,
          code,
        },
      },
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
    });
  },

  /**
   * Update the code of the active component
   * 
   * Convenience method that uses the active component ID automatically.
   * 
   * @param newCode - New code string
   */
  updateActiveComponentCode: (newCode) => {
    const component = get().getActiveComponent();
    if (component) {
      get().updateComponentCode(newCode);
    }
  },

  /**
   * Delete a component from the active project
   * 
   * If the deleted component was active, automatically switches to another component.
   * 
   * @param componentId - ID of the component to delete
   */
  deleteComponent: (componentId) => {
    const { projects, activeProjectId, getActiveProject } = get();
    const project = getActiveProject();
    
    if (!project || !activeProjectId) {
      console.warn('[Component] Cannot delete: no active project');
      return;
    }

    if (!project.components[componentId]) {
      console.warn('[Component] Cannot delete: component not found:', componentId);
      return;
    }

    // Don't allow deleting the last component
    if (Object.keys(project.components).length === 1) {
      console.warn('[Component] Cannot delete the last component in project');
      return;
    }

    const { [componentId]: deletedComponent, ...remainingComponents } = project.components;
    
    // If we're deleting the active component, switch to another one
    let newActiveComponentId = project.activeComponentId;
    if (project.activeComponentId === componentId) {
      const remainingIds = Object.keys(remainingComponents);
      newActiveComponentId = remainingIds[0] ?? null;
    }

    const updatedProject = {
      ...project,
      components: remainingComponents,
      activeComponentId: newActiveComponentId,
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
      selectedNodeId: null,
      isDirty: false,
      isCodeHighlighted: false,
    });

    console.log('[Component] Deleted component:', componentId, deletedComponent.name);
    if (newActiveComponentId !== project.activeComponentId) {
      console.log('[Component] Switched to component:', newActiveComponentId);
    }
  },

  /**
   * Save the active component's code as a new component
   * 
   * Creates a duplicate of the active component with a new name.
   * Useful for creating variations or saving work-in-progress.
   * 
   * @param newName - Name for the new component
   */
  saveActiveCodeAsNewComponent: (newName) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const activeComponent = getActiveComponent();
    
    if (!project || !activeProjectId || !activeComponent) {
      console.warn('[Component] Cannot save: no active component');
      return;
    }

    const newId = generateId();
    
    // Create a copy of the active component with new ID and name
    const newComponent: ComponentData = {
      ...activeComponent,
      id: newId,
      name: newName,
      // Reset ASTs and history for the new component
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    };

    const updatedProject = {
      ...project,
      components: {
        ...project.components,
        [newId]: newComponent,
      },
      activeComponentId: newId, // Switch to the new component
      updatedAt: Date.now(),
    };

    set({
      projects: {
        ...projects,
        [activeProjectId]: updatedProject,
      },
      selectedNodeId: null,
      isDirty: false,
      isCodeHighlighted: false,
      lastOpenedTabId: newId,
    });

    console.log('[Component] Saved as new component:', newId, newName);
  },

  /**
   * Open a component and mark it as explicitly opened
   * 
   * This is used by the UI to track when a component was explicitly opened
   * (vs. just switching tabs), which helps with tab management.
   * 
   * @param componentId - ID of the component to open
   */
  openComponent: (componentId) => {
    get().setActiveComponent(componentId);
    set({ lastOpenedTabId: componentId });
    console.log('[Component] Opened component (explicit):', componentId);
  },

  /**
   * Clear the last opened tab flag
   * 
   * Used by the UI after handling the explicit open event.
   */
  clearLastOpenedTab: () => {
    set({ lastOpenedTabId: null });
  },
});
