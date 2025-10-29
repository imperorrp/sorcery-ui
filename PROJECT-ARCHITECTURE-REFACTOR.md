# Project Architecture Refactor Guide

This document outlines the complete refactor to implement the Project layer in componentStore.ts.

## Summary

We're adding a **Project** layer as a first-class organizational structure. A Project contains multiple Components. The active component is scoped within the active project.

## Migration Strategy

The `initProjectLayer()` action will automatically wrap any existing legacy component-only data into a default project. This preserves backward compatibility.

## Progress Status

### ✅ Phase 1: Store Modularization (COMPLETED)

The store has been broken down into separate, focused modules:

1. **`types.ts`** ✅ - All TypeScript interfaces and types
   - SerializableElement, ComponentData, ProjectData
   - ComponentState, all action interfaces
   - Complete type safety for the entire store

2. **`projectActions.ts`** ✅ - Project management
   - initProjectLayer() - Migration from legacy structure
   - createProject, renameProject, setActiveProject, deleteProject
   - Full project lifecycle management

3. **`componentActions.ts`** ✅ - Component CRUD operations
   - addComponent, setActiveComponent, updateComponentName
   - deleteComponent, saveActiveCodeAsNewComponent
   - openComponent (for tab management)

4. **`selectors.ts`** ✅ - Computed getters
   - getActiveProject(), getActiveComponent(), getAllComponents()
   - Legacy computed properties for backward compatibility
   - All getters automatically track active project/component

### ✅ Phase 2: Remaining Store Modules (COMPLETED)

All action modules have been created and implemented:

5. **`astActions.ts`** ✅ - AST manipulation
   - setAst, setAstWithPreview
   - updateNodeStyle, updateNodeClassName, updateUtilityClass
   - undo, redo (project-scoped history)

6. **`renderActions.ts`** ✅ - Rendering and code generation
   - renderActiveComponent
   - setRenderOutput
   - applyAstChangesToCode
   - loadExample, loadExampleSet

7. **`configActions.ts`** ✅ - Configuration
   - setPropsJson
   - addDependency, removeDependency, setDependencies
   - setWrapperCode, setThemeCss, setTailwindConfig

8. **`uiActions.ts`** ✅ - UI state
   - setSelectedNodeId, setHoveredNodeId
   - setSelectionMode
   - setDirty, clearCodeHighlight

9. **`componentStore.ts`** ✅ - Main store composition
   - Combine all slices
   - Create initial state with default project
   - Export the composed store

### ✅ Phase 3: UI Components (COMPLETED)

All UI components have been created and integrated:

1. **ComponentSwitcher** ✅ (`client/src/components/ComponentSwitcher.tsx`)
   - Dropdown showing all components in active project
   - Search/filter capability
   - Integrated into CompactNavbar

2. **Update CompactNavbar** ✅
   - ComponentSwitcher added and functional
   - Shows current project context
   - Responsive design with mobile support

3. **Update LibraryPanel** ✅
   - Shows editable project name
   - Lists all components with active indicator (blue dot)
   - Full component CRUD operations
   - Project rename functionality

4. **Fix All Data Access Patterns** ✅
   - Updated 10+ UI components to use new project-based structure
   - Fixed: IframeCanvas, ComponentCanvas, StyleEditor, PropsEditor
   - Fixed: SetupEditor, InspectorPanel, DependenciesEditor
   - Fixed: ContextWrapperEditor, CodeEditorWithTabs
   - All components now correctly access `projects[projectId].components[componentId]`

### 🔄 Phase 4: Testing & Validation (IN PROGRESS)

Testing items to validate:

1. ✅ Migration from legacy structure (initProjectLayer implemented)
2. ⚠️ Test component switching updates all panels
3. ⚠️ Test undo/redo works per-component
4. ⚠️ Test example loading creates proper Projects
5. ⚠️ Test all CRUD operations
6. ⚠️ Test preview rendering with new architecture

## Architecture Benefits

### Modular Structure
- Each module has a single responsibility
- Easy to test individual modules
- Clear separation of concerns
- Smaller files are easier to maintain

### Type Safety
- All types in one place (`types.ts`)
- Strong typing throughout
- No circular dependencies

### Backward Compatibility
- Computed selectors maintain old API
- Existing code continues to work
- Non-breaking change for UI components

### Scalability
- Easy to add new actions to appropriate module
- Clear where to find specific functionality
- Project layer enables future multi-project features

## Next Steps

1. ✅ Create remaining action modules (astActions, renderActions, configActions, uiActions)
2. ✅ Compose main componentStore.ts
3. ⚠️ Test store functionality (needs verification)
4. ✅ Create UI components
5. ⚠️ Final integration testing (in progress)
6. ⏳ Update documentation (this file being updated)

## Implementation Summary

### What Was Completed

1. **Full Store Modularization**: Broke down 900+ line monolithic store into 9 focused modules
2. **Project Layer Implementation**: Added ProjectData type with full CRUD operations
3. **UI Component Integration**: Created ComponentSwitcher and updated all 10+ UI components
4. **Critical Bug Fixes**: Fixed data access patterns throughout the application
   - The preview wasn't working because UI components were accessing the old flat structure
   - Fixed all components to use new nested project structure: `projects[projectId].components[componentId]`

### Known Issues Fixed

- ✅ Circular dependency in store initialization
- ✅ Infinite loop from subscription system
- ✅ Infinite loop from getter functions returning new object references
- ✅ Preview not rendering due to incorrect data access patterns
- ✅ All UI components using old `s.components[s.activeComponentId]` pattern

### Current State

The project architecture refactor is **functionally complete**. All code changes have been implemented:
- Store is fully modular and type-safe
- UI components correctly access nested project structure
- ComponentSwitcher provides global component navigation
- LibraryPanel shows project name and component list

### Testing Needed

The application should now work correctly, but needs manual testing to verify:
1. Preview rendering works after component code changes
2. Component switching updates all panels correctly
3. Undo/redo history is maintained per-component
4. Example loading creates proper project structures
5. All CRUD operations work as expected

## Notes

- The old componentStore.ts will be completely replaced
- All existing component-level actions continue to work
- The store is the only major code change needed
- UI updates are additive (new components + minor updates)
- Migration happens automatically on first load
