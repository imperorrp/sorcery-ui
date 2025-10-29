# Technical Planning Document: Sorcery UI

**Status: Phase 3 Complete - Active Development**

This document provides a comprehensive overview of the architecture, feature specifications, and development roadmap for Sorcery UI (formerly Live-Component-Editor).

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
- [x] **Feature:** Advanced resizable layout system with react-resizable-panels.
- [x] **Feature:** LibraryPanel with full CRUD functionality for component management.
- [x] **Feature:** Smart Selection with component boundary enforcement.
- [x] **Feature:** Multi-component tab system with overflow management and drag-and-drop.
- [x] **Feature:** Missing component detection with automatic mock generation.
- [x] **Feature:** Global scope injection for reliable component resolution.
- [x] **Feature:** Enhanced example system with categorized examples.

### Phase 4: Advanced Inspector & Tailwind Integration (Completed)
- [x] **Feature:** Comprehensive Tailwind CSS utility controls in Inspector.
- [x] **Feature:** Definition-driven control system with datasets.
- [x] **Feature:** Search functionality for filtering Tailwind controls.
- [x] **Feature:** Modifier stack system for session-based change tracking.
- [x] **Feature:** Scope-based filtering (common/favorites/all) for utilities and modifiers.
- [x] **Feature:** Box model editor with linked/unlinked controls.
- [x] **Feature:** Advanced color picker with swatch palettes.
- [x] **Feature:** Shadow editor for complex box-shadow properties.
- [x] **Feature:** Gradient editor for CSS gradients.
- [x] **Feature:** Border radius and border width editors.
- [x] **Feature:** Dynamic control factory for various Tailwind utilities.
- [x] **Feature:** Surgical code modification system (attributeUpdater, classNameUpdater).
- [x] **Feature:** AST-to-code generation with Prettier integration.

### Phase 5: Layout & UI Enhancements (Completed)
- [x] **Feature:** Multiple layout implementations (Experimental, Vibe).
- [x] **Feature:** Fullscreen mode with automatic panel hiding.
- [x] **Feature:** Floating dock for panel visibility controls.
- [x] **Feature:** Theme context with light/dark mode toggle.
- [x] **Feature:** HomePage with hero section and feature cards.
- [x] **Feature:** Navigation with Navbar component.
- [x] **Feature:** Configurer panel with tabbed interface (Props, CSS, Context, Dependencies).
- [x] **Feature:** CodeEditorWithTabs for multi-component editing.
- [x] **Feature:** ComponentTabs with IDE-style tab management.
- [x] **UI/UX:** CompactNavbar with icon-based design inspired by v0/Lovable.
- [x] **UI/UX:** Responsive design system with mobile-friendly layouts.
- [x] **UI/UX:** MobileLayout with swipeable tabbed interface.
- [x] **UI/UX:** Minimizable Navigator with floating icon button.
- [x] **Feature:** Keyboard shortcuts for common actions (Ctrl+R, Ctrl+B, etc.).
- [x] **Feature:** Keyboard shortcuts help modal (press '?').
- [x] **Responsive:** useMediaQuery and useResponsive hooks for screen size detection.

### Phase 6: Package Management & Polyfills (Completed)
- [x] **Infrastructure:** Migrated from npm to pnpm workspace.
- [x] **Infrastructure:** Buffer polyfill for browser compatibility with Babel packages.
- [x] **Infrastructure:** Process shim polyfill for Node.js globals.
- [x] **Infrastructure:** pnpm workspace configuration with .npmrc settings.

### Phase 6.5: Project Architecture (Completed)
- [x] **Architecture:** Introduce Project layer as a first-class concept in the data model.
- [x] **Store:** Add ProjectData type and projects state to componentStore.
- [x] **Store:** Implement initProjectLayer() for migration from legacy component-only structure.
- [x] **Store:** Add Project CRUD actions (createProject, renameProject, deleteProject, setActiveProject).
- [x] **Store:** Add computed selectors (getActiveProject, getActiveComponent, getAllComponents).
- [x] **Store:** Refactor all component actions to scope to active project.
- [x] **Store:** Update renderActiveComponent, updateNodeStyle, applyAstChangesToCode to use project-scoped data.
- [x] **Store:** Update undo/redo history to be per-component within project.
- [x] **Store:** Break down monolithic componentStore.ts into 9 modular files by concern.
- [x] **UI:** Create reusable ComponentSwitcher component for navbar.
- [x] **UI:** Add ComponentSwitcher to CompactNavbar as primary global control.
- [x] **UI:** Update LibraryPanel to show project name (editable) and component list.
- [x] **UI:** Add active component indicator (blue dot) in LibraryPanel.
- [x] **UI:** Update all 10+ UI components to use new nested project structure.
- [x] **Bug Fix:** Fixed preview rendering by correcting data access patterns.
- [x] **Bug Fix:** Fixed IframeCanvas, ComponentCanvas, and all Inspector panels.
- [x] **Bug Fix:** Fixed CodeEditorWithTabs to access correct component data.
- [ ] **Testing:** Verify migration from legacy structure preserves all data.
- [ ] **Testing:** Test component switching updates all panels correctly.
- [ ] **Testing:** Test example loading creates proper Project structure.

### Phase 7: Testing & Quality Assurance (Planned)
- [ ] **Testing:** Unit tests for core utilities (renderer, parser, styleUpdater).
- [ ] **Testing:** Integration tests for store actions and state management.
- [ ] **Testing:** End-to-end tests for complete user workflows.
- [ ] **Testing:** Component tests for UI controls and panels.
- [ ] **Testing:** Test coverage reporting and CI/CD integration.
- [ ] **Testing:** Performance testing and optimization.

### Phase 8: MCP Server Implementation (Planned)
- [ ] **MCP:** Design MCP server protocol for IDE integration.
- [ ] **MCP:** Implement MCP server with component editing capabilities.
- [ ] **MCP:** Add tool for opening Sorcery UI from IDE with context.
- [ ] **MCP:** Enable seamless code transfer between IDE and editor.
- [ ] **MCP:** Support for opening specific components from IDE selection.
- [ ] **MCP:** Bidirectional sync between IDE and Sorcery UI.

### Phase 9: Enhanced Component Support (Planned)
- [ ] **Support:** Full shadcn/ui component support with proper prop handling.
- [ ] **Support:** Aceternity UI components integration.
- [ ] **Support:** Magic UI components integration.
- [ ] **Support:** 21st.dev components integration.
- [ ] **Support:** Radix UI primitives support.
- [ ] **Support:** Headless UI components support.
- [ ] **Support:** Custom component library SDK for third-party integrations.

### Phase 10: Inspector Panel Refinement (Planned)
- [ ] **UX:** Streamline inspector panel UI controls for better usability.
- [ ] **UX:** Keyboard shortcuts for common inspector actions.
- [ ] **UX:** Quick actions menu for frequently used controls.
- [ ] **UX:** Preset system for common style combinations.
- [ ] **UX:** Style library for saving and reusing custom styles.
- [ ] **UX:** Copy/paste styles between elements.
- [ ] **UX:** Batch style editing for multiple elements.
- [ ] **UX:** Visual style history timeline.

### Phase 11: Component Library & Cloud Features (Planned)
- [ ] **Auth:** Implement user authentication (email/OAuth).
- [ ] **Auth:** User profile and session management.
- [ ] **Library:** Personal component library with cloud storage.
- [ ] **Library:** Save and retrieve components from cloud.
- [ ] **Library:** Component versioning and history.
- [ ] **Library:** Import/view components from external libraries (21st.dev, Magic UI, shadcn, Aceternity).
- [ ] **Library:** "Click to add" workflow for adding components to current session.
- [ ] **Library:** Component search and filtering.
- [ ] **Library:** Component tagging and categorization.
- [ ] **Library:** Share components via URL.

### Phase 12: AI & Advanced Features (Planned)
- [ ] **AI:** Create a backend service to analyze component code with an LLM and return a mock props JSON schema.
- [ ] **AI:** Natural language interface for finding relevant Tailwind utilities.
- [ ] **AI:** AI-powered component suggestions based on context.
- [ ] **AI:** Automatic accessibility improvements suggestions.
- [ ] **AI:** Code quality and best practices analysis.
- [ ] **UX:** Implement the "Figma-like" measurement guides.
- [ ] **Workflow:** Add an "Export to CodeSandbox" button that uses their API to create a new instance.
- [ ] **Workflow:** Export to StackBlitz integration.
- [ ] **Workflow:** Export to GitHub Gist.

### Phase 13: Platform & Deployment (Future)
- [ ] Transition to a shareable URL structure (`/editor/:id`).
- [ ] Begin design of a plugin-based architecture for third-party extensions.
- [ ] API Mocking: Integration with Mock Service Worker (MSW) to define mock API responses for data-fetching components.
- [ ] Deploy backend API to production (Render/Railway/Fly.io).
- [ ] Deploy frontend to production (Vercel/Netlify).
- [ ] Set up MongoDB Atlas production database.
- [ ] Configure CDN for asset delivery.
- [ ] Implement rate limiting and security measures.

### Miscellaneous Enhancements: 

- [ ] Move the dock to a bar on the left of the screen. 
- [ ] Display relevant Tailwind modifiers/utilities based on a brief AI call with info on what the user wants in natural language passed to the AI. With an optional "see all" button to just show the user everything.
- [ ] Implement contrast-aware selection highlighting (double-ring system).
- [ ] Settle on a style application policy - direct to elements/components v/s creation of global CSS classes with adjoining documentation. 

## 4. Component API Schema

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

## 5. Future Enhancements & Ideas

### Selection Highlight Contrast Strategy

**Problem:**
- Selection/highlight outlines can become invisible when the selected element uses the same color or very similar contrast as the accent outline.

**Recommended approach:**
- Use a contrast-aware, double-ring highlight: an inner accent ring (accent color, e.g. blue) plus an outer contrast ring chosen per-element (black or white with slight opacity) based on computed luminance of the element's background.
- Compute effective background by sampling getComputedStyle and walking up until a non-transparent background is found.
- Compute luminance and choose contrastColor = black/white depending on threshold. Render box-shadow or stacked outlines: `0 0 0 2px accent, 0 0 0 5px contrastColor`.

**Why this is robust:**
- The outer contrast ring guarantees visibility regardless of the element's fill color without reserving or hard-coding a special highlight color.
- Works for most solid-color and image-backed backgrounds; for extremely complex cases we can fallback to a small floating badge (id/type) rendered with the same contrastColor.

**Implementation notes:**
- Small, self-contained change: update `SelectionHighlighter` to sample computed style and set box-shadow accordingly.
- Add an optional small label (element tag / id) positioned near the outline when element size allows.
- Priority: low — UX polish to schedule as part of a later polish pass.

### Style Application Policy

**Decision needed:**
Settle on a style application policy - direct to elements/components v/s creation of global CSS classes with adjoining documentation.

**Considerations:**
- Direct application: Simpler implementation, immediate visual feedback
- Global CSS classes: Better for consistency, reusability, and documentation
- Hybrid approach: Allow both based on user preference or context 