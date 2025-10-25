# Codebase Summary: Sorcery UI

This document provides a summary of the "Sorcery UI" codebase, outlining its architecture, the purpose of each major file and folder, and the core data flow.

- `index.css`: Global stylesheet containing CSS custom properties for theming, utility classes for theme tokens, react-resizable-panels styling, Monaco editor code highlighting, and glassmorphic panel effects with comprehensive JSDoc documentation.
- `ComponentList.tsx`: **NEW (v1.2)** - Placeholder for future component list interface (currently unused)

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

- `package.json`: Defines the pnpm workspaces for client and server and contains scripts to run both concurrently.
- `README.md`: High-level overview of the project, features, and setup instructions.
- `PLAN.md`: A detailed technical planning document outlining the architecture, feature specifications, and development roadmap.
- `ARCHITECTURE.md`: Comprehensive documentation of architectural decisions, design principles, security considerations, and technical guidelines.
- `.github/prompts/usefulprompts.prompt.md`: AI prompt template for automated codebase analysis and documentation updates.
- `.npmrc`: pnpm configuration file with settings for peer dependencies and hoisting.
- `pnpm-workspace.yaml`: Defines the pnpm workspace structure for client and server.
- `pnpm-lock.yaml`: Lockfile for pnpm dependencies.

### `client/`

This directory contains the entire frontend React application, built with Vite. The main source code for the React application.

#### `main.tsx` & `App.tsx`

- `main.tsx`: The entry point of the application, responsible for rendering the App component into the DOM. Includes Buffer polyfill for browser compatibility with Babel packages.
- `App.tsx`: The root component. It sets up the ThemeProvider for light/dark mode and renders the routing structure with BrowserRouter. Includes routes for the home page, editor page, and experimental editor page.

#### `store/`

- `componentStore.ts`: This is the most critical state management file. It uses Zustand to create a global store that holds:
  - `components`: A map of component IDs to their data, supporting multiple components in a library
  - `activeComponentId`: The ID of the component currently being edited
  - `selectedNodeId`: The ID of the currently selected element
  - `selectionMode`: Either 'interact' or 'select' mode for the canvas
  - `isDirty`: A flag indicating that visual changes have been made but not yet applied to the source code
  - `isCodeHighlighted`: A flag to control the persistent highlighting in the code editor after changes are applied
  - `isRendering`: A flag indicating whether a render operation is currently in progress
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
  - Key methods: `setRenderOutput` (initializes both ASTs after rendering), `updateNodeStyle` (applies style changes with proper immutable updates within set() callback), `applyAstChangesToCode` (surgical code updates), `undo`/`redo` (history management), `renderActiveComponent` (async rendering with error handling), plus multi-component management methods like `addComponent`, `setActiveComponent`, `deleteComponent`, etc.

#### `lib/`

