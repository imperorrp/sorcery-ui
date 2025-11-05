/**
 * Component Store - Modular Architecture
 * 
 * This is the main store file that composes all the modular slices into a single Zustand store.
 * 
 * Architecture:
 * - Project-based organization (multiple components per project)
 * - Modular action slices for maintainability
 * - Type-safe throughout with centralized types
 * - Backward-compatible computed getters
 * - Non-destructive code updates preserving component logic
 * 
 * Store Modules:
 * - types.ts: All TypeScript interfaces and types
 * - projectActions.ts: Project lifecycle management
 * - componentActions.ts: Component CRUD operations
 * - astActions.ts: AST manipulation and undo/redo
 * - renderActions.ts: Rendering and code generation
 * - configActions.ts: Configuration management
 * - uiActions.ts: UI state management
 * - selectors.ts: Computed getters
 */

import { create } from 'zustand';
import type { StoreType, ProjectData, ComponentData, ComponentSchema } from './types';
import { createProjectActions, initialWrapperCode } from './projectActions';
import { createComponentActions } from './componentActions';
import { createASTActions } from './astActions';
import { createRenderActions } from './renderActions';
import { createConfigActions } from './configActions';
import { createUIActions } from './uiActions';
import { createSelectors } from './selectors';
import { defaultExample } from '@/examples/examples';

/**
 * Helper function to generate unique IDs
 */
const generateId = (): string => {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Create the initial default component
 * 
 * This is used when the application first loads or when creating new components.
 */
const createDefaultComponent = (id: string = generateId()): ComponentData => ({
  id,
  name: 'Untitled Component',
  code: defaultExample.code,
  componentAst: null,
  componentPreviewAst: null,
  componentSchemaAst: null,
  jsxLocation: null,
  propsJson: JSON.stringify(defaultExample.props || {}, null, 2),
  originalPropsJson: JSON.stringify(defaultExample.props || {}, null, 2),
  dependencies: defaultExample.dependency 
    ? (Array.isArray(defaultExample.dependency) ? defaultExample.dependency : [defaultExample.dependency]) 
    : ['https://cdn.tailwindcss.com'],
  wrapperCode: initialWrapperCode,
  history: [{ ast: null, preview: null }],
  historyIndex: 0,
});

/**
 * Create the initial default project
 * 
 * Every workspace starts with at least one project containing one component.
 */
const createDefaultProject = (): ProjectData => {
  const defaultComponentId = generateId();
  const defaultComponent = createDefaultComponent(defaultComponentId);
  const defaultProjectId = generateId();
  const now = Date.now();

  return {
    id: defaultProjectId,
    name: 'Untitled Project',
    components: {
      [defaultComponentId]: defaultComponent,
    },
    activeComponentId: defaultComponentId,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Initial store state
 * 
 * Sets up the default project structure and global UI state.
 */
const getInitialState = () => {
  const defaultProject = createDefaultProject();
  
  return {
    // Project layer
    projects: { [defaultProject.id]: defaultProject },
    activeProjectId: defaultProject.id,
    
    // Global UI state
    selectedNodeId: null as string | null,
    hoveredNodeId: null as string | null,
    selectionMode: 'interact' as 'interact' | 'select',
    isDirty: false,
    isCodeHighlighted: false,
    isRendering: false,
    selectedComponentMetadata: null as ComponentSchema | null,
    
    // Example tracking
    examplesVersion: 0,
    currentExampleName: null as string | null,
    lastOpenedTabId: null as string | null,
    
    // Global configuration
    themeCss: `@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer utilities {
  .bg-background { background-color: hsl(var(--background)); }
  .bg-card { background-color: hsl(var(--card)); }
  .bg-popover { background-color: hsl(var(--popover)); }
  .bg-muted { background-color: hsl(var(--muted)); }
  .bg-accent { background-color: hsl(var(--accent)); }

  .text-foreground { color: hsl(var(--foreground)); }
  .text-muted-foreground { color: hsl(var(--muted-foreground)); }
  .text-accent-foreground { color: hsl(var(--accent-foreground)); }
  .text-primary { color: hsl(var(--primary)); }

  .text-popover-foreground { color: hsl(var(--popover-foreground)); }

  .border-border { border-color: hsl(var(--border)); }

  .ring-offset-background { --tw-ring-offset-color: hsl(var(--background)); }
}`,
    tailwindConfig: `{
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      }
    }
  }
}`,
  };
};

/**
 * Create the Zustand store
 * 
 * Composes all action slices and selectors into a single store.
 * The store is fully typed and provides all functionality through modular slices.
 */
export const useComponentStore = create<StoreType>()((set, get, store) => ({
  // Initial state
  ...getInitialState(),
  
  // Compose all action slices
  ...createProjectActions(set, get, store),
  ...createComponentActions(set, get, store),
  ...createASTActions(set, get, store),
  ...createRenderActions(set, get, store),
  ...createConfigActions(set, get, store),
  ...createUIActions(set, get, store),
  ...createSelectors(set, get, store),
}));

/**
 * Initialize the project layer and migrate legacy data
 * 
 * This ensures any legacy data is migrated to the new project structure.
 * Called once when the module is loaded.
 */
setTimeout(() => {
  try {
    useComponentStore.getState().initProjectLayer();
    console.log('[Store] Component store initialized with project layer');
  } catch (error) {
    console.error('[Store] Failed to initialize project layer:', error);
  }
}, 0);

/**
 * NOTE: Legacy computed properties (componentAst, history, etc.) are defined
 * as static placeholders in selectors.ts. They are NOT automatically synced.
 * 
 * Components should use getActiveComponent() to access current component data:
 *   const activeComponent = useComponentStore((s) => s.getActiveComponent?.());
 *   const componentAst = activeComponent?.componentAst;
 * 
 * The old flat access pattern (store.componentAst) is deprecated but still
 * present for backward compatibility during migration.
 */

// Export types for convenience
export type { ComponentData, ProjectData, SerializableElement } from './types';


