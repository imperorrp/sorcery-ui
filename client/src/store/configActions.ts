/**
 * Configuration Actions Module
 * 
 * This module contains all actions related to component and application configuration:
 * - Mock props management
 * - Dependencies (external CDN URLs)
 * - Wrapper code (context providers)
 * - Theme CSS and Tailwind configuration
 */

import type { StateCreator } from 'zustand';
import type { StoreType } from './types';

/**
 * Create configuration actions slice
 * 
 * These actions manage configuration for the active component and global settings.
 */
export const createConfigActions: StateCreator<
  StoreType,
  [],
  [],
  Pick<
    StoreType,
    | 'setPropsJson'
    | 'addDependency'
    | 'removeDependency'
    | 'setDependencies'
    | 'setWrapperCode'
    | 'setThemeCss'
    | 'setTailwindConfig'
  >
> = (set, get) => ({
  
  /**
   * Set the mock props JSON for the active component
   * 
   * Props are stored as a JSON string that gets parsed during rendering.
   * 
   * @param json - JSON string representing the component's props
   */
  setPropsJson: (json: string) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();
    
    if (!project || !activeProjectId || !component) {
      console.warn('[Config] Cannot set props: no active component');
      return;
    }

    const updatedComponent = {
      ...component,
      propsJson: json,
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
    });

    console.log('[Config] Updated props JSON for component:', component.name);
  },

  /**
   * Add a dependency URL to the active component
   * 
   * Dependencies are external CDN URLs (e.g., React libraries) that will be
   * injected into the iframe for the component to use.
   * 
   * @param url - CDN URL to add
   */
  addDependency: (url: string) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();
    
    if (!project || !activeProjectId || !component) {
      console.warn('[Config] Cannot add dependency: no active component');
      return;
    }

    // Avoid duplicates
    if (component.dependencies.includes(url)) {
      console.warn('[Config] Dependency already exists:', url);
      return;
    }

    const updatedComponent = {
      ...component,
      dependencies: [...component.dependencies, url],
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
    });

    console.log('[Config] Added dependency:', url);
  },

  /**
   * Remove a dependency URL from the active component
   * 
   * @param url - CDN URL to remove
   */
  removeDependency: (url: string) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();
    
    if (!project || !activeProjectId || !component) {
      console.warn('[Config] Cannot remove dependency: no active component');
      return;
    }

    const updatedComponent = {
      ...component,
      dependencies: component.dependencies.filter(d => d !== url),
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
    });

    console.log('[Config] Removed dependency:', url);
  },

  /**
   * Set the complete list of dependencies for the active component
   * 
   * Replaces the entire dependencies array.
   * 
   * @param urls - Array of CDN URLs
   */
  setDependencies: (urls: string[]) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();
    
    if (!project || !activeProjectId || !component) {
      console.warn('[Config] Cannot set dependencies: no active component');
      return;
    }

    const updatedComponent = {
      ...component,
      dependencies: urls,
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
    });

    console.log('[Config] Set dependencies:', urls.length, 'URLs');
  },

  /**
   * Set the wrapper code for the active component
   * 
   * Wrapper code provides context providers (e.g., ThemeProvider, Redux Provider)
   * that the component may need.
   * 
   * @param code - The wrapper component code
   */
  setWrapperCode: (code: string) => {
    const { projects, activeProjectId, getActiveProject, getActiveComponent } = get();
    const project = getActiveProject();
    const component = getActiveComponent();
    
    if (!project || !activeProjectId || !component) {
      console.warn('[Config] Cannot set wrapper code: no active component');
      return;
    }

    const updatedComponent = {
      ...component,
      wrapperCode: code,
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
    });

    console.log('[Config] Updated wrapper code for component:', component.name);
  },

  /**
   * Set the global theme CSS
   * 
   * Theme CSS contains CSS variables and arbitrary global styles.
   * This is global (not per-component).
   * 
   * @param css - The CSS string
   */
  setThemeCss: (css: string) => {
    set({ themeCss: css });
    console.log('[Config] Updated theme CSS');
  },

  /**
   * Set the global Tailwind configuration
   * 
   * Tailwind config is a JavaScript object string that defines the Tailwind theme.
   * This is global (not per-component).
   * 
   * @param config - The Tailwind config string
   */
  setTailwindConfig: (config: string) => {
    set({ tailwindConfig: config });
    console.log('[Config] Updated Tailwind config');
  },
});