- `renderer.ts`: Contains the crucial `renderCodeToAst` function. This orchestrates the initial code processing pipeline by transpiling the user's code and calling the parser to generate the two distinct visual ASTs (`componentAst` and `componentPreviewAst`). Implements Smart Selection by pruning child components from the preview AST to enforce component boundaries, and handles local component imports with dynamic resolution. Includes automatic mock generation for missing components used in JSX but not imported or available in the library, using global scope injection for reliable component resolution during execution.
- `componentParser.ts`: Handles the serialization from React Elements into our custom `SerializableElement` AST format (`serializeComponent`), and the deserialization from our AST back into renderable React Elements (`renderFromAst`). Includes robust handling of all React children types using `React.Children.toArray()` and wraps custom components in selectable spans with `display: 'contents'` for proper selection behavior.
- `styleUpdater.ts`: (Critical Architectural File) Implements the "Apply Changes" logic. It takes the user's original source code and the `componentPreviewAst`, parses the code into a temporary Babel AST, and surgically modifies only the style attributes of the corresponding nodes. This non-destructive approach is the key to preserving all component logic like onClick handlers and state.
- `codeUpdater.ts`: Alternative implementation of style updating using surgical string replacement approach (currently unused).
- `astToCode.ts`: Utility for converting `SerializableElement` AST nodes back into formatted JSX code strings. Includes Prettier integration for clean code generation. Used for code generation workflows.
- `attributeUpdater.ts`: Unified surgical code modification system that applies visual style and className changes back to source code non-destructively using AST-based structural matching.
- `classNameUpdater.ts`: Surgical code modification system focused on applying visual className changes back to source code non-destructively using AST-based structural matching.
- `tailwindParser.ts`: Utility for parsing and manipulating Tailwind CSS classes, enabling structured editing of className strings through categorized properties. Includes comprehensive JSDoc documentation for all functions and interfaces.
- `colorConstants.ts`: Predefined color palettes for Tailwind CSS utilities with human-readable names and hex values for tooltips.
- `definitionUtils.ts`: Helper functions for managing Tailwind control definitions, including grouping and filtering utilities with comprehensive JSDoc documentation.
- `tailwindService.ts`: Service layer for Tailwind CSS operations including validation, class generation, and responsive utilities. Includes comprehensive JSDoc documentation for all functions and interfaces.
- `utils.ts`: Contains shared utility functions, such as `cn` for merging Tailwind CSS classes.
- `utilityStateHelpers.ts`: Utility functions for managing utility class state and generating className strings. Provides the core logic for combining managed utility classes with unmanaged classes into properly formatted className strings used throughout the visual editor.
- `definitions/datasets.json`: JSON data file containing predefined datasets for Tailwind utilities including color palettes, spacing values, and typography scales used by definition-driven controls.
- `definitions/tailwind-inspector.json`: Large JSON file containing comprehensive Tailwind CSS utility definitions generated by the inspector script, including all available classes, categories, and their properties.
- `scripts/generate-inspector-def.js`: Node.js script for generating Tailwind inspector definitions using GitHub API and Gemini AI. Includes comprehensive JSDoc documentation for all functions and interfaces.

#### `hooks/`

- `useDebounce.ts`: Custom hook for debouncing user input to prevent excessive re-renders and API calls.
- `useResizableLayout.ts`: Custom hook that manages the resizable layout state for the editor panels, including panel sizes, minimization states, and resize handlers.
- `useControlData.ts`: Custom hook for managing control state and data flow in inspector controls. Handles option generation, value synchronization, and utility class updates for various control types.

#### `polyfills/`

- `processShim.ts`: Browser polyfill for Node.js `process` global object, required for Babel packages to work in the browser environment.

#### `components/`

- `Navbar.tsx`: Navigation bar component with theme toggle functionality, layout controls, examples dropdown, render button, configuration panel toggle, panel visibility controls, and app branding with comprehensive JSDoc documentation.
- `HomePage.tsx`: Landing page component for Sorcery UI, featuring a hero section with gradient headline, feature cards, problem/solution explanation, and navigation to editor routes with comprehensive JSDoc documentation.
- `EditorPage.tsx`: Editor page component using the Vibe layout, providing the main editing interface with navbar controls, panel visibility toggles, and configuration modal with comprehensive JSDoc documentation.
- `ExperimentalEditorPage.tsx`: Experimental editor page component using the Experimental layout, featuring advanced panel controls, fullscreen mode, and comprehensive layout management with comprehensive JSDoc documentation.
- `ExperimentalLayout.tsx`: The main UI component that assembles the different panels (Library, Navigator, Code Editor, Component Preview, Style Editor). It manages the resizing and collapsing state for these panels using react-resizable-panels. It also triggers the rendering process by calling `renderCodeToAst` and handles example loading. Includes active component selectors for proper multi-component data access, fullscreen mode with automatic panel hiding, floating dock for panel visibility controls, and enhanced...

##### `Canvas/`

- `ComponentCanvas.tsx`: Acts as a container for the rendered component. It renders `IframeCanvas` and is responsible for displaying the `SelectionHighlighter` overlay when an element is selected.
- `IframeCanvas.tsx`: A key component that creates a sandboxed `<iframe>` for rendering. It uses `createPortal` to render the component AST into the iframe's document body. Includes dependency injection with stabilization to prevent infinite loops, enhanced selection handling for custom components, and AST sanitization for error handling. **NEW**: Features an advanced drill-down selection system with Shift+click for overlapping elements, visual layer indicators, live element highlighting, and proper context bridging between iframe and parent window for store access.
- `SelectionHighlighter.tsx`: An unused component, with the active implementation located inside `ComponentCanvas.tsx` for more accurate positioning.

##### `CodeEditor/`

