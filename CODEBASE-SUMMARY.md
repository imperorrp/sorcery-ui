# Codebase Summary: Live Component Editor

This document provides a summary of the "Live Component Editor" codebase, outlining its architecture, the purpose of each major file and folder, and the core data flow.

## Overall Architecture

The application is a monorepo containing a React client and a Node.js/Express server. The core of the application lies in its client-side architecture, which can be described as a Virtual DOM Serialization model.

### Primary Workflow

- **Code Input**: A developer pastes React component code (TSX/JSX) into the Monaco Editor.
- **Transpilation & Execution**: The raw code string is transpiled in the browser using `@babel/standalone`.
- **AST Generation**: The transpiled code is executed to create a React Element tree. A custom `serializeComponent` function then traverses this tree to create a serializable JSON-like Abstract Syntax Tree (AST). This AST is the application's single source of truth.
- **State Management**: The generated AST is stored in a global Zustand store.[1] All user actions, such as selecting an element or modifying a style, are dispatched as actions that update this AST in the store.
- **Sandboxed Rendering**: A custom `renderFromAst` function reads the AST from the Zustand store and renders it as actual React components inside a sandboxed `<iframe>`.[2][3] This isolates the component's styles and scripts from the main application.[4]
- **UI Updates**: React's declarative nature ensures that any changes to the AST in the Zustand store automatically trigger a re-render of the component inside the iframe.

This architecture creates a robust, unidirectional data flow, separating the user's code from the live, interactive preview.

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
  - `componentAst`: The AST for the interactive component (preserves hooks and state).
  - `componentPreviewAst`: A fully-resolved AST used for the navigator tree.
  - `selectedNodeId`: The ID of the currently selected element.
  - `history`: An array of AST snapshots for undo/redo functionality.
  - State for mock props, dependencies, context wrappers, and UI modes (`selectionMode`).

#### `lib/`

- `renderer.ts`: Contains the core logic for processing user code.
  - `renderCodeToAst(code)`: The main function that orchestrates the entire rendering pipeline. It transpiles the code with Babel, executes it to get a React component, and then calls `serializeComponent` to generate two versions of the AST (`runtimeAst` and `previewAst`). It cleverly uses a "shimmed" React to resolve the preview AST without triggering hook errors.
- `componentParser.ts`: Handles the conversion between React Elements and the serializable AST.
  - `serializeComponent(element)`: Recursively traverses a React Element tree and converts it into the `SerializableElement` AST format, assigning unique IDs.
  - `renderFromAst(astNode)`: Takes the AST and recursively builds a React Element tree from it using `React.createElement`.
- `utils.ts`: Contains utility functions, notably `cn` for merging Tailwind CSS classes.

#### `components/`

- `EditorLayout.tsx`: The main UI component that assembles the different panels (Navigator, Code Editor, Canvas, Inspector). It manages the resizing and collapsing state for these panels. It also triggers the rendering process by calling `renderCodeToAst`.

##### `Canvas/`

- `ComponentCanvas.tsx`: Acts as a container for the rendered component. It renders `IframeCanvas` and is responsible for displaying the `SelectionHighlighter` overlay when an element is selected.
- `IframeCanvas.tsx`: A key component that creates a sandboxed `<iframe>` for rendering. It uses `createPortal` to render the component AST into the iframe's document body.[5] It also injects dependency scripts and handles click/hover events for element selection within the iframe.
- `SelectionHighlighter.tsx`: An unused component, with the active implementation located inside `ComponentCanvas.tsx` for more accurate positioning.

##### `CodeEditor/`

- `MonacoEditor.tsx`: Integrates the Monaco Editor, providing a rich code editing experience with TSX/JSX support. It exposes a ref to get the current code.

##### `Inspector/`

- `InspectorPanel.tsx`: The right-hand panel that contains tabs for editing. It also includes the Undo/Redo buttons that interact with the Zustand store's history.
- `StyleEditor.tsx`: Displays input fields (e.g., color pickers, text inputs) to modify the CSS properties of the selected element. Changes are propagated to the Zustand store via the `updateNodeStyle` action.
- `PropsEditor.tsx`: A simple textarea where the user can input a JSON object to be used as props for the root component.
- `SetupEditor.tsx`: Allows the user to add external CDN dependencies and provide a custom wrapper component (e.g., for theme providers or Redux providers).

##### `Navigator/`

- `ComponentTree.tsx`: Displays a collapsible tree view of the component's structure based on the `componentPreviewAst`. It allows for selecting elements, which updates the `selectedNodeId` in the store.

##### `ui/`

Contains reusable UI components like Button, Input, Tabs, etc., built using shadcn/ui principles and Tailwind CSS.

##### `contexts/`

- `ThemeContext.tsx`: A simple React context to manage and persist the application's light/dark theme preference in localStorage.

- `vite.config.ts`: Configuration for the Vite build tool, including aliases and plugins for Tailwind CSS and Monaco Editor.
- `tailwind.config.js`, `postcss.config.js`: Configuration for Tailwind CSS.
- `tsconfig.*.json`: TypeScript configuration files.

### `server/`

This directory is set up as a Node.js and Express application but is currently not implemented.

- `package.json`: Defines dependencies like express and mongoose.
- `index.js`, `models/ComponentModel.js`, `routes/componentRoutes.js`: These files are currently empty. Based on the `PLAN.md`, they are intended to provide a future API for saving, loading, and managing user-created components in a MongoDB database.