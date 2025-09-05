# Technical Planning Document: Live-Component-Editor

**Version: 1.1**
**Status: Production Ready (Phase 3 Complete)**

This document provides a deep dive into the architecture, feature specifications, and development roadmap for the Live-Component-Editor project.

## 1. Core Architecture: A Hybrid AST Model

The application's architecture is a sophisticated hybrid model designed to provide a fluid visual editing experience while ensuring the user's component logic is never destroyed. It operates on a core principle: **The User's Source Code is the Single Source of Truth for Logic.**

The system utilizes three distinct Abstract Syntax Trees (ASTs) to achieve this:

1.  **Visual ASTs (`SerializableElement`):** When a user renders their code, we generate two versions of a lightweight, serializable AST from their component's Virtual DOM.
    *   The **`componentAst` (Live AST)** is created with the real React library and is used for the fully interactive preview.
    *   The **`componentPreviewAst` (Preview AST)** is created with a shimmed version of React and serves as a static "map" for the UI, driving the Navigator panel and acting as a blueprint for style edits.
    *   Both are stored in our central Zustand state.

2.  **Source AST (Babel AST):** This is a temporary, high-fidelity AST created on-demand by the Babel parser.
    *   When a user clicks "Apply Changes," we do **not** generate new code from our visual ASTs.
    *   Instead, we parse the user's original source code into a temporary Source AST that understands all its logic, hooks, and event handlers.
    *   Our `styleUpdater.ts` utility then uses the `componentPreviewAst` as a map to find the corresponding nodes in the Source AST and surgically modifies **only their `style` attributes.**
    *   Finally, `@babel/generator` converts this modified Source AST back into a well-formatted code string, preserving all original logic.

This hybrid, non-destructive approach allows the application to robustly handle complex, real-world components, making it a true "Live Component Editor."

## 2. Detailed Feature Specifications

### 2.1. The Editing Canvas & Sandbox
*   **`<iframe>` Sandbox:** All user components will be rendered inside an `iframe` to ensure complete style and script isolation.
*   **Selection & Highlighting:** Elements will be selectable via a single click. A blue outline will indicate the selected element, and a lighter outline will appear on hover.
*   **Overlapping Element Selection:** Holding `Shift` + Click will trigger `document.elementsFromPoint`, presenting a context menu to select elements obscured by others with a higher `z-index`.
*   **Measurement Guides:** Holding `Shift` while an element is selected will show pixel-distance guides to other hovered elements.

### 2.2. Component Ingestion & Management
*   **Monaco Code Editor:** User code will be managed in an instance of Monaco Editor, providing syntax highlighting, validation, and an IDE-like feel.
*   **Component Library:** The UI will support multiple component tabs. Users can paste several components (e.g., a `Card` and a `CardList`).
*   **Child Component Mocking:** When rendering a component that uses an unknown child (e.g., `<Video />`), the `render` function will automatically generate a placeholder `div` with a label and dashed border. If the user later adds the `Video` component to the library, the renderer will hot-swap the placeholder with the actual component.

### 2.3. Dependency & Environment Management
*   **First-Class Prop Mocking:** A dedicated "Data" tab will allow users to provide a JSON object for the root component's props.
*   **Context Provider Wrapping:** A "Setup" tab will feature a code editor where users can define a wrapper component. This allows them to provide `ThemeProvider`, `Redux <Provider>`, or any other React Context needed by the component.
*   **3rd-Party Library Injection:** The "Setup" tab will also include an interface to add CDN URLs for external libraries (e.g., `framer-motion`, `react-select`). These scripts will be dynamically injected into the `<iframe>`'s head.
*   **API Mocking (Future):** Integration with Mock Service Worker (MSW) to define mock API responses for data-fetching components.

### 2.4. The Inspector Panel & UI/UX
*   **Dynamic & Responsive Layout:** The entire editor is built with a flexible layout system. All panels (Code Editor, Canvas, Inspector) are resizable with draggable handles and can be minimized/maximized for a customizable workspace.
*   **State Persistence:** Key UI state, such as the inspector panel's height, is persisted to `localStorage`, so the user's layout is remembered across sessions.
*   **Theming:** A light/dark theme toggle is available, and all components are styled to adapt accordingly.
*   **Context-Aware Controls:** The Inspector will show relevant style controls based on the selected element.
*   **Component Tree Navigator:** A collapsible tree view will display the component's DOM structure, with two-way binding to the selection on the canvas.
*   **Undo/Redo:** A history stack of the component AST will be maintained in Zustand, allowing for unlimited undo/redo (`Ctrl+Z`, `Ctrl+Shift+Z`).
*   **Debounced Inputs:** All slider and text inputs in the inspector will be debounced to ensure a smooth UI and prevent excessive re-renders.

## 3. Phased Development Plan

### Phase 0: Foundation (1 Day)
- [x] Setup monorepo with `client` and `server` workspaces.
- [x] Initialize Express server and connect to MongoDB via Mongoose.
- [x] Implement core `Component` schema and `POST`, `GET`, `PUT` API endpoints.
- [x] Initialize Vite + React + TailwindCSS client.

### Phase 1: The Core MVP (2-3 Days)
- [x] Implement `serialize` and `render` utilities for the AST conversion.
- [x] Integrate Monaco Editor for code input.
- [x] Implement the core selection logic via `data-node-id`.
- [x] Setup Zustand store for the AST and `selectedNodeId`.
- [x] Build a basic Inspector panel to edit text content and color.
- [x] Wire up `onSave` to the backend `PUT` endpoint.

### Phase 2: Robustness & Environment Simulation (2 Days)
- [x] **Refactor:** Move the rendering canvas into a sandboxed `<iframe>`.
- [x] **Feature:** Implement the Undo/Redo history stack in the Zustand store.
- [x] **Feature:** Build the "Mock Props" panel in the UI.
- [x] **Feature:** Implement the "Dependency Management" UI to inject external scripts into the `<iframe>`.
- [x] **Feature:** Implement the "Context Wrapper" editor to wrap the user's component in providers.

### Phase 3: Multi-Component Workflow & Polish (2 Days)
- [x] **Feature:** Implement the "Component Library" UI, allowing users to add and switch between multiple components.
- [x] **Architecture:** Enhance the `render` function to handle placeholder mocking for unknown child components.
- [x] **UI/UX:** Build the collapsible Component Tree navigator.
- [x] **UI/UX:** Implement the "Drill-Down" click for overlapping elements (enhanced with visual layer indicators and live element highlighting).

### Phase 4: AI & Advanced Features (1-2 Days)
- [ ] **AI:** Create a backend service to analyze component code with an LLM and return a mock props JSON schema.
- [ ] **UI/UX:** Implement the "Figma-like" measurement guides.
- [ ] **Workflow:** Add an "Export to CodeSandbox" button that uses their API to create a new instance.

### Phase 5: Platform Vision (Future)
- [ ] Implement user authentication and associate component workspaces with users.
- [ ] Transition to a shareable URL structure (`/editor/:id`).
- [ ] Begin design of a plugin-based architecture for third-party extensions.

## 4. Current Status & Progress

**Phase 0: ✅ COMPLETED**
- Monorepo structure established with client/server workspaces
- Express server with MongoDB/Mongoose integration
- Vite + React + TypeScript + TailwindCSS client setup
- shadcn/ui components integrated (Button, Input, Label)
- Core dependencies installed and configured

**Phase 1: ✅ COMPLETED**
- ✅ Zustand store implemented with Immer for state management
- ✅ Core parser utilities (`serializeComponent`, `renderFromAst`, `createAst`) completed
- ✅ Monaco Editor integration with Babel transpilation
- ✅ ComponentCanvas with selection highlighting
- ✅ SelectionHighlighter component for visual feedback
- ✅ InspectorPanel with style controls
- ✅ EditorLayout integrating all components
- ✅ TypeScript JSX configuration fixed
- ✅ Implement robust, logic-preserving "Apply Changes" workflow using a **Babel AST-based surgical update strategy**
- 🔄 Backend API integration (ready for Phase 2)

**Phase 2: ✅ COMPLETED**
- ✅ Refactor: Moved the rendering canvas into a sandboxed `<iframe>`
- ✅ Feature: Implemented the Undo/Redo history stack in the Zustand store
- ✅ Feature: Built the "Mock Props" panel in the UI
- ✅ Feature: Implemented the "Dependency Management" UI to inject external scripts into the `<iframe>`
- ✅ Feature: Implemented the "Context Wrapper" editor to wrap the user's component in providers

**Phase 3: ✅ COMPLETED**
- ✅ Feature: Implemented the "Component Library" UI, allowing users to add and switch between multiple components
- ✅ UI/UX: Built the collapsible Component Tree navigator
- ✅ Advanced resizable layout system with react-resizable-panels
- ✅ LibraryPanel with full CRUD functionality for component management
- ✅ Smart Selection: Implemented component boundary enforcement by pruning child components from preview AST
- ✅ Selection Bug Fix: Custom components now selectable via wrapper spans with `display: 'contents'`
- ✅ Disclaimer Logic Fix: Only shows disclaimer for child components, not root components
- ✅ State Management Fix: Fixed `updateNodeStyle` to use proper immutable updates within set() callback
- ✅ Children Handling Fix: Robust `React.Children.toArray()` implementation for all React children types
- ✅ Dependency Stabilization: Prevented infinite loops in IframeCanvas with stable dependency keys
- ✅ Multi-Component Examples: Added Card Dashboard example set demonstrating parent-child relationships
- ✅ Drill-Down Selection: Implemented Shift+click for selecting overlapping elements with custom menu
- ✅ **Missing Component Detection (v1.2):** Automatic mock generation for missing components
- ✅ **Global Scope Injection:** Reliable component resolution using direct global references
- ✅ **Enhanced Example System:** Categorized examples with missing component demo

### 5.1. Component API Schema
```typescript
// Component Document Schema (MongoDB)
interface Component {
  _id: ObjectId;
  name: string;
  code: string; // The raw JSX/TypeScript code
  ast: SerializableElement; // The serialized AST
  props: Record<string, any>; // Mock props for the component
  dependencies: string[]; // List of external dependencies
  createdAt: Date;
  updatedAt: Date;
  userId?: ObjectId; // For future user authentication
}

// API Endpoints
POST /api/components          // Create new component
GET /api/components           // List all components
GET /api/components/:id       // Get specific component
PUT /api/components/:id       // Update component (save changes)
DELETE /api/components/:id    // Delete component
```

### 5.2. Security & Architectural Concerns

**DOMPurify Integration:**
- All user-provided code will be sanitized using DOMPurify before rendering
- HTML content within components will be purified to prevent XSS attacks
- The Monaco Editor will have content validation to prevent malicious code injection

**State Management Philosophy:**
- **Single Source of Truth:** The Zustand store serves as the central state authority
- **Immutable Updates:** Immer ensures all state mutations are immutable and predictable
- **Optimistic Updates:** UI updates immediately, with error handling for failed operations
- **History Management:** Full undo/redo capability with efficient history storage

**Performance Considerations:**
- **Virtual DOM Serialization:** Efficient conversion between React elements and JSON
- **Debounced Updates:** All user inputs are debounced to prevent excessive re-renders
- **Lazy Loading:** Monaco Editor and other heavy components loaded on-demand
- **Memory Management:** Proper cleanup of event listeners and DOM references

**Error Handling:**
- **Graceful Degradation:** App continues functioning if individual features fail
- **User Feedback:** Clear error messages for invalid code or network issues
- **Recovery Mechanisms:** Automatic retry for failed API calls
- **Validation:** Client-side validation before sending data to server

**Scalability Considerations:**
- **Modular Architecture:** Components designed for easy extension and modification
- **Plugin System:** Future plugin architecture for third-party extensions
- **Code Splitting:** Dynamic imports for better initial load performance
- **Caching Strategy:** Intelligent caching of components and dependencies

## Selection Highlight Contrast Strategy (future)

Problem
- Selection/highlight outlines can become invisible when the selected element uses the same color or very similar contrast as the accent outline.

Recommended approach
- Use a contrast-aware, double-ring highlight: an inner accent ring (accent color, e.g. blue) plus an outer contrast ring chosen per-element (black or white with slight opacity) based on computed luminance of the element's background.
- Compute effective background by sampling getComputedStyle and walking up until a non-transparent background is found.
- Compute luminance and choose contrastColor = black/white depending on threshold. Render box-shadow or stacked outlines: `0 0 0 2px accent, 0 0 0 5px contrastColor`.

Why this is robust
- The outer contrast ring guarantees visibility regardless of the element's fill color without reserving or hard-coding a special highlight color.
- Works for most solid-color and image-backed backgrounds; for extremely complex cases we can fallback to a small floating badge (id/type) rendered with the same contrastColor.

Implementation notes / backlog
- Small, self-contained change: update `SelectionHighlighter` to sample computed style and set box-shadow accordingly.
- Add an optional small label (element tag / id) positioned near the outline when element size allows.
- Priority: low — UX polish to schedule in Phase 3 or as part of a later polish pass.