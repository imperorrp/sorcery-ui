/**
 * Selectors Module
 * 
 * This module provides computed getters that derive values from the store state.
 * These selectors maintain backward compatibility with the old flat component structure
 * while enabling the new project-based architecture.
 */

import type { StateCreator } from 'zustand';
import type { StoreType } from './types';
import { initialWrapperCode } from './projectActions';

/**
 * Create selectors slice
 * 
 * These are getter functions that compute derived state from the base state.
 * They're implemented as getters so they always return fresh data.
 */
export const createSelectors: StateCreator<
  StoreType,
  [],
  [],
  Pick<
    StoreType,
    | 'getActiveProject'
    | 'getActiveComponent'
    | 'getAllComponents'
    | 'componentAst'
    | 'componentPreviewAst'
    | 'history'
    | 'historyIndex'
    | 'propsJson'
    | 'dependencies'
    | 'wrapperCode'
    | 'originalCode'
    | 'jsxLocation'
  >
> = (_set, get) => {
  
  return {
    /**
     * Get the currently active project
     * 
     * @returns The active ProjectData or null if none is active
     */
    getActiveProject: () => {
      const state = get();
      if (!state.activeProjectId) return null;
      return state.projects[state.activeProjectId] ?? null;
    },

    /**
     * Get the currently active component
     * 
     * @returns The active ComponentData or null if none is active
     */
    getActiveComponent: () => {
      const state = get();
      if (!state.activeProjectId) return null;
      const project = state.projects[state.activeProjectId];
      if (!project || !project.activeComponentId) return null;
      return project.components[project.activeComponentId] ?? null;
    },

    /**
     * Get all components in the active project
     * 
     * @returns Array of ComponentData for all components in the active project
     */
    getAllComponents: () => {
      const state = get();
      if (!state.activeProjectId) return [];
      const project = state.projects[state.activeProjectId];
      if (!project) return [];
      return Object.values(project.components);
    },

    // Legacy computed properties for backward compatibility
    // These derive from the active component to maintain existing API
    // Note: These are now regular properties (not getters) to avoid initialization issues

    /**
     * Get the runtime AST of the active component
     * @deprecated Use getActiveComponent().componentAst instead
     */
    componentAst: null as StoreType['componentAst'],

    /**
     * Get the preview AST of the active component
     * @deprecated Use getActiveComponent().componentPreviewAst instead
     */
    componentPreviewAst: null as StoreType['componentPreviewAst'],

    /**
     * Get the history stack of the active component
     * @deprecated Use getActiveComponent().history instead
     */
    history: [{ ast: null, preview: null }] as StoreType['history'],

    /**
     * Get the history index of the active component
     * @deprecated Use getActiveComponent().historyIndex instead
     */
    historyIndex: 0 as StoreType['historyIndex'],

    /**
     * Get the props JSON of the active component
     * @deprecated Use getActiveComponent().propsJson instead
     */
    propsJson: '{}' as StoreType['propsJson'],

    /**
     * Get the dependencies of the active component
     * @deprecated Use getActiveComponent().dependencies instead
     */
    dependencies: [] as StoreType['dependencies'],

    /**
     * Get the wrapper code of the active component
     * @deprecated Use getActiveComponent().wrapperCode instead
     */
    wrapperCode: initialWrapperCode as StoreType['wrapperCode'],

    /**
     * Get the original source code of the active component
     * @deprecated Use getActiveComponent().code instead
     */
    originalCode: null as StoreType['originalCode'],

    /**
     * Get the JSX location of the active component
     * @deprecated Use getActiveComponent().jsxLocation instead
     */
    jsxLocation: null as StoreType['jsxLocation'],
  };
};
