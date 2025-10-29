/**
 * Project Actions Module
 * 
 * This module contains all actions related to project management:
 * - Initializing the project layer and migrating legacy data
 * - Creating, renaming, and deleting projects
 * - Switching between projects
 */

import type { StateCreator } from 'zustand';
import type { StoreType, ProjectData } from './types';

/**
 * Initial wrapper code template for new projects/components
 */
export const initialWrapperCode = `// Wrap your component here
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

/**
 * Helper function to generate unique IDs
 */
const generateId = (): string => {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Create project actions slice
 * 
 * This slice manages the project lifecycle and ensures proper state isolation
 * between different projects.
 */
export const createProjectActions: StateCreator<
  StoreType,
  [],
  [],
  Pick<StoreType, 'initProjectLayer' | 'createProject' | 'renameProject' | 'setActiveProject' | 'deleteProject'>
> = (set, get) => ({
  
  /**
   * Initialize the project layer and migrate legacy data
   * 
   * This function is called once on store initialization. It checks if the store
   * has already been migrated to the project structure. If not, it wraps any
   * existing legacy component-only data into a default project.
   * 
   * Migration strategy:
   * - If projects already exist: do nothing (already migrated)
   * - If legacy components exist: wrap them into a default project
   * - If nothing exists: a default project was created in initial state
   */
  initProjectLayer: () => {
    const state = get();

    // If we already have projects, migration is complete
    if (Object.keys(state.projects).length > 0 && state.activeProjectId) {
      console.log('[ProjectLayer] Already initialized with', Object.keys(state.projects).length, 'projects');
      return;
    }

    console.log('[ProjectLayer] Initializing project layer...');

    // This function is primarily for future-proofing if someone manually
    // modifies localStorage to have legacy structure. In normal flow,
    // the initial state already creates a default project.
    
    const now = Date.now();
    const defaultProjectId = generateId();
    const defaultProject: ProjectData = {
      id: defaultProjectId,
      name: state.currentExampleName || 'Untitled Project',
      components: {}, // Start empty; initial state handles default component
      activeComponentId: null,
      createdAt: now,
      updatedAt: now,
    };

    set({
      projects: { [defaultProjectId]: defaultProject },
      activeProjectId: defaultProjectId,
    });

    console.log('[ProjectLayer] Initialized with default project:', defaultProjectId);
  },

  /**
   * Create a new project
   * 
   * Creates an empty project and optionally makes it active.
   * 
   * @param name - Optional name for the project (defaults to "New Project")
   * @returns The ID of the newly created project
   */
  createProject: (name = 'New Project') => {
    const { projects } = get();
    const id = generateId();
    const now = Date.now();
    
    const newProject: ProjectData = {
      id,
      name,
      components: {},
      activeComponentId: null,
      createdAt: now,
      updatedAt: now,
    };

    set({
      projects: {
        ...projects,
        [id]: newProject,
      },
      activeProjectId: id, // Make the new project active
      selectedNodeId: null,
      isDirty: false,
      isCodeHighlighted: false,
    });

    console.log('[Project] Created new project:', id, name);
    return id;
  },

  /**
   * Rename an existing project
   * 
   * @param projectId - ID of the project to rename
   * @param name - New name for the project
   */
  renameProject: (projectId, name) => {
    const { projects } = get();
    const project = projects[projectId];
    
    if (!project) {
      console.warn('[Project] Cannot rename: project not found:', projectId);
      return;
    }

    set({
      projects: {
        ...projects,
        [projectId]: {
          ...project,
          name,
          updatedAt: Date.now(),
        },
      },
    });

    console.log('[Project] Renamed project:', projectId, '→', name);
  },

  /**
   * Switch to a different project
   * 
   * Makes the specified project active. Clears selection and resets UI state.
   * 
   * @param projectId - ID of the project to activate
   */
  setActiveProject: (projectId) => {
    const { projects } = get();
    
    if (!projects[projectId]) {
      console.warn('[Project] Cannot activate: project not found:', projectId);
      return;
    }

    set({
      activeProjectId: projectId,
      selectedNodeId: null,
      hoveredNodeId: null,
      isDirty: false,
      isCodeHighlighted: false,
      lastOpenedTabId: null,
    });

    console.log('[Project] Activated project:', projectId, projects[projectId].name);
  },

  /**
   * Delete a project
   * 
   * Removes a project from the store. If the deleted project was active,
   * automatically switches to another available project.
   * 
   * @param projectId - ID of the project to delete
   */
  deleteProject: (projectId) => {
    const { projects, activeProjectId } = get();
    
    if (!projects[projectId]) {
      console.warn('[Project] Cannot delete: project not found:', projectId);
      return;
    }

    // Don't allow deleting the last project
    if (Object.keys(projects).length === 1) {
      console.warn('[Project] Cannot delete the last project');
      return;
    }

    const { [projectId]: deletedProject, ...remainingProjects } = projects;
    
    // If we're deleting the active project, switch to another one
    let newActiveId = activeProjectId;
    if (activeProjectId === projectId) {
      const remainingIds = Object.keys(remainingProjects);
      newActiveId = remainingIds[0] ?? null;
    }

    set({
      projects: remainingProjects,
      activeProjectId: newActiveId,
      selectedNodeId: null,
      isDirty: false,
      isCodeHighlighted: false,
    });

    console.log('[Project] Deleted project:', projectId, deletedProject.name);
    if (newActiveId !== activeProjectId) {
      console.log('[Project] Switched to project:', newActiveId);
    }
  },
});
