# Phase 9 Implementation Guide: shadcn/ui Variant & Theme System

**Status:** Ready for Implementation  
**Duration:** 3-4 weeks  
**Complexity:** Medium-High

---

## **Overview**

Phase 9 adds comprehensive support for editing shadcn/ui and similar component libraries (Aceternity, Magic UI, 21st.dev) through their designed APIs: **variants**, **props**, and **theme CSS variables**.

### **What This Enables**

Users can:
1. ✅ **Switch variants visually** - Click to change `variant="outline"` to `variant="ghost"`
2. ✅ **Create custom variants** - Define new variants with custom Tailwind classes
3. ✅ **Edit component props** - Toggle `disabled`, change `size`, set `asChild`, etc.
4. ✅ **Customize theme variables** - Edit CSS variables like `--primary`, `--destructive`
5. ✅ **Import custom themes** - Paste theme CSS from tools like tweakcn.com
6. ✅ **Edit variant classes** - Modify the Tailwind classes that make up each variant

---

## **Core Concepts**

### **1. How shadcn Components Work**

shadcn components use **class-variance-authority (cva)** to define variants:

```typescript
// Button.tsx
import { cva } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium", // base
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({ variant, size, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant, size }))} {...props} />
  )
}
```

**Key insights:**
- Each variant is just a **string of Tailwind classes**
- Props control which variant classes get applied
- CSS variables (e.g., `--primary`) define the actual colors
- Users can customize via theme CSS or tailwind.config

---

### **2. What We're Building**

#### **Component Metadata Registry**
A schema system that describes each component:

```typescript
interface ComponentSchema {
  name: "Button",
  library: "shadcn/ui",
  
  variants: {
    variant: {
      type: "enum",
      options: [
        { value: "default", label: "Default", classes: "bg-primary..." },
        { value: "outline", label: "Outline", classes: "border..." },
        { value: "ghost", label: "Ghost", classes: "hover:bg-accent..." },
      ],
      default: "default"
    },
    size: {
      type: "enum",
      options: [
        { value: "sm", label: "Small", classes: "h-9..." },
        { value: "default", label: "Default", classes: "h-10..." },
        { value: "lg", label: "Large", classes: "h-11..." },
      ],
      default: "default"
    }
  },
  
  props: {
    disabled: { type: "boolean", default: false },
    asChild: { type: "boolean", default: false },
  },
  
  cssVariables: {
    default: ["--primary", "--primary-foreground"],
    destructive: ["--destructive", "--destructive-foreground"],
    outline: ["--input", "--background", "--accent"],
  }
}
```

#### **Variant Editor UI**
Visual interface showing all variants:

```
┌─────────────────────────────────────────┐
│ Button (shadcn/ui)                      │
├─────────────────────────────────────────┤
│ 📦 VARIANTS                             │
│                                         │
│ Variant:                                │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │ Default │ │ Outline │ │  Ghost  │   │ ← Click to switch
│ │   [✓]   │ │         │ │         │   │
│ └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│ Size: [default ▼]                      │
│                                         │
│ [+ Create Custom Variant]               │
│                                         │
├─────────────────────────────────────────┤
│ 🎛️ PROPS                                │
│                                         │
│ Disabled: [ ] (toggle)                  │
│ As Child: [ ] (toggle)                  │
│                                         │
├─────────────────────────────────────────┤
│ 🎨 THEME (CSS Variables)                │
│                                         │
│ Primary: [#0070f3] (color picker)      │
│ Destructive: [#dc2626]                  │
│ Background: [#ffffff]                   │
│                                         │
└─────────────────────────────────────────┘
```

#### **Custom Variant Creation**
Modal to define new variants:

```
┌─────────────────────────────────────────┐
│ Create Custom Variant                   │
├─────────────────────────────────────────┤
│ Variant Name:                           │
│ [success _______________________________]│
│                                         │
│ Base Variant: [default ▼]              │
│                                         │
│ Tailwind Classes:                       │
│ [bg-green-500 text-white hover:bg-green-│
│  600 ________________________________] │
│                                         │
│ Preview:                                │
│ ┌─────────┐                            │
│ │ Success │ ← Live preview             │
│ └─────────┘                            │
│                                         │
│ [Cancel]  [Create Variant]              │
└─────────────────────────────────────────┘
```

---

## **Implementation Phases**

### **Phase 9.1: Foundation (Days 1-5)**

**Goal:** Set up component detection and registry system

**Tasks:**
1. Create `lib/componentRegistry.ts` with registry interface
2. Define schema types in `store/types.ts`
3. Create JSON schemas for 5 core components (Button, Card, Badge, Input, Select)
4. Implement detection function that matches AST nodes to registry
5. Test detection with example components

**Deliverable:** Can detect when user selects a Button and retrieve its schema

---

### **Phase 9.2: Variant Editing (Days 6-10)**

**Goal:** Users can visually switch between variants

**Tasks:**
1. Create `VariantEditor.tsx` component
2. Display all variants from schema as cards/buttons
3. Highlight currently selected variant
4. Create `variantUpdater.ts` for surgical prop updates
5. Implement click-to-switch variant functionality
6. Test with Button, Card, Badge components

**Deliverable:** Click "Outline" button → code updates to `variant="outline"`

---

### **Phase 9.3: Prop Controls (Days 11-13)**

**Goal:** Users can toggle/edit component props

**Tasks:**
1. Create `PropEditor.tsx` component
2. Implement control factory (boolean → toggle, enum → dropdown, etc.)
3. Create `propUpdater.ts` for JSX attribute modification
4. Integrate into inspector panel
5. Test with various prop types

**Deliverable:** Toggle "Disabled" switch → code updates to `disabled={true}`

---

### **Phase 9.4: Theme Variables (Days 14-17)**

**Goal:** Users can customize CSS variables

**Tasks:**
1. Create `themeParser.ts` to extract CSS variables from class strings
2. Create `ThemeVariableEditor.tsx` component
3. Implement CSS variable → color/size control mapping
4. Support importing theme CSS from external sources
5. Real-time theme updates in iframe
6. Track customized vs default variables

**Deliverable:** Change `--primary` color → Button updates immediately on canvas

---

### **Phase 9.5: Custom Variants (Days 18-20)**

**Goal:** Users can create their own variants

**Tasks:**
1. Create `CustomVariantModal.tsx`
2. Implement variant name input and class editor
3. Live preview of custom variant
4. Extend `variantUpdater.ts` to modify CVA definitions
5. Store custom variants in project state
6. Test variant creation flow

**Deliverable:** Create "success" variant → adds to CVA and can be selected

---

### **Phase 9.6: Polish & Integration (Days 21-25)**

**Goal:** Complete, polished user experience

**Tasks:**
1. Reorganize inspector with Component/Theme/Classes tabs
2. Update store to persist custom variants and theme overrides
3. Extend "Apply Changes" to include variant and theme updates
4. Create comprehensive examples
5. Add tooltips, help text, error handling
6. Performance optimization
7. Update documentation

**Deliverable:** Fully functional variant/theme editing system

---

### **Phase 9.7: Extended Libraries (Days 26-30)**

**Goal:** Support for other component libraries

**Tasks:**
1. Create schemas for Aceternity components
2. Create schemas for Magic UI components
3. Create schemas for 21st.dev components
4. Implement library auto-detection
5. Handle library-specific patterns
6. Test cross-library compatibility

**Deliverable:** Works with multiple component libraries

---

## **Technical Architecture**

### **Component Detection Flow**

```
1. User clicks element on canvas
   ↓
2. SelectionHighlighter gets node ID
   ↓
3. Store finds SerializableElement by ID
   ↓
4. Extract component type (string or function name)
   ↓
5. Match against componentRegistry
   ↓
6. If match found:
   - Fetch ComponentSchema
   - Store in state
   - Trigger inspector update
   ↓
7. Inspector shows Component/Theme/Classes tabs
   ↓
8. User interacts with controls
   ↓
9. Updates flow through surgical updaters (variantUpdater, propUpdater, themeParser)
   ↓
10. Code is modified non-destructively
    ↓
11. AST regenerates and canvas updates
```

### **Surgical Update Strategy**

Similar to existing `styleUpdater.ts`, we create specialized updaters:

**variantUpdater.ts:**
```typescript
export function updateVariantProp(
  sourceCode: string,
  elementId: string,
  variantName: string,
  newValue: string
): string {
  // 1. Parse to Babel AST
  const ast = parse(sourceCode);
  
  // 2. Find JSX element
  traverse(ast, {
    JSXOpeningElement(path) {
      // Match by structure
      if (matchesTarget(path.node)) {
        // 3. Update variant prop
        updateOrAddAttribute(path.node, variantName, newValue);
      }
    }
  });
  
  // 4. Generate back to code
  return generate(ast).code;
}
```

**propUpdater.ts:**
```typescript
export function updateComponentProp(
  sourceCode: string,
  elementId: string,
  propName: string,
  propValue: unknown
): string {
  // Similar to variantUpdater but handles different value types
  // (boolean, string, number, expression)
}
```

**themeParser.ts:**
```typescript
export function updateThemeVariable(
  themeCss: string,
  varName: string,
  newValue: string
): string {
  // 1. Parse CSS string
  // 2. Find --varName in :root or .dark
  // 3. Update value
  // 4. Return updated CSS string
}
```

### **Store Updates**

```typescript
// Add to ComponentState in types.ts
interface ComponentState {
  // ... existing fields
  
  // NEW: Component registry and customizations
  componentRegistry: Record<string, ComponentSchema>;
  customVariants: Record<string, CustomVariantDefinition[]>; // Per component
  themeOverrides: Record<string, string>; // CSS variable overrides
  
  // NEW: Currently selected component metadata
  selectedComponentMetadata: ComponentSchema | null;
}

// Add actions
interface ComponentActions {
  // ... existing actions
  
  // NEW: Variant actions
  switchVariant: (elementId: string, variantName: string, value: string) => void;
  createCustomVariant: (componentName: string, variantDef: CustomVariantDefinition) => void;
  
  // NEW: Prop actions
  updateComponentProp: (elementId: string, propName: string, value: unknown) => void;
  
  // NEW: Theme actions
  updateThemeVariable: (varName: string, value: string) => void;
  importThemeCss: (css: string) => void;
}
```

---

## **Example Workflow**

### **Scenario: User Customizes a Button**

1. **User loads example with shadcn Button:**
   ```tsx
   <Button variant="default" size="lg">
     Click me
   </Button>
   ```

2. **User clicks Button on canvas**
   - Detection system identifies it as shadcn Button
   - Loads Button schema from registry
   - Inspector shows Component tab

3. **User switches variant to "outline"**
   - Clicks "Outline" card in VariantEditor
   - `switchVariant("node-5", "variant", "outline")` called
   - `variantUpdater.ts` modifies code:
     ```tsx
     <Button variant="outline" size="lg">
       Click me
     </Button>
     ```
   - Canvas updates immediately

4. **User changes size to "sm"**
   - Selects "sm" from size dropdown
   - Code updates to `size="sm"`
   - Button shrinks on canvas

5. **User customizes primary color**
   - Switches to Theme tab
   - Changes `--primary` from blue to purple
   - ThemeVariableEditor updates `themeCss`:
     ```css
     :root {
       --primary: 147 51 234; /* purple */
     }
     ```
   - Button color changes on canvas

6. **User creates custom "success" variant**
   - Clicks "Create Custom Variant"
   - Names it "success"
   - Adds classes: `bg-green-500 text-white hover:bg-green-600`
   - Previews it in modal
   - Clicks "Create"
   - `variantUpdater.ts` adds to CVA:
     ```typescript
     variants: {
       variant: {
         default: "...",
         outline: "...",
         success: "bg-green-500 text-white hover:bg-green-600" // NEW
       }
     }
     ```

7. **User clicks "Apply Changes"**
   - All updates (variant, size, theme, custom variant) written to code
   - Component code includes new variant definition
   - Theme CSS saved to project config

---

## **Success Criteria**

✅ Can detect 15+ shadcn components  
✅ Can switch between existing variants visually  
✅ Can create custom variants with preview  
✅ Can edit component props (size, disabled, asChild, etc.)  
✅ Can customize CSS variables with live preview  
✅ Can import theme CSS from external tools  
✅ All updates are non-destructive (preserve logic)  
✅ Changes apply correctly to source code  
✅ Works with Aceternity, Magic UI, 21st.dev components  
✅ Comprehensive documentation and examples  

---

## **File Checklist**

### **New Files to Create**

- [ ] `client/src/lib/componentRegistry.ts`
- [ ] `client/src/lib/variantUpdater.ts`
- [ ] `client/src/lib/propUpdater.ts`
- [ ] `client/src/lib/themeParser.ts`
- [ ] `client/src/lib/componentSchemas/shadcn/button.json`
- [ ] `client/src/lib/componentSchemas/shadcn/card.json`
- [ ] `client/src/lib/componentSchemas/shadcn/badge.json`
- [ ] `client/src/lib/componentSchemas/shadcn/input.json`
- [ ] `client/src/lib/componentSchemas/shadcn/select.json`
- [ ] `client/src/components/Inspector/VariantEditor.tsx`
- [ ] `client/src/components/Inspector/PropEditor.tsx`
- [ ] `client/src/components/Inspector/ThemeVariableEditor.tsx`
- [ ] `client/src/components/Inspector/CustomVariantModal.tsx`

### **Files to Modify**

- [ ] `client/src/store/types.ts` (add variant types)
- [ ] `client/src/store/componentActions.ts` (add variant actions)
- [ ] `client/src/components/Inspector/InspectorPanel.tsx` (integrate new editors)
- [ ] `client/src/lib/componentParser.ts` (add component detection)
- [ ] `client/src/examples/examples.ts` (add shadcn examples)

---

## **Testing Strategy**

1. **Unit Tests:**
   - variantUpdater: Correctly updates variant props
   - propUpdater: Handles all prop types
   - themeParser: Parses and updates CSS variables
   - Component detection: Matches correct schemas

2. **Integration Tests:**
   - Variant switching updates AST and code
   - Custom variant creation adds to CVA
   - Theme changes reflect on canvas
   - Apply Changes writes all updates

3. **Manual Testing:**
   - Test with all 15 shadcn components
   - Test with Aceternity/Magic UI components
   - Test theme import from tweakcn.com
   - Test custom variant creation workflow
   - Test with complex compound components (Dialog, Select)

---

## **Risk Mitigation**

**Risk 1:** CVA parsing complexity  
**Mitigation:** Start with simple variants, add compound variants later

**Risk 2:** CSS variable name mismatches  
**Mitigation:** Build comprehensive mapping from Tailwind tokens to CSS vars

**Risk 3:** Breaking user's custom component code  
**Mitigation:** Extensive testing, clear warnings, undo functionality

**Risk 4:** Performance with many components  
**Mitigation:** Lazy-load schemas, cache parsed results

---

## **Next Steps**

1. Review this plan with stakeholders
2. Set up project board with tasks from each phase
3. Begin Phase 9.1 implementation
4. Create initial schemas for Button, Card, Badge
5. Build detection system
6. Test with examples

**Ready to start? Let's build! 🚀**