- `MonacoEditor.tsx`: Integrates the Monaco Editor, providing a rich code editing experience with TSX/JSX support. It exposes a ref to get the current code and supports code range highlighting for JSX element inspection.
- `CodeEditorWithTabs.tsx`: Combines Monaco editor with integrated tab system for multi-component editing experience
- `ComponentTabs.tsx`: IDE-style component tab bar with overflow management, drag-and-drop reordering, integrated library access, theme support, and comprehensive JSDoc documentation
- `ExamplesDropdown.tsx`: Placeholder for future example loading interface (currently unused)

##### `Inspector/`

- `InspectorPanel.tsx`: The right-hand panel that contains tabs for editing. It includes the Undo/Redo buttons and the master "Apply Changes" button. Features search functionality for filtering Tailwind controls, modifier stack system for session-based change tracking, ultra-compact contextual sticky header that appears on scroll with minimal padding/gaps, scope-based filtering (common/favorites/all) for utilities and modifiers, and comprehensive JSDoc documentation. Only displays editing controls when an element is explicitly selected.
- `inspector-config.ts`: Configuration module providing property groupings, icon mappings, color organization, typography scales, and scope filter definitions for the visual inspector. Enhances UX with structured data for control organization and visual representation with comprehensive JSDoc documentation.
- `StyleEditor.tsx`: Displays input fields (e.g., color pickers, text inputs) to modify the CSS properties of the selected element. Changes are propagated to the Zustand store via the `updateNodeStyle` action. Includes smart component boundary detection to prevent editing child components and real-time visual feedback.
- `PropsEditor.tsx`: Provides a textarea for the user to input a JSON object, which is then used as props for the root component during rendering.
- `SetupEditor.tsx`: Allows the user to add external CDN dependency URLs, which are injected as <script> tags into the sandboxed <iframe>. It also provides a code editor for defining a custom wrapper component (e.g., for theme or Redux providers).
- `ClassNameEditor.tsx`: UI component for managing element className with visual controls. Provides an input field to edit CSS classes and definition-driven controls for various Tailwind utilities like padding, margin, colors, typography, and display properties. Includes comprehensive JSDoc documentation for better code maintainability.
- `ConfigurerPanel.tsx`: Tabbed interface for component configuration with tabs for Props, Global CSS, Context Wrapper, and External Dependencies editors.
- `ContextWrapperEditor.tsx`: Monaco editor interface for defining React context wrapper components that wrap the main component during rendering.
- `DependenciesEditor.tsx`: Interface for managing external CDN dependencies that are loaded in the preview iframe for component rendering.
- `GlobalCssEditor.tsx`: Monaco editor interface for defining global CSS styles and utility classes available in the sandboxed iframe.

##### `controls/`

- `BoxModelEditor.tsx`: Visual editor component for padding and margin properties with linked/unlinked controls. Provides individual directional inputs or unified control with comprehensive JSDoc documentation.
- `ControlRow.tsx`: Enhanced layout component for inspector controls with anchor navigation, active indicators, hover reset functionality, and responsive grid design with comprehensive JSDoc documentation.
- `ColorPicker.tsx`: Smart color picker component that resolves colors from datasets.json or direct class arrays. Supports both reference-based and direct color definitions with comprehensive JSDoc documentation.
- `SelectControl.tsx`: Button-based control component for selecting from predefined Tailwind utility classes. Displays all options as buttons instead of dropdown menu with comprehensive JSDoc documentation.
- `ShadowEditor.tsx`: Advanced shadow editor component for creating and editing box-shadow properties. Supports multiple shadows with offset, blur, spread, color, and inset controls with comprehensive JSDoc documentation.
- `GradientEditor.tsx`: Advanced gradient editor component for creating and editing CSS gradient backgrounds and masks. Supports predefined gradient directions and custom gradient values with comprehensive JSDoc documentation.
- `SegmentedControl.tsx`: Smart segmented control component for selecting values from predefined option sets. Supports both external options and Tailwind class definitions with comprehensive JSDoc documentation.
- `Slider.tsx`: Slider component for selecting numeric values with visual slider and numeric input. Supports special handling for opacity values and custom units with comprehensive JSDoc documentation.
- `TextInput.tsx`: Text input component for entering text values that are converted to Tailwind utility classes. Provides a simple text input interface for category-specific text-based properties with comprehensive JSDoc documentation.
- `Toggle.tsx`: Toggle component for enabling/disabling boolean Tailwind utility classes. Provides a visual toggle button interface for on/off type properties with comprehensive JSDoc documentation.
- `NumberInput.tsx`: Number input component for entering numeric values with optional min/max constraints. Converts numeric input to appropriate Tailwind utility classes with comprehensive JSDoc documentation.
- `SizeInput.tsx`: Size input component for entering dimension values with category-specific formatting. Converts user input to appropriate Tailwind classes with comprehensive JSDoc documentation.
- `BorderRadiusControl.tsx`: Specialized control for border radius properties with visual preview and preset options.
- `BorderRadiusEditor.tsx`: Advanced editor for border radius with individual corner controls and linked/unlinked modes.
- `BorderWidthControl.tsx`: Control component for border width properties with thickness selection.
- `BorderWidthEditor.tsx`: Editor component for border width with directional controls and presets.
- `BoxModelControl.tsx`: Unified control for box model properties (padding, margin) with linked controls.
- `ComboBoxWithSlider.tsx`: Combined control with dropdown presets and slider for numeric values. Supports index-based slider with label display and arbitrary input.
- `TabbedControl.tsx`: Tabbed interface control for organizing multiple related properties.
- `UtilityControlFactory.tsx`: Factory component that dynamically creates appropriate control components based on utility definitions. Handles different control types (slider, segmented, select, etc.), manages state synchronization, theme integration, and special compound controls with comprehensive JSDoc documentation.
- `TabbedControl.tsx`: Tabbed interface control for organizing multiple related properties with strategy switching.

##### `Navigator/`

- `ComponentTree.tsx`: Displays a collapsible tree view of the component's structure based on the `componentPreviewAst`. It allows for selecting elements, which updates the `selectedNodeId` in the store. Includes smooth scrolling to selected elements and visual selection feedback.
- `ComponentLibrary.tsx`: Simple component list interface for switching between components (alternative to LibraryPanel).

##### `Library/`

- `LibraryPanel.tsx`: Comprehensive component library management panel with full CRUD functionality (add, rename, delete, switch between components).
- `ComponentList.tsx`: Placeholder for future component list interface (currently unused).

##### `ui/`

Contains reusable UI components built using shadcn/ui principles and Tailwind CSS:
- `accordion.tsx`: Collapsible accordion component built on Radix UI primitives with smooth animations and accessibility features
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
- `color-picker.tsx`: Color picker component with popover interface for selecting colors, used in definition-driven controls
- `color-swatch-picker.tsx`: Grid-based color swatch picker with tooltips for selecting predefined colors
- `segmented-control.tsx`: Horizontal segmented control for selecting between multiple options
- `select-control.tsx`: Styled select dropdown control for choosing from predefined options
- `shadow-editor.tsx`: Control for selecting and previewing box shadow styles
- `size-input.tsx`: Input control for size values with unit selection (px, rem, em, etc.)
- `select.tsx`: Select dropdown component built on Radix UI primitives for choosing from options
- `slider.tsx`: Slider component for numeric input with visual feedback and accessibility features

#### `layouts/`

- `ExperimentalLayout.tsx`: The main UI component that assembles the different panels (Library, Navigator, Code Editor, Component Preview, Style Editor). It manages the resizing and collapsing state for these panels using react-resizable-panels. It also triggers the rendering process by calling `renderCodeToAst` and handles example loading. Includes active component selectors for proper multi-component data access, fullscreen mode with automatic panel hiding, floating dock for panel visibility controls, and enhanced...
- `VibeLayout.tsx`: Alternative layout implementation with a floating navigator panel that can be expanded/minimized. Features a compact design with inspector sidebar and floating navigator overlay, including expand/minimize functionality for better space utilization.

##### `contexts/`

- `ThemeContext.tsx`: A simple React context to manage and persist the application's light/dark theme preference in localStorage.

- `vite.config.ts`: Configuration for the Vite build tool, including aliases and plugins for Tailwind CSS and Monaco Editor.
- `tailwind.config.js`, `postcss.config.js`: Configuration for Tailwind CSS.
- `tsconfig.*.json`: TypeScript configuration files.
- `package.json`: Defines client dependencies including React, Vite, Tailwind CSS, and buffer polyfill for browser compatibility.
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