# Codebase Summary: Live Component Editor

This document provides a summary of the "Live Component Editor" codebase, outlining its architecture, the purpose of each major file and folder, and the core data flow.

- `LibraryPanel.tsx`: **NEW (v1.2)** - Comprehensive component library management panel with full CRUD functionality (add, rename, delete, switch between components)
- `ComponentList.tsx`: **NEW (v1.2)** - Placeholder for future component list interface (currently unused)architecture, the purpose of each major file and folder, and the core data flow.

## Overall Architecture

The application is a monorepo containing a React client and a Node.js/Express server. The core of the application lies in its client-side architecture, which is a sophisticated hybrid model. It uses **Visual ASTs** (serialized from the Virtual DOM) for real-time rendering and interaction, and a **Source Code AST** (parsed by Babel) for non-destructive, logic-preserving code updates.

### Primary Workflow

The application operates on a sophisticated Three-AST system to ensure both a fluid visual editing experience and a non-destructive code update process that preserves component logic.

- **Code Input**: A developer pastes React component code (TSX/JSX) into the Monaco Editor.
- **Dual Visual AST Generation**: When "Render" is clicked, the renderer.ts utility transpiles and executes the code twice:
  - `componentPreviewAst`: Created using a shimmed version of React, this is a complete, structurally-sound "map" of the component. It is used to render the read-only Navigator tree and acts as the blueprint for applying style changes.
  - `componentAst`: Created using the real React library, this is the "live" version of the component that can manage its own state and interactivity. It is rendered in the iframe's "Interaction Mode".
  - Both of these visual ASTs are stored in the central Zustand store.
- **Smart Selection & Component Boundaries**: The system implements "Smart Selection" by pruning child components from the preview AST to enforce component boundaries. This prevents users from selecting and editing elements that belong to child components, maintaining clear separation between components and their dependencies. **NEW**: Advanced drill-down selection allows users to Shift+click on overlapping elements to see all layers and select specific elements from a visual menu.
- **Visual Editing Loop**: When the user modifies a style in the Inspector, the updateNodeStyle action creates new, updated copies of both visual ASTs in the store. This change is instantly reflected in the sandboxed <iframe>.
- **Reconciliation via a Temporary Source AST**: When "Apply Changes" is clicked, the application's core architectural principle is revealed:
  - The styleUpdater.ts utility takes the originalCode string and creates a temporary, highly-detailed Babel AST. This Source AST understands all component logic, including event handlers and hooks.
  - It then traverses this temporary Babel AST and the componentPreviewAst in parallel, matching elements by their structure.
  - It surgically modifies only the style attribute of the corresponding nodes within the Babel AST, leaving all other code and logic untouched.
  - @babel/generator converts this modified Babel AST back into a clean code string.
  - This new string replaces the originalCode in the store, completing the cycle non-destructively.

This architecture treats the user's Source Code as the ultimate source of truth for logic, while using the Visual ASTs as the source of truth for UI state and interaction.

**Key Features:**
- Advanced drill-down selection system for overlapping elements (Shift+click)
- Comprehensive debug logging for selection state tracking
- Context isolation fixes for iframe-to-parent window store access
- Enhanced visual feedback with live element highlighting
- Improved documentation with JSDoc comments throughout the codebase
- Missing component detection system with automatic mock generation
- Global scope injection for reliable component resolution
- Enhanced example system with categorized examples and missing component demo
- Multi-component tab system with overflow management and drag-and-drop
- Floating dock for panel visibility controls
- Fullscreen mode with automatic panel hiding
- Comprehensive component library management with CRUD operations

## Directory and File Breakdown

### `imperorrp-runable-task/` (Root)

- `package.json`: Defines the npm workspaces for client and server and contains scripts to run both concurrently.
- `README.md`: High-level overview of the project, features, and setup instructions.
- `PLAN.md`: A detailed technical planning document outlining the architecture, feature specifications, and development roadmap.
- `.github/prompts/usefulprompts.prompt.md`: AI prompt template for automated codebase analysis and documentation updates.

### `client/`

This directory contains the entire frontend React application, built with Vite. The main source code for the React application.

#### `main.tsx` & `App.tsx`

- `main.tsx`: The entry point of the application, responsible for rendering the App component into the DOM.
- `App.tsx`: The root component. It sets up the ThemeProvider for light/dark mode and renders the main Navbar and EditorLayout.

#### `store/`

- `componentStore.ts`: This is the most critical state management file. It uses Zustand to create a global store that holds:
  - `components`: A map of component IDs to their data, supporting multiple components in a library
  - `activeComponentId`: The ID of the component currently being edited
  - `selectedNodeId`: The ID of the currently selected element
  - `selectionMode`: Either 'interact' or 'select' mode for the canvas
  - `isDirty`: A flag indicating that visual changes have been made but not yet applied to the source code
  - `isCodeHighlighted`: A flag to control the persistent highlighting in the code editor after changes are applied
  - `examplesVersion`: Incremented when example sets are loaded to notify UI
  - `lastOpenedTabId`: Transient flag for tracking explicitly opened components
  - For each component (`ComponentData`):
    - `componentAst`: The "Live AST" created with the real React library. It is rendered in "Interaction Mode" and allows the component to be fully stateful
    - `componentPreviewAst`: The "Preview AST" created with a shimmed React. This is a structurally complete map of the component used for the Navigator and as the blueprint for style updates
    - `code`: The user's source code string, which is treated as the source of truth for all component logic
    - `jsxLocation`: The character start/end position of the JSX block within the code
    - `propsJson`: JSON string for mock props
    - `dependencies`: Array of external dependency URLs
    - `wrapperCode`: Code for context wrapper components
    - `history`: An array of AST snapshots for undo/redo functionality
    - `historyIndex`: Current position in the history stack
  - Key methods: `setRenderOutput` (initializes both ASTs after rendering), `updateNodeStyle` (applies style changes with proper immutable updates within set() callback), `applyAstChangesToCode` (surgical code updates), `undo`/`redo` (history management), plus multi-component management methods like `addComponent`, `setActiveComponent`, `deleteComponent`, etc.

#### `lib/`

- `renderer.ts`: Contains the crucial `renderCodeToAst` function. This orchestrates the initial code processing pipeline by transpiling the user's code and calling the parser to generate the two distinct visual ASTs (`componentAst` and `componentPreviewAst`). Implements Smart Selection by pruning child components from the preview AST to enforce component boundaries, and handles local component imports with dynamic resolution. Includes automatic mock generation for missing components used in JSX but not imported or available in the library, using global scope injection for reliable component resolution during execution.
- `componentParser.ts`: Handles the serialization from React Elements into our custom `SerializableElement` AST format (`serializeComponent`), and the deserialization from our AST back into renderable React Elements (`renderFromAst`). Includes robust handling of all React children types using `React.Children.toArray()` and wraps custom components in selectable spans with `display: 'contents'` for proper selection behavior.
- `styleUpdater.ts`: (Critical Architectural File) Implements the "Apply Changes" logic. It takes the user's original source code and the `componentPreviewAst`, parses the code into a temporary Babel AST, and surgically modifies only the style attributes of the corresponding nodes. This non-destructive approach is the key to preserving all component logic like onClick handlers and state.
- `codeUpdater.ts`: Alternative implementation of style updating using surgical string replacement approach (currently unused).
- `astToCode.ts`: Utility for converting `SerializableElement` AST nodes back into formatted JSX code strings. Includes Prettier integration for clean code generation. Used for code generation workflows.
- `attributeUpdater.ts`: Unified surgical code modification system that applies visual style and className changes back to source code non-destructively using AST-based structural matching.
- `classNameUpdater.ts`: Surgical code modification system focused on applying visual className changes back to source code non-destructively using AST-based structural matching.
- `tailwindParser.ts`: Utility for parsing and manipulating Tailwind CSS classes, enabling structured editing of className strings through categorized properties.
- `utils.ts`: Contains shared utility functions, such as `cn` for merging Tailwind CSS classes.

#### `hooks/`

- `useDebounce.ts`: Custom hook for debouncing user input to prevent excessive re-renders and API calls.
- `useResizableLayout.ts`: Custom hook that manages the resizable layout state for the editor panels, including panel sizes, minimization states, and resize handlers.

#### `polyfills/`

- `processShim.ts`: Browser polyfill for Node.js `process` global object, required for Babel packages to work in the browser environment.

#### `components/`

- `Navbar.tsx`: Navigation bar component with theme toggle functionality and app branding.
- `EditorLayout.tsx`: The main UI component that assembles the different panels (Library, Navigator, Code Editor, Component Preview, Style Editor). It manages the resizing and collapsing state for these panels using react-resizable-panels. It also triggers the rendering process by calling `renderCodeToAst` and handles example loading. Includes active component selectors for proper multi-component data access, fullscreen mode with automatic panel hiding, floating dock for panel visibility controls, and enhanced layout management with persistent preferences.

##### `Canvas/`

- `ComponentCanvas.tsx`: Acts as a container for the rendered component. It renders `IframeCanvas` and is responsible for displaying the `SelectionHighlighter` overlay when an element is selected.
- `IframeCanvas.tsx`: A key component that creates a sandboxed `<iframe>` for rendering. It uses `createPortal` to render the component AST into the iframe's document body. Includes dependency injection with stabilization to prevent infinite loops, enhanced selection handling for custom components, and AST sanitization for error handling. **NEW**: Features an advanced drill-down selection system with Shift+click for overlapping elements, visual layer indicators, live element highlighting, and proper context bridging between iframe and parent window for store access.
- `SelectionHighlighter.tsx`: An unused component, with the active implementation located inside `ComponentCanvas.tsx` for more accurate positioning.

##### `CodeEditor/`

- `MonacoEditor.tsx`: Integrates the Monaco Editor, providing a rich code editing experience with TSX/JSX support. It exposes a ref to get the current code and supports code range highlighting for JSX element inspection.
- `CodeEditorWithTabs.tsx`: Combines Monaco editor with integrated tab system for multi-component editing experience
- `ComponentTabs.tsx`: IDE-style component tab bar with overflow management, drag-and-drop reordering, and integrated library access
- `ExamplesDropdown.tsx`: Placeholder for future example loading interface (currently unused)

##### `Inspector/`

- `InspectorPanel.tsx`: The right-hand panel that contains tabs for editing. It includes the Undo/Redo buttons and the master "Apply Changes" button.
- `StyleEditor.tsx`: Displays input fields (e.g., color pickers, text inputs) to modify the CSS properties of the selected element. Changes are propagated to the Zustand store via the `updateNodeStyle` action. Includes smart component boundary detection to prevent editing child components and real-time visual feedback.
- `PropsEditor.tsx`: Provides a textarea for the user to input a JSON object, which is then used as props for the root component during rendering.
- `SetupEditor.tsx`: Allows the user to add external CDN dependency URLs, which are injected as <script> tags into the sandboxed <iframe>. It also provides a code editor for defining a custom wrapper component (e.g., for theme or Redux providers).
- `ClassNameEditor.tsx`: UI component for managing element className with visual controls. Provides an input field to edit CSS classes and dropdown menus for common Tailwind utilities like padding, margin, colors, typography, and display properties.
- `ConfigurerPanel.tsx`: Tabbed interface for component configuration with tabs for Props, Global CSS, Context Wrapper, and External Dependencies editors.
- `ContextWrapperEditor.tsx`: Monaco editor interface for defining React context wrapper components that wrap the main component during rendering.
- `DependenciesEditor.tsx`: Interface for managing external CDN dependencies that are loaded in the preview iframe for component rendering.
- `GlobalCssEditor.tsx`: Monaco editor interface for defining global CSS styles and utility classes available in the sandboxed iframe.

##### `Navigator/`

- `ComponentTree.tsx`: Displays a collapsible tree view of the component's structure based on the `componentPreviewAst`. It allows for selecting elements, which updates the `selectedNodeId` in the store. Includes smooth scrolling to selected elements and visual selection feedback.
- `ComponentLibrary.tsx`: Simple component list interface for switching between components (alternative to LibraryPanel).

##### `Library/`

- `LibraryPanel.tsx`: Comprehensive component library management panel with full CRUD functionality (add, rename, delete, switch between components).
- `ComponentList.tsx`: Placeholder for future component list interface (currently unused).

##### `ui/`

Contains reusable UI components built using shadcn/ui principles and Tailwind CSS:
- `button.tsx`: Button component with various variants and sizes
- `dropdown-menu.tsx`: Dropdown menu component
- `input.tsx`: Input field component
- `label.tsx`: Label component for form elements
- `Panel.tsx`: Panel container component
- `PanelHeader.tsx`: Reusable panel header component with title, icon, and action controls
- `popover.tsx`: Popover component built on Radix UI primitives for dropdown menus and contextual content
- `tabs.tsx`: Tab navigation component
- `textarea.tsx`: Textarea component
- `tooltip.tsx`: Tooltip component for contextual help

##### `Layouts/`

- `EditorLayout.tsx`: Alternative layout implementation (currently unused - main layout is in components/EditorLayout.tsx).
- `EditorLayout_deprecated.tsx`: Deprecated layout implementation kept for reference, replaced by the main EditorLayout.tsx.

##### `contexts/`

- `ThemeContext.tsx`: A simple React context to manage and persist the application's light/dark theme preference in localStorage.

- `vite.config.ts`: Configuration for the Vite build tool, including aliases and plugins for Tailwind CSS and Monaco Editor.
- `tailwind.config.js`, `postcss.config.js`: Configuration for Tailwind CSS.
- `tsconfig.*.json`: TypeScript configuration files.
- `test-analyze.js`: Development test file for testing the `analyzeCode` function and JSX location detection.
- `TestAstToCode.tsx`: Development test component for testing the AST-to-Code generation functionality with sample AST structures and JSX output.

#### `examples/`

- `examples.ts`: Contains predefined example components and multi-component examples that users can load to try the editor. Includes the Card Dashboard example set demonstrating parent-child component relationships, and the Missing Component Demo showcasing automatic mock generation for missing components used in JSX.

#### `test/`

- `ComponentStoreTest.tsx`: Test component for verifying the multi-component state management functionality.

### `server/`

This directory is set up as a Node.js and Express application but is currently not implemented.

- `package.json`: Defines dependencies like express and mongoose.
- `index.js`, `models/ComponentModel.js`, `routes/componentRoutes.js`: These files are currently empty. Based on the `PLAN.md`, they are intended to provide a future API for saving, loading, and managing user-created components in a MongoDB database.