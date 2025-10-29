/**
 * Component Store Tests
 * 
 * Tests for the Zustand store state management.
 * Verifies project/component CRUD operations and state integrity.
 */

import { describe, it, expect } from 'vitest';
import { useComponentStore } from '../componentStore';
import type { SerializableElement } from '../types';

describe('componentStore', () => {
  describe('Initial State', () => {
    it('should have a default project on initialization', () => {
      const state = useComponentStore.getState();
      
      expect(state.activeProjectId).toBeDefined();
      expect(state.projects).toBeDefined();
      expect(Object.keys(state.projects).length).toBeGreaterThan(0);
    });

    it('should have at least one component in the default project', () => {
      const state = useComponentStore.getState();
      const projectId = state.activeProjectId!;
      const project = state.projects[projectId];
      
      expect(project).toBeDefined();
      expect(project.components).toBeDefined();
      expect(Object.keys(project.components).length).toBeGreaterThan(0);
    });

    it('should have an active component in the default project', () => {
      const state = useComponentStore.getState();
      const projectId = state.activeProjectId!;
      const project = state.projects[projectId];
      
      expect(project.activeComponentId).toBeDefined();
      expect(project.components[project.activeComponentId!]).toBeDefined();
    });
  });

  describe('Project Management', () => {
    it('should create a new project', () => {
      const store = useComponentStore.getState();
      const initialProjectCount = Object.keys(store.projects).length;
      
      const newProjectId = store.createProject('Test Project');
      
      expect(newProjectId).toBeDefined();
      expect(Object.keys(useComponentStore.getState().projects).length).toBe(initialProjectCount + 1);
      expect(useComponentStore.getState().projects[newProjectId].name).toBe('Test Project');
    });

    it('should set active project', () => {
      const store = useComponentStore.getState();
      const newProjectId = store.createProject('Test Project');
      
      store.setActiveProject(newProjectId);
      
      const state = useComponentStore.getState();
      expect(state.activeProjectId).toBe(newProjectId);
    });

    it('should rename a project', () => {
      const store = useComponentStore.getState();
      const projectId = store.createProject('Original Name');
      
      store.renameProject(projectId, 'Updated Name');
      
      const state = useComponentStore.getState();
      expect(state.projects[projectId].name).toBe('Updated Name');
    });

    it('should delete a project', () => {
      const store = useComponentStore.getState();
      const projectId = store.createProject('To Delete');
      
      // Capture count AFTER creating the project to delete
      const countBeforeDelete = Object.keys(useComponentStore.getState().projects).length;
      
      store.deleteProject(projectId);
      
      const state = useComponentStore.getState();
      expect(Object.keys(state.projects).length).toBe(countBeforeDelete - 1);
      expect(state.projects[projectId]).toBeUndefined();
    });
  });

  describe('Component Management', () => {
    it('should add a component to the active project', () => {
      const store = useComponentStore.getState();
      const projectId = store.activeProjectId!;
      const initialComponentCount = Object.keys(store.projects[projectId].components).length;
      
      store.addComponent();
      
      const state = useComponentStore.getState();
      const components = state.projects[projectId].components;
      expect(Object.keys(components).length).toBe(initialComponentCount + 1);
    });

    it('should set active component', () => {
      const store = useComponentStore.getState();
      const projectId = store.activeProjectId!;
      
      // Add a new component
      store.addComponent();
      
      // Get the newly added component ID
      const state = useComponentStore.getState();
      const componentIds = Object.keys(state.projects[projectId].components);
      const newComponentId = componentIds[componentIds.length - 1];
      
      store.setActiveComponent(newComponentId);
      
      const updatedState = useComponentStore.getState();
      expect(updatedState.projects[projectId].activeComponentId).toBe(newComponentId);
    });

    it('should update active component code', () => {
      const store = useComponentStore.getState();
      
      const newCode = 'const Test = () => <div>New Code</div>;';
      store.updateActiveComponentCode(newCode);
      
      const state = useComponentStore.getState();
      const activeComponent = state.getActiveComponent();
      expect(activeComponent?.code).toBe(newCode);
    });

    it('should update component name', () => {
      const store = useComponentStore.getState();
      const projectId = store.activeProjectId!;
      const activeComponentId = store.projects[projectId].activeComponentId!;
      
      store.updateComponentName(activeComponentId, 'Updated Name');
      
      const state = useComponentStore.getState();
      const component = state.projects[projectId].components[activeComponentId];
      expect(component.name).toBe('Updated Name');
    });

    it('should delete a component', () => {
      const store = useComponentStore.getState();
      const projectId = store.activeProjectId!;
      
      // Add a component to delete
      store.addComponent();
      const state1 = useComponentStore.getState();
      const componentIds = Object.keys(state1.projects[projectId].components);
      const componentToDelete = componentIds[componentIds.length - 1];
      const initialCount = componentIds.length;
      
      store.deleteComponent(componentToDelete);
      
      const state2 = useComponentStore.getState();
      const components = state2.projects[projectId].components;
      expect(Object.keys(components).length).toBe(initialCount - 1);
      expect(components[componentToDelete]).toBeUndefined();
    });
  });

  describe('AST Management', () => {
    it('should set component AST', () => {
      const store = useComponentStore.getState();
      
      const mockAst = {
        id: '1',
        type: 'div',
        props: { children: ['Test'] },
      };
      
      store.setAst(mockAst);
      
      const state = useComponentStore.getState();
      const activeComponent = state.getActiveComponent();
      expect(activeComponent?.componentAst).toEqual(mockAst);
    });

    it('should set both AST and preview AST', () => {
      const store = useComponentStore.getState();
      
      const mockAst = {
        id: '1',
        type: 'div',
        props: { children: ['Test'] },
      };
      const mockPreviewAst = {
        id: '1',
        type: 'div',
        props: { children: ['Preview'] },
      };
      
      store.setAstWithPreview(mockAst, mockPreviewAst);
      
      const state = useComponentStore.getState();
      const activeComponent = state.getActiveComponent();
      expect(activeComponent?.componentAst).toEqual(mockAst);
      expect(activeComponent?.componentPreviewAst).toEqual(mockPreviewAst);
    });
  });

  describe('History Management', () => {
    it('should undo to previous state', () => {
      const store = useComponentStore.getState();
      
      // Set up initial AST
      const initialAst = { 
        id: 'root', 
        type: 'div', 
        props: { 
          children: [
            { id: '1', type: 'div', props: { children: ['First'] } }
          ] 
        } 
      };
      
      store.setAstWithPreview(initialAst, initialAst);
      
      // Make a change using updateNodeStyle (which appends to history)
      store.updateNodeStyle('1', { color: 'red' });
      store.updateNodeStyle('1', { color: 'blue' });
      
      // Verify we have the latest change
      let activeComponent = useComponentStore.getState().getActiveComponent();
      const node = activeComponent?.componentAst?.props.children?.[0] as SerializableElement;
      expect(node?.props.style?.color).toBe('blue');
      
      // Undo should go back to red
      store.undo();
      
      activeComponent = useComponentStore.getState().getActiveComponent();
      const nodeAfterUndo = activeComponent?.componentAst?.props.children?.[0] as SerializableElement;
      expect(nodeAfterUndo?.props.style?.color).toBe('red');
    });

    it('should redo to next state', () => {
      const store = useComponentStore.getState();
      
      const ast1 = { id: '1', type: 'div', props: { children: [] } };
      const ast2 = { id: '2', type: 'span', props: { children: [] } };
      
      store.setAst(ast1);
      store.setAst(ast2);
      
      store.undo();
      store.redo();
      
      const activeComponent = useComponentStore.getState().getActiveComponent();
      expect(activeComponent?.componentAst).toEqual(ast2);
    });
  });

  describe('Configuration Management', () => {
    it('should set props JSON', () => {
      const store = useComponentStore.getState();
      
      const newPropsJson = JSON.stringify({ title: 'Test Title' }, null, 2);
      store.setPropsJson(newPropsJson);
      
      const state = useComponentStore.getState();
      const activeComponent = state.getActiveComponent();
      expect(activeComponent?.propsJson).toBe(newPropsJson);
    });

    it('should set dependencies', () => {
      const store = useComponentStore.getState();
      
      const newDeps = ['https://cdn.example.com/lib.js'];
      store.setDependencies(newDeps);
      
      const state = useComponentStore.getState();
      const activeComponent = state.getActiveComponent();
      expect(activeComponent?.dependencies).toEqual(newDeps);
    });

    it('should set wrapper code', () => {
      const store = useComponentStore.getState();
      
      const newWrapper = '({ children }) => <ThemeProvider>{children}</ThemeProvider>';
      store.setWrapperCode(newWrapper);
      
      const state = useComponentStore.getState();
      const activeComponent = state.getActiveComponent();
      expect(activeComponent?.wrapperCode).toBe(newWrapper);
    });
  });

  describe('Selectors', () => {
    it('should get active project via selector', () => {
      const store = useComponentStore.getState();
      const project = store.getActiveProject();
      
      expect(project).toBeDefined();
      expect(project?.id).toBe(store.activeProjectId);
    });

    it('should get active component via selector', () => {
      const store = useComponentStore.getState();
      const component = store.getActiveComponent();
      
      expect(component).toBeDefined();
      expect(component?.id).toBeDefined();
    });

    it('should get all components via selector', () => {
      const store = useComponentStore.getState();
      const components = store.getAllComponents();
      
      expect(Array.isArray(components)).toBe(true);
      expect(components.length).toBeGreaterThan(0);
    });
  });
});


