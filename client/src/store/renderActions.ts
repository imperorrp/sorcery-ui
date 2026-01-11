/**
 * Render Actions Module
 * 
 * This module contains all actions related to rendering and code generation:
 * - Rendering components to AST
 * - Loading examples and example sets
 * - Applying AST changes back to source code
 */

import type { StateCreator } from 'zustand';
import type { StoreType, ComponentData } from './types';
import { initialWrapperCode } from './projectActions';
import { renderCodeToAst } from '@/lib/renderer';
import { updateStylesInCode } from '@/lib/styleUpdater';
import { updateClassNameInCode } from '@/lib/classNameUpdater';
import { examples, multiComponentExamples } from '@/examples/examples';
import { showNotification } from '@/components/ui/notification';

/**
 * Helper function to generate unique IDs
 */
const generateId = (): string => {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Create render actions slice
 * 
 * These actions handle the complete render lifecycle: from source code to AST,
 * visual editing, and finally back to formatted source code.
 */
export const createRenderActions: StateCreator<
  StoreType,
  [],
  [],
  Pick<
    StoreType,
    | 'renderActiveComponent'
    | 'setRenderOutput'
    | 'applyAstChangesToCode'
    | 'loadExample'
    | 'loadExampleSet'
  >
> = (set, get) => ({
  
  /**
   * Render the active component's code to AST
   * 
   * This is the main rendering pipeline:
   * 1. Takes the component's source code
   * 2. Transpiles and executes it twice (runtime + preview)
   * 3. Generates both ASTs
   * 4. Updates the store with the new ASTs
   * 
   * Handles all rendering errors and provides user feedback.
   */
  renderActiveComponent: async () => {
    console.log('[Render] renderActiveComponent called');
    
    const { projects, activeProjectId } = get();
    
    const project = activeProjectId ? projects[activeProjectId] : null;
    const activeComponentId = project?.activeComponentId ?? null;
    const component = activeComponentId && project 
      ? project.components[activeComponentId] 
      : null;
    
    console.log('[Render] Project:', project?.name);
    console.log('[Render] Component:', component?.name);
    
    if (!project) {
      console.error('[Render] No active project selected');
      showNotification({ type: 'error', title: 'No active project', message: 'Select or create a project before rendering.' });
      return;
    }
    
    if (!component) {
      console.error('[Render] No active component selected');
      showNotification({ type: 'error', title: 'No active component', message: 'Select a component before rendering.' });
      return;
    }

    const activeCode = component.code;
    
    console.log('[Render] Code length:', activeCode?.length);
    
    if (!activeCode) {
      console.error('[Render] Code editor is empty');
      showNotification({ type: 'error', title: 'Empty code', message: 'The code editor is empty. Please add or paste your component code before rendering.' });
      return;
    }

    try {
      set({ isRendering: true });
      
      const activeComponentPropsJson = component.propsJson || '{}';

      // renderCodeToAst needs access to all components for child component resolution
      const allComponents = project.components;

      const { runtimeAst, previewAst, jsxLocation } = await renderCodeToAst(
        activeCode,
        allComponents,
        activeComponentPropsJson
      );
      
      get().setRenderOutput(activeCode, runtimeAst, previewAst, jsxLocation);
      
      console.log('[Render] Successfully rendered component:', component.name);
    } catch (error: unknown) {
      console.error('[Render] Error rendering component:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showNotification({ type: 'error', title: 'Render Failed', message: `Error: ${errorMessage}`, details: error instanceof Error ? { stack: error.stack } : undefined });
    } finally {
      set({ isRendering: false });
    }
  },

  /**
   * Set the render output after successful transpilation
   * 
   * This is called by renderActiveComponent after the rendering pipeline completes.
   * It updates the component's ASTs, code, and resets the history stack.
   * 
   * @param code - The original source code string
   * @param runtimeAst - The interactive AST created with real React
   * @param previewAst - The safe AST created with shimmed React
   * @param jsxLocation - Location of the main JSX block for highlighting
   */
  setRenderOutput: (code, runtimeAst, previewAst, jsxLocation) => {
    const { projects, activeProjectId } = get();
    
    const project = activeProjectId ? projects[activeProjectId] : null;
    const activeComponentId = project?.activeComponentId ?? null;
    const component = activeComponentId && project 
      ? project.components[activeComponentId] 
      : null;
    
    if (!project || !activeProjectId || !component) {
      console.warn('[Render] Cannot set render output: no active component');
      return;
    }

    const { history, historyIndex } = component;

    // Add the new state to history, keeping only states up to current index + 1
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ast: runtimeAst, preview: previewAst });

    const updatedComponent = {
      ...component,
      code,
      jsxLocation,
      componentAst: runtimeAst,
      componentPreviewAst: previewAst,
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
      isDirty: false,
      isCodeHighlighted: false,
      selectedNodeId: null,
      lastOpenedTabId: null, // Clear transient open flag after render
    });

    console.log('[Render] Set render output for component:', component.name);
  },

  /**
   * Apply accumulated AST changes back to the original source code
   * 
   * This is the reverse of rendering: it takes the modified AST and generates
   * clean, formatted source code using our surgical updaters.
   * 
   * The process:
   * 1. Takes the preview AST (which has all the user's edits)
   * 2. Uses styleUpdater to apply style changes
   * 3. Uses classNameUpdater to apply className changes
   * 4. Updates the component's source code
   * 5. Highlights the changed code in the editor
   * 
   * @returns The updated code string, or null if update fails
   */
  applyAstChangesToCode: async (): Promise<string | null> => {
    const { projects, activeProjectId } = get();
    
    const project = activeProjectId ? projects[activeProjectId] : null;
    const activeComponentId = project?.activeComponentId ?? null;
    const component = activeComponentId && project 
      ? project.components[activeComponentId] 
      : null;
    
    if (!project || !activeProjectId || !component) {
      console.warn('[Render] Cannot apply changes: no active component');
      return null;
    }

    const { code: originalCode, componentPreviewAst } = component;

    if (!originalCode || !componentPreviewAst) {
      console.error('[Render] Apply changes aborted: missing original code or preview AST');
      return null;
    }

    try {
      // Chain the updaters: first apply styles, then className
      const codeWithStyles = await updateStylesInCode(originalCode, componentPreviewAst);
      const codeWithStylesAndClasses = await updateClassNameInCode(codeWithStyles, componentPreviewAst);

      const updatedComponent = {
        ...component,
        code: codeWithStylesAndClasses,
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
        isDirty: false,
        isCodeHighlighted: true,
      });
      
      console.log('[Render] Applied AST changes to code for component:', component.name);
      return codeWithStylesAndClasses;

    } catch (error) {
      console.error('[Render] Failed to apply style changes to code:', error);
      return null;
    }
  },

  /**
   * Load a single example by key
   * 
   * Examples can be either:
   * - Multi-component examples (defined in multiComponentExamples)
   * - Single-component examples (defined in examples)
   * 
   * Creates a new project from the example data.
   * 
   * @param key - The example key to load
   */
  loadExample: (key: string) => {
    // Check if it's a multi-component example first
    if (multiComponentExamples[key]) {
      const multiExample = multiComponentExamples[key];
      get().loadExampleSet(multiExample.components, multiExample.activeId);
      set({ currentExampleName: key });
      console.log('[Render] Loaded multi-component example:', key);
      return;
    }

    // Otherwise, check single-component examples
    const ex = examples[key as keyof typeof examples];
    if (ex) {
      const newId = `example-${key}`;
      const singleComp: Partial<ComponentData> = {
        id: newId,
        name: key,
        code: ex.code,
        propsJson: ex.props ? JSON.stringify(ex.props, null, 2) : '{}',
        dependencies: ex.dependency 
          ? (Array.isArray(ex.dependency) ? ex.dependency : [ex.dependency]) 
          : [],
      };
      get().loadExampleSet({ [newId]: singleComp }, newId);
      set({ currentExampleName: key });
      console.log('[Render] Loaded single-component example:', key);
    } else {
      console.warn('[Render] Example not found:', key);
    }
  },

  /**
   * Load an example set (multiple components) into a new project
   * 
   * This replaces the current components with a new set from an example.
   * It can accept either an array of ComponentData or a record of partial ComponentData.
   * 
   * Creates a new project containing all the example components.
   * 
   * @param componentsToLoad - Components to load (array or record format)
   * @param activeId - ID of the component to make active
   */
  loadExampleSet: (componentsToLoad, activeId) => {
    const { projects, activeProjectId, currentExampleName } = get();
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
          originalPropsJson: partial.propsJson || '{}',
          componentAst: null,
          componentPreviewAst: null,
          jsxLocation: null,
          dependencies: partial.dependencies || ['https://cdn.tailwindcss.com'],
          wrapperCode: initialWrapperCode,
          history: [{ ast: null, preview: null }],
          historyIndex: 0,
        };
      }
    }

    // Create or update the project with the new components
    const projectId = activeProjectId || generateId();
    const projectName = currentExampleName || 'Example Project';
    const now = Date.now();

    const newProject = {
      id: projectId,
      name: projectName,
      components: newComponents,
      activeComponentId: activeId,
      createdAt: projects[projectId]?.createdAt || now,
      updatedAt: now,
    };

    set({
      projects: {
        [projectId]: newProject,
      },
      activeProjectId: projectId,
      selectedNodeId: null,
      isDirty: false,
      isCodeHighlighted: false,
      examplesVersion: get().examplesVersion + 1,
    });

    console.log('[Render] Loaded example set:', Object.keys(newComponents).length, 'components into project:', projectName);
  },
});
