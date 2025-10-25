# Architecture & Design Principles: Sorcery UI

This document outlines the architectural decisions, design principles, and technical considerations for Sorcery UI.

## Core Architectural Principles

### State Management Philosophy

**Single Source of Truth:**
- The Zustand store serves as the central state authority
- All component state flows through the store for predictability
- UI components are reactive consumers of store state

**Immutable Updates:**
- Immer ensures all state mutations are immutable and predictable
- No direct mutations of state objects
- Copy-on-write semantics for all state changes

**Optimistic Updates:**
- UI updates immediately for responsive user experience
- Error handling and rollback mechanisms for failed operations
- Clear feedback for asynchronous operations

**History Management:**
- Full undo/redo capability with efficient history storage
- Snapshot-based history for complete state restoration
- Configurable history depth to manage memory usage

### Performance Considerations

**Virtual DOM Serialization:**
- Efficient conversion between React elements and JSON AST
- Minimal overhead for serialization/deserialization
- Cached serialization for repeated operations

**Debounced Updates:**
- All user inputs are debounced to prevent excessive re-renders
- Configurable debounce delays based on input type
- Batch updates when possible to minimize render cycles

**Lazy Loading:**
- Monaco Editor and other heavy components loaded on-demand
- Code splitting for route-based chunks
- Progressive enhancement for advanced features

**Memory Management:**
- Proper cleanup of event listeners and DOM references
- Weak references for large data structures when appropriate
- Regular garbage collection friendly patterns
- History pruning to prevent memory leaks

### Error Handling

**Graceful Degradation:**
- App continues functioning if individual features fail
- Isolated error boundaries for component failures
- Fallback UI for degraded states

**User Feedback:**
- Clear error messages for invalid code or network issues
- Toast notifications for non-blocking errors
- Modal dialogs for critical errors requiring user action

**Recovery Mechanisms:**
- Automatic retry for failed API calls with exponential backoff
- Local storage persistence for draft state
- Session recovery on page reload

**Validation:**
- Client-side validation before sending data to server
- Schema validation for all data inputs
- Type safety via TypeScript throughout

## Security Considerations

### DOMPurify Integration

**XSS Prevention:**
- All user-provided code is sanitized using DOMPurify before rendering
- HTML content within components is purified to prevent XSS attacks
- The Monaco Editor has content validation to prevent malicious code injection

**Sandboxing:**
- Components rendered in isolated iframe for script containment
- CSP headers to restrict inline script execution
- Sanitized props and context data

### Data Security

**Input Sanitization:**
- All user inputs sanitized before storage or rendering
- SQL injection prevention via parameterized queries (when DB implemented)
- Path traversal prevention for file operations

**Authentication & Authorization (Planned):**
- JWT-based authentication for API endpoints
- Role-based access control for component access
- Secure password hashing with bcrypt
- Session management with httpOnly cookies

**API Security:**
- Rate limiting to prevent abuse
- CORS configuration for allowed origins
- Request size limits to prevent DoS
- API key rotation and management

## Scalability Considerations

### Modular Architecture

**Component Design:**
- Components designed for easy extension and modification
- Clear separation of concerns (presentation, logic, state)
- Composable components with single responsibility

**Plugin System (Future):**
- Extensible plugin architecture for third-party extensions
- Well-defined plugin API and lifecycle hooks
- Sandboxed plugin execution

### Code Splitting

**Dynamic Imports:**
- Route-based code splitting for better initial load performance
- Lazy loading of heavy dependencies (Monaco, Babel)
- Prefetching for anticipated user actions

### Caching Strategy

**Component Caching:**
- Intelligent caching of parsed and rendered components
- Cache invalidation on code changes
- LRU cache for frequently accessed components

**Asset Caching:**
- CDN caching for static assets
- Service worker for offline capability (planned)
- Browser cache headers for optimal revalidation

## Data Flow Architecture

### Three-AST System

**Visual AST (componentAst):**
- Created with real React library
- Fully interactive with state management
- Used for live preview in iframe

**Preview AST (componentPreviewAst):**
- Created with shimmed React
- Static blueprint for UI structure
- Used for Navigator tree and style updates

**Source AST (Babel AST):**
- Temporary AST created on-demand
- Preserves all component logic
- Used for surgical code modifications

### Non-Destructive Updates

**Surgical Modification:**
- Parse source code to Babel AST
- Match visual changes to AST nodes
- Modify only style/className attributes
- Regenerate clean code via @babel/generator

**Logic Preservation:**
- Event handlers remain intact
- React hooks preserved exactly
- Component logic untouched
- Comments and formatting maintained

## Technology Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **State Management:** Zustand with Immer
- **Styling:** Tailwind CSS v4
- **Code Editor:** Monaco Editor
- **Build Tool:** Vite
- **UI Components:** Radix UI primitives
- **Parsing:** Babel (standalone)

### Backend (Planned)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **API:** RESTful with OpenAPI spec

### Infrastructure
- **Package Manager:** pnpm with workspaces
- **Version Control:** Git with conventional commits
- **Deployment:** Vercel (frontend), Render (backend)
- **Monitoring:** (TBD)

## Design Patterns

### Store Pattern
- Centralized state management with Zustand
- Slice-based organization for related state
- Computed values via selectors

### Factory Pattern
- Dynamic control generation via UtilityControlFactory
- Component instantiation based on definitions
- Extensible for new control types

### Observer Pattern
- Reactive store subscriptions
- Component re-rendering on state changes
- Efficient update propagation

### Command Pattern
- Undo/redo implementation via command history
- Replayable state transitions
- Time-travel debugging capability

### Adapter Pattern
- AST serialization/deserialization
- React element to JSON conversion
- External library integration

## Testing Strategy (Planned)

### Unit Tests
- Core utilities (renderer, parser, styleUpdater)
- Pure functions and helpers
- Store actions and reducers
- 80%+ code coverage target

### Integration Tests
- Store integration with components
- Multi-step workflows
- API endpoint interactions

### Component Tests
- UI component behavior
- User interaction scenarios
- Accessibility compliance

### End-to-End Tests
- Complete user workflows
- Cross-browser compatibility
- Performance benchmarks

## Future Considerations

### Microservices Architecture
- Separate services for rendering, AI, storage
- Message queue for async operations
- Service mesh for inter-service communication

### Real-time Collaboration
- WebSocket for live multi-user editing
- Operational transformation for conflict resolution
- Presence awareness for collaborators

### Edge Computing
- Edge rendering for low-latency preview
- Distributed component compilation
- Global CDN for asset delivery

### AI/ML Integration
- Component analysis and suggestions
- Automated accessibility fixes
- Style recommendation engine
- Natural language component search
