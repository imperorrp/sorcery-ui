# Codebase Summary: Live Component Editor

This document provides a summary of the "Live Component Editor" codebase, outlining its architecture, the purpose of each major file and folder, and the core data flow.

## Overall Architecture

The application is a monorepo containing a React client and a Node.js/Express server. The core of the application lies in its client-side architecture, which is a sophisticated hybrid model. It uses **Visual ASTs** (serialized from the Virtual DOM) for real-time rendering and interaction, and a **Source Code AST** (parsed by Babel) for non-destructive, logic-preserving code updates.

### Primary Workflow

The application operates on a sophisticated Three-AST system to ensure both a fluid visual editing experience and a non-destructive code update process that preserves component logic.

- **Code Input**: A developer pastes React component code (TSX/JSX) into the Monaco Editor.
- **Dual Visual AST Generation**: When "Render" is clicked, the renderer.ts utility transpiles and executes the code twice:
  - `componentPreviewAst`: Created using a shimmed version of React, this is a complete, structurally-sound "map" of the component. It is used to render the read-only Navigator tree and acts as the blueprint for applying style changes.
  - `componentAst`: Created using the real React library, this is the "live" version of the component that can manage its own state and interactivity. It is rendered in the iframe's "Interaction Mode".
  - Both of these visual ASTs are stored in the central Zustand store.
- **Visual Editing Loop**: When the user modifies a style in the Inspector, the updateNodeStyle action creates new, updated copies of both visual ASTs in the store. This change is instantly reflected in the sandboxed <iframe>.
- **Reconciliation via a Temporary Source AST**: When "Apply Changes" is clicked, the application's core architectural principle is revealed:
  - The styleUpdater.ts utility takes the originalCode string and creates a temporary, highly-detailed Babel AST. This Source AST understands all component logic, including event handlers and hooks.
  - It then traverses this temporary Babel AST and the componentPreviewAst in parallel, matching elements by their structure.
  - It surgically modifies only the style attribute of the corresponding nodes within the Babel AST, leaving all other code and logic untouched.
  - @babel/generator converts this modified Babel AST back into a clean code string.
  - This new string replaces the originalCode in the store, completing the cycle non-destructively.

This architecture treats the user's Source Code as the ultimate source of truth for logic, while using the Visual ASTs as the source of truth for UI state and interaction.

## Directory and File Breakdown

### `imperorrp-runable-task/` (Root)

- `package.json`: Defines the npm workspaces for client and server and contains scripts to run both concurrently.
- `README.md`: High-level overview of the project, features, and setup instructions.
- `PLAN.md`: A detailed technical planning document outlining the architecture, feature specifications, and development roadmap.

### `client/`

This directory contains the entire frontend React application, built with Vite. The main source code for the React application.

#### `main.tsx` & `App.tsx`

- `main.tsx`: The entry point of the application, responsible for rendering the App component into the DOM.
- `App.tsx`: The root component. It sets up the ThemeProvider for light/dark mode and renders the main Navbar and EditorLayout.

#### `store/`

- `componentStore.ts`: This is the most critical state management file. It uses Zustand to create a global store that holds:
  - `componentAst`: The "Live AST" created with the real React library. It is rendered in "Interaction Mode" and allows the component to be fully stateful.
  - `componentPreviewAst`: The "Preview AST" created with a shimmed React. This is a structurally complete map of the component used for the Navigator and as the blueprint for style updates.
  - `selectedNodeId`: The ID of the currently selected element.
  - `originalCode`: The user's source code string, which is treated as the source of truth for all component logic.
  - `jsxLocation`: The character start/end position of the JSX block within the originalCode.
  - `isDirty`: A flag indicating that visual changes have been made but not yet applied to the source code.
  - `isCodeHighlighted`: A flag to control the persistent highlighting in the code editor after changes are applied.
  - `history`: An array of AST snapshots for undo/redo functionality.
  - State for mock props (`propsJson`), dependencies, and context wrappers (`wrapperCode`).
  - Key methods: `setRenderOutput` (initializes both ASTs after rendering), `updateNodeStyle` (applies style changes), `applyAstChangesToCode` (surgical code updates), `undo`/`redo` (history management).

#### `lib/`

- `renderer.ts`: Contains the crucial `renderCodeToAst` function. This orchestrates the initial code processing pipeline by transpiling the user's code and calling the parser to generate the two distinct visual ASTs (`componentAst` and `componentPreviewAst`).
- `componentParser.ts`: Handles the serialization from React Elements into our custom `SerializableElement` AST format (`serializeComponent`), and the deserialization from our AST back into renderable React Elements (`renderFromAst`).
- `styleUpdater.ts`: (Critical Architectural File) Implements the "Apply Changes" logic. It takes the user's original source code and the `componentPreviewAst`, parses the code into a temporary Babel AST, and surgically modifies only the style attributes of the corresponding nodes. This non-destructive approach is the key to preserving all component logic like onClick handlers and state.
- `astToCode.ts`: Utility for converting `SerializableElement` AST nodes back into formatted JSX code strings. Includes Prettier integration for clean code generation. Used for code generation workflows.
- `utils.ts`: Contains shared utility functions, such as `cn` for merging Tailwind CSS classes.

#### `hooks/`

- `useDebounce.ts`: Custom hook for debouncing user input to prevent excessive re-renders and API calls.
- `useResizableLayout.ts`: Custom hook that manages the resizable layout state for the editor panels, including panel sizes, minimization states, and resize handlers.

#### `polyfills/`

- `processShim.ts`: Browser polyfill for Node.js `process` global object, required for Babel packages to work in the browser environment.

#### `components/`

- `Navbar.tsx`: Navigation bar component with theme toggle functionality and app branding.
- `EditorLayout.tsx`: The main UI component that assembles the different panels (Navigator, Code Editor, Canvas, Inspector). It manages the resizing and collapsing state for these panels. It also triggers the rendering process by calling `renderCodeToAst`.

##### `Canvas/`

- `ComponentCanvas.tsx`: Acts as a container for the rendered component. It renders `IframeCanvas` and is responsible for displaying the `SelectionHighlighter` overlay when an element is selected.
- `IframeCanvas.tsx`: A key component that creates a sandboxed `<iframe>` for rendering. It uses `createPortal` to render the component AST into the iframe's document body.[5] It also injects dependency scripts and handles click/hover events for element selection within the iframe.
- `SelectionHighlighter.tsx`: An unused component, with the active implementation located inside `ComponentCanvas.tsx` for more accurate positioning.

##### `CodeEditor/`

- `MonacoEditor.tsx`: Integrates the Monaco Editor, providing a rich code editing experience with TSX/JSX support. It exposes a ref to get the current code.

##### `Inspector/`

- `InspectorPanel.tsx`: The right-hand panel that contains tabs for editing. It includes the Undo/Redo buttons and the master "Apply Changes" button.
- `StyleEditor.tsx`: Displays input fields (e.g., color pickers, text inputs) to modify the CSS properties of the selected element. Changes are propagated to the Zustand store via the `updateNodeStyle` action.
- `PropsEditor.tsx`: Provides a textarea for the user to input a JSON object, which is then used as props for the root component during rendering.
- `SetupEditor.tsx`: Allows the user to add external CDN dependency URLs, which are injected as <script> tags into the sandboxed <iframe>. It also provides a code editor for defining a custom wrapper component (e.g., for theme or Redux providers).

##### `Navigator/`

- `ComponentTree.tsx`: Displays a collapsible tree view of the component's structure based on the `componentPreviewAst`. It allows for selecting elements, which updates the `selectedNodeId` in the store.

##### `ui/`

Contains reusable UI components built using shadcn/ui principles and Tailwind CSS:
- `button.tsx`: Button component with various variants and sizes
- `dropdown-menu.tsx`: Dropdown menu component
- `input.tsx`: Input field component
- `label.tsx`: Label component for form elements
- `Panel.tsx`: Panel container component
- `tabs.tsx`: Tab navigation component
- `textarea.tsx`: Textarea component

##### `Layouts/`

- `EditorLayout.tsx`: Alternative layout implementation (currently unused - main layout is in components/EditorLayout.tsx).

##### `contexts/`

- `ThemeContext.tsx`: A simple React context to manage and persist the application's light/dark theme preference in localStorage.

- `vite.config.ts`: Configuration for the Vite build tool, including aliases and plugins for Tailwind CSS and Monaco Editor.
- `tailwind.config.js`, `postcss.config.js`: Configuration for Tailwind CSS.
- `tsconfig.*.json`: TypeScript configuration files.
- `test-analyze.js`: Development test file for testing the `analyzeCode` function and JSX location detection.
- `TestAstToCode.tsx`: Development test component for testing the AST-to-Code generation functionality.

### `server/`

This directory is set up as a Node.js and Express application but is currently not implemented.

- `package.json`: Defines dependencies like express and mongoose.
- `index.js`, `models/ComponentModel.js`, `routes/componentRoutes.js`: These files are currently empty. Based on the `PLAN.md`, they are intended to provide a future API for saving, loading, and managing user-created components in a MongoDB database.