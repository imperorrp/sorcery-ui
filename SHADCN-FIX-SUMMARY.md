# Shadcn Components Fix - Root Cause Analysis and Solution

## The Core Problem

The visual editor showed **zero classes** in the inspector when selecting shadcn Button components, despite the rendered button having many Tailwind classes applied.

### Why This Happened

**The architecture reads className from React Element props, not from rendered DOM:**

1. Source code: `<Button variant="outline">Click</Button>`
2. Button component uses CVA (class-variance-authority) to compute classes: `className={cn(buttonVariants({ variant, size, className }))}`
3. The Preview AST serializes the Button React Element, capturing its props AS-IS from source
4. The Button's props.className in source code is literally the prop passed (empty/undefined), not the computed result
5. Inspector reads `displayNode.props.className` → gets nothing
6. Meanwhile, the actual rendered `<button>` DOM element HAS all the computed classes

**The mismatch:** React Element props contain INPUT values, DOM elements contain OUTPUT values. For computed properties like shadcn's className, we need the OUTPUT.

## The Solution

### Part 1: Inspector Reads Computed Classes from DOM (IMPLEMENTED ✅)

Modified `InspectorPanel.tsx` to query the actual DOM element when displaying classes:

```typescript
// For function components (like Button), read className from rendered DOM
if (selectedNodeId !== null && typeof displayNode.type === 'function') {
  try {
    const iframe = document.querySelector('iframe');
    const wrapperSpan = iframe?.contentDocument?.querySelector(`[data-node-id="${selectedNodeId}"]`);
    const firstElementChild = wrapperSpan?.querySelector('*') as HTMLElement;
    
    if (firstElementChild?.className) {
      // Use the actual computed className from DOM
      classNameString = firstElementChild.className;
    }
  } catch {
    // Fall back to React prop if DOM query fails
  }
}
```

**How it works:**
- Function components are wrapped in `<span data-node-id="X" style="display: contents">` for selection
- The inspector queries this wrapper, then gets its first element child (the actual rendered element)
- Reads the `className` property from the DOM element, which contains all computed classes
- This shows users the ACTUAL classes applied by CVA/cn helpers

**Why this doesn't break the architecture:**
- Preview AST structure remains unchanged (no expansion)
- styleUpdater/classNameUpdater still work with 1:1 structural match
- Only the DISPLAY of classes in inspector is enhanced

### Part 2: Applying Changes (TODO - DESIGN DECISION NEEDED ⚠️)

When user modifies classes on a shadcn component, we have two paths:

#### Option A: Merge Changes into Component's className Prop
User adds `text-red-500` to Button → Apply as:
```tsx
<Button variant="outline" className="text-red-500">Click</Button>
```

The Button component will merge this with its computed classes via `cn(buttonVariants(...), className)`.

**Pros:** 
- Respects component API
- User additions persist and merge correctly
- Aligns with how developers use shadcn components

**Cons:**
- More complex updater logic (detect function component, modify specific prop)
- Need to handle prop merging (append to existing className, don't replace)

#### Option B: Declare Library Component Internals Non-Editable
Show computed classes in inspector (read-only), but disable editing for library components.

**Pros:**
- Simpler implementation
- Avoids architectural complexity
- Clear boundaries

**Cons:**
- Reduced UX - users can't quickly tweak library component styles
- May require exposing variant editors instead (Phase 9 feature)

## Architectural Insights

### The Three-AST System and Why It Works

The visual editor uses THREE representations:

1. **Source Code AST (Babel):** Single source of truth for component logic
2. **Runtime AST (React):** Interactive rendering with state, events, hooks
3. **Preview AST (Shimmed React):** Safe editing blueprint with hooks disabled

**Critical constraint:** Preview AST structure must match Source Code AST structure for "surgical updates" to work. The styleUpdater and classNameUpdater use parallel recursive traversal - they walk both trees simultaneously, matching nodes by structure.

### Why Component Expansion Breaks Things

Initial attempt: Expand function components in Preview AST to show internal structure.

Result: Preview AST had `<button>` child, Source AST had `<Button>` parent → no structural match → updater fails.

### Why NOT Expanding Works

Current state: Don't expand Button in Preview AST (it has children, so expansion is skipped).

Result:
- Preview AST has `<Button variant="outline">` node
- Source AST has `<Button variant="outline">` JSX element
- Structural match preserved ✅
- Updater can find and modify the Button node
- Inspector enhanced to read computed DOM className separately

## Test Case

### Setup
1. Load shadcn Button Multi-Component Example
2. Render ButtonDemo component
3. Click on any rendered button (e.g., "Outline" button)

### Expected Behavior (WITH FIX)
✅ Inspector shows all computed Tailwind classes: `inline-flex`, `items-center`, `justify-center`, `border`, `border-input`, etc.
✅ Classes are read from actual DOM element, not React props
✅ User can see what classes CVA/cn computed

### Expected Behavior (BEFORE FIX)
❌ Inspector showed zero classes or only explicitly passed className
❌ Computed classes from buttonVariants() were invisible

## Files Modified

1. **`client/src/components/Inspector/InspectorPanel.tsx`** (lines 242-276)
   - Enhanced `classTokens` useMemo to query DOM for function components
   - Added fallback logic if DOM query fails
   - Preserved existing behavior for native elements

2. **`client/src/store/componentStore.ts`** (line 107)
   - Added `selectedComponentMetadata: null` to initial state
   - Imported `ComponentSchema` type

3. **`client/src/lib/componentParser.ts`** (lines 83-115)
   - Reverted overly aggressive expansion
   - Only expand function components when they have NO children (leaf components)
   - Preserves component wrapper structure for updater compatibility

## Next Steps

1. **DECISION:** Choose Option A (merge className) or Option B (read-only library components)

2. **If Option A:**
   - Modify `styleUpdater.ts` and `classNameUpdater.ts` to detect function components
   - When updating function component, modify its `className` prop instead of children
   - Handle prop merging: append classes, don't replace

3. **If Option B:**
   - Add `isReadOnly` flag to SerializableElement for library components
   - Disable class editing UI in inspector when `isReadOnly === true`
   - Consider implementing Variant Editor (Phase 9) for structured component prop editing

4. **Testing:**
   - Extend existing test suite to cover shadcn components
   - Test case: Select Button, modify classes, apply changes, verify source code updated correctly
   - Test edge cases: Button with existing className, nested library components

## Related Files & Concepts

- **`client/src/lib/componentDetector.ts`**: Detects shadcn-like components via heuristics
- **`client/src/lib/cvaExtractor.ts`**: Extracts CVA variant metadata (Phase 9)
- **`client/src/store/types.ts`**: Defines `ComponentSchema` for variant-aware components
- **`client/src/components/Inspector/VariantEditor.tsx`**: Phase 9 - structured prop editing UI
- **Smart Selection** (`renderer.ts` `pruneChildComponents`): Removes library component children from preview AST at depth > 0
- **Surgical Updates** (`styleUpdater.ts`, `classNameUpdater.ts`): Parallel AST traversal for precise code modifications

## Conclusion

The fix successfully makes shadcn component classes visible in the inspector by bridging the gap between React Element props (input) and rendered DOM (output). The architectural constraint of 1:1 AST structure matching is preserved, ensuring the visual editor's core "surgical update" mechanism continues to work.

The remaining work is determining how to handle user modifications - either by merging into the component's className prop (respecting the component API) or by making library components read-only and directing users to variant editors for structured editing.
