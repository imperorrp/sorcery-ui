import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { StyleEditor } from './StyleEditor';
import { ClassNameEditor } from './ClassNameEditor';
import { ModifierBuilder } from './ModifierBuilder';
import { ModifierStack, type ModifierValue } from './ModifierStack';
import { Layers, Brush, Search } from 'lucide-react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

// Import the definitions from tailwind-inspector.json
import tailwindInspectorDefinitions from '../../lib/definitions/tailwind-inspector.json';
// import { generateClassNameFromState } from '@/lib/utilityStateHelpers';

interface ControlDefinition {
  category: string;
  label: string;
  description: string;
  group: string;
  control: {
    type: string;
    [key: string]: unknown;
  };
  strategies?: Array<{
    type: string;
    classes?: Array<{ class: string; value?: string; label?: string }>;
    generative?: { template: string; dataset: string };
    arbitrary?: { template: string };
  }>;
  classes?: Array<{ class: string; value: string; label?: string }> | { "$ref": string };
  modifiers?: string[];
  supportsArbitrary?: boolean;
  structuralVariants?: Array<{ label: string; template: string }>;
  docUrl?: string;
}

/**
 * InspectorPanel component that provides a comprehensive tabbed interface for editing component properties.
 * 
 * This component serves as the main inspector interface for the visual editor, offering two primary tabs:
 * - Style tab: Visual styling controls for colors, fonts, layout, and other CSS properties
 * - Classes tab: Tailwind CSS class management with definition-driven controls organized in accordions
 * 
 * Key features include:
 * - Dynamic class token management with add/remove functionality
 * - Search filtering for property controls
 * - Session-based change tracking with visual indicators for new classes
 * - Accordion-based organization of controls by category (Layout, Typography, etc.)
 * - Integration with component store for state management
 * - Support for both utility state classes and manual className modifications
 * 
 * The component handles complex state management including:
 * - Selected node tracking and persistence during undo/redo operations
 * - Baseline tracking for change highlighting
 * - Dirty state management for apply changes workflow
 * 
 * @component
 * @returns {JSX.Element} The rendered InspectorPanel component with tabbed interface
 */
export const InspectorPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModifierStack, setActiveModifierStack] = useState<ModifierValue[]>([]);

  // Get current className from the store
  const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
  const selectedNodeId = useComponentStore((s) => s.selectedNodeId);
  const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
  const updateNodeClassName = useComponentStore((s) => s.updateNodeClassName);

  // Find the selected node
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !componentPreviewAst) return null;

    /**
     * Recursively searches the component AST to find a node by its ID.
     * 
     * This function traverses the component tree depth-first to locate the node
     * with the specified ID, handling nested component structures and string children.
     * 
     * @param {SerializableElement} node - The current node being examined in the traversal
     * @returns {SerializableElement | null} The found node with matching ID, or null if not found
     */
    const findNode = (node: SerializableElement): SerializableElement | null => {
      if (node.id === selectedNodeId) return node;
      if (node.props.children) {
        for (const child of node.props.children) {
          if (typeof child !== 'string') {
            const found = findNode(child);
            if (found) return found;
          }
        }
      }
      return null;
    };

    return findNode(componentPreviewAst);
  }, [selectedNodeId, componentPreviewAst]);

  // Determine effective node (selected node when available, otherwise root) and its className
  const effectiveNode = React.useMemo(() => selectedNode ?? componentPreviewAst, [selectedNode, componentPreviewAst]);

  // Store the last selected node to preserve class display when selection is cleared
  const [lastSelectedNode, setLastSelectedNode] = React.useState<SerializableElement | null>(null);
  
  // Update last selected node when selection changes
  React.useEffect(() => {
    if (selectedNode) {
      setLastSelectedNode(selectedNode);
    }
  }, [selectedNode]);

  // Use last selected node for class display if current selection is cleared
  const displayNode = React.useMemo(() => {
    // During undo/redo (selectedNodeId is null), we need to find the element in the current AST
    // that corresponds to the last selected element, so we can show its classes
    if (selectedNodeId === null && lastSelectedNode && componentPreviewAst) {
      /**
       * Recursively searches the component AST to find a node matching the last selected node's ID.
       * 
       * Used during undo/redo operations when selectedNodeId is null but we need to maintain
       * the display of classes for the previously selected element by finding its current
       * counterpart in the updated AST.
       * 
       * @param {SerializableElement} node - The current node being examined in the traversal
       * @returns {SerializableElement | null} The found node with matching ID, or null if not found
       */
      const findNode = (node: SerializableElement): SerializableElement | null => {
        if (node.id === lastSelectedNode.id) return node;
        if (node.props.children) {
          for (const child of node.props.children) {
            if (typeof child !== 'string') {
              const found = findNode(child);
              if (found) return found;
            }
          }
        }
        return null;
      };
      const currentSelectedNode = findNode(componentPreviewAst);
      if (currentSelectedNode) return currentSelectedNode;
    }
    
    return selectedNode || lastSelectedNode || effectiveNode;
  }, [selectedNodeId, selectedNode, lastSelectedNode, effectiveNode, componentPreviewAst]);

  // Track baseline (committed) class tokens for highlight diff during this editing session.
  // "Session" = since element selection changed or Apply Changes was invoked.
  const isDirty = useComponentStore(s => s.isDirty);
  const [sessionBaseline, setSessionBaseline] = React.useState<string>('');
  // Store which node the baseline belongs to so we only reset on element change
  const baselineNodeIdRef = React.useRef<string | null>(null);

  // Combined token string for the currently displayed node; used for add/remove and baseline
  const displayClassNameRef = React.useRef('');

  const classTokens = React.useMemo(() => {
    if (!displayNode) return [];
    
    // Get classes from utility state
    const utilityClasses = displayNode.utilityClassState 
      ? Object.values(displayNode.utilityClassState).filter(Boolean) as string[]
      : [];
    
    // Get classes from className prop that aren't already in utility state
    const classNameString = (displayNode.props.className as string) || '';
    const classNameClasses = classNameString.split(/\s+/).filter(Boolean);
    
    // Combine and deduplicate
    const allClasses = [...utilityClasses, ...classNameClasses];
    return [...new Set(allClasses)]; // Remove duplicates
  }, [displayNode]);

  // Keep a ref with the exact displayed class string (all tokens joined)
  React.useEffect(() => {
    displayClassNameRef.current = classTokens.join(' ');
  }, [classTokens]);

  // Reset baseline ONLY when selecting a different element (not during undo/redo)
  React.useEffect(() => {
    if (selectedNodeId !== null) {
      // Only when the selected id actually changes
      if (baselineNodeIdRef.current !== selectedNodeId) {
        setSessionBaseline(classTokens.join(' '));
        baselineNodeIdRef.current = selectedNodeId;
      }
    }
  }, [selectedNodeId, classTokens]);

  // After applying changes back to code, sync the baseline to current display
  React.useEffect(() => {
    if (!isDirty) {
      setSessionBaseline(classTokens.join(' '));
    }
  }, [isDirty, classTokens]);

  const addedTokens = React.useMemo(() => {
    if (!displayNode || !sessionBaseline) return [];
    
    // Get all current classes from displayNode (both utility state and className)
    const currentClasses = new Set(classTokens);
    
    // Get baseline classes
    const baseClasses = new Set(sessionBaseline.split(/\s+/).filter(Boolean));
    
    // Find classes that are in current but not in baseline
    const added: string[] = [];
    currentClasses.forEach(cls => {
      if (!baseClasses.has(cls)) {
        added.push(cls);
      }
    });
    
    return added;
  }, [displayNode, sessionBaseline, classTokens]);

  // Inline add-class input state
  const [newToken, setNewToken] = React.useState('');

  /**
   * Handles adding a new modifier to the active stack
   */
  const handleAddModifier = React.useCallback((modifier: ModifierValue) => {
    setActiveModifierStack(prev => [...prev, modifier]);
  }, []);

  /**
   * Handles updating a modifier value in the stack
   */
  const handleUpdateModifier = React.useCallback((index: number, value: string) => {
    setActiveModifierStack(prev => prev.map((mod, i) => 
      i === index ? { ...mod, value } : mod
    ));
  }, []);

  /**
   * Handles removing a modifier from the active stack
   */
  const handleRemoveModifier = React.useCallback((index: number) => {
    setActiveModifierStack(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Handles clearing all modifiers from the stack
   */
  const handleClearModifiers = React.useCallback(() => {
    setActiveModifierStack([]);
  }, []);

  /**
   * Generates the modifier prefix string for class generation
   */
  const modifierPrefix = React.useMemo(() => {
    if (activeModifierStack.length === 0) return '';
    
    const displayTexts = activeModifierStack.map(modifier => {
      if (modifier.requires && modifier.value) {
        return modifier.name.replace(`[${modifier.requires}]`, modifier.value);
      }
      return modifier.name;
    });
    
    return displayTexts.join(':') + ':';
  }, [activeModifierStack]);

  /**
   * Adds new CSS class tokens to the currently displayed element.
   * 
   * This function processes a space-separated string of class names, filters out
   * duplicates that are already applied, and updates the element's className
   * through the component store. Only non-duplicate classes are added to avoid
   * redundancy in the class list.
   * 
   * @param {string} text - Space-separated string of CSS class names to add
   * @returns {void}
   */
  const addTokens = React.useCallback((text: string) => {
    const raw = text.trim();
    if (!raw || !displayNode) return;
    const parts = raw.split(/\s+/).filter(Boolean);
    const existing = new Set(classTokens);
    const newClasses = parts.filter(p => !existing.has(p));
    if (newClasses.length > 0) {
      // For manual additions, update the className directly
      const targetId = selectedNodeId || displayNode?.id || null;
      if (targetId) {
        const currentClassName = displayClassNameRef.current;
        const updatedClassName = currentClassName ? `${currentClassName} ${newClasses.join(' ')}` : newClasses.join(' ');
        updateNodeClassName(targetId, updatedClassName);
      }
    }
  }, [classTokens, displayNode, selectedNodeId, updateNodeClassName]);

  // Group controls by their group field and filter by search
  const groupedControls = useMemo(() => {
    // Convert object to array of definitions
    const definitionsObject = tailwindInspectorDefinitions as unknown as Record<string, Omit<ControlDefinition, 'category'>>;
    const definitionsArray = Object.entries(definitionsObject).map(([category, definition]) => ({
      category,
      ...definition,
      classes: definition.classes, // Keep original classes intact
      modifiers: [] // Add empty modifiers array for compatibility
    })) as ControlDefinition[];

    // Filter by search query
    const filtered = searchQuery.trim()
      ? definitionsArray.filter(definition => {
          const query = searchQuery.toLowerCase();
          return definition.label.toLowerCase().includes(query) ||
                 definition.description.toLowerCase().includes(query) ||
                 definition.category.toLowerCase().includes(query) ||
                 definition.group.toLowerCase().includes(query);
        })
      : definitionsArray;

    // Group by the 'group' field
    const groups: Record<string, ControlDefinition[]> = {};
    filtered.forEach(control => {
      const group = control.group || 'Other';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(control);
    });

    return groups;
  }, [searchQuery]);

  // Sort groups according to the defined order
  const sortedGroups = React.useMemo(() => {
    const groupOrder = [
      'Layout',
      'Flexbox & Grid',
      'Spacing',
      'Sizing',
      'Typography',
      'Backgrounds',
      'Borders',
      'Effects',
      'Filters',
      'Tables',
      'Transitions & Animation',
      'Transforms',
      'Interactivity',
      'SVG',
      'Accessibility'
    ];

    const sorted: Record<string, ControlDefinition[]> = {};

    // Add groups in the defined order
    groupOrder.forEach(groupName => {
      if (groupedControls[groupName]) {
        sorted[groupName] = groupedControls[groupName];
      }
    });

    // Add any remaining groups not in the defined order
    Object.keys(groupedControls).forEach(groupName => {
      if (!sorted[groupName]) {
        sorted[groupName] = groupedControls[groupName];
      }
    });

    return sorted;
  }, [groupedControls]);

  

  if (!effectiveNode) {
    return (
      <div className="p-4 min-w-0">
        <p className="text-sm text-muted-foreground text-center py-4">Select an element to edit its className.</p>
      </div>
    );
  }

  return (
    <div className="p-4 min-w-0">
      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="flex w-full flex-wrap h-auto">
          <TabsTrigger value="style" className="flex items-center gap-2 flex-1 min-w-0">
            <Brush className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Style</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2 flex-1 min-w-0">
            <Layers className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium truncate">Classes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="mt-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Visual Styling</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Customize the appearance of selected elements with colors, fonts, and layout properties.
            </p>
          </div>
          <StyleEditor />
        </TabsContent>

        <TabsContent value="classes" className="mt-6">
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-4">
              Apply CSS classes to selected elements using definition-driven controls.
            </p>
          </div>

          {/* Global ClassName Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="classname-input" className="text-sm font-medium">Class Name</Label>
              {addedTokens.length > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  {addedTokens.length} new
                </span>
              )}
            </div>
            <div className="rounded-sm border bg-background/50 px-2 py-1 font-mono text-xs leading-relaxed flex flex-wrap gap-1 min-h-[34px]">
              {classTokens.length === 0 && (
                <span className="text-muted-foreground/60">(no classes)</span>
              )}
              {classTokens.map(token => (
                <span
                  key={token + (addedTokens.includes(token) ? '-new' : '')}
                  className={`px-1.5 py-0.5 rounded-sm border cursor-pointer select-none ${addedTokens.includes(token)
                    ? 'bg-emerald-100/80 border-emerald-400 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-600 ring-1 ring-emerald-300/60'
                    : 'bg-muted/40 border-transparent hover:border-border/60'} transition-colors`}
                  title={addedTokens.includes(token) ? 'New this session (not yet applied to source)' : 'Click to remove this class'}
                  onClick={() => {
                    // Confirm before removing
                    const ok = window.confirm(`Remove class "${token}"?`);
                    if (ok && displayNode) {
                      const targetId = selectedNodeId || displayNode?.id || null;
                      if (targetId) {
                        // Check if this token is from utility state or manual className
                        const utilityState = displayNode.utilityClassState || {};
                        const utilityClasses = Object.values(utilityState).filter(Boolean);
                        
                        if (utilityClasses.includes(token)) {
                          // This is a utility state class - find its category and remove it
                          const category = Object.keys(utilityState).find(key => utilityState[key] === token);
                          if (category) {
                            // Use updateUtilityClass to remove it properly
                            const { updateUtilityClass } = useComponentStore.getState();
                            updateUtilityClass(targetId, category, null);
                            return;
                          }
                        }
                        
                        // This is a manually added class - remove from className string
                        const currentClassName = displayClassNameRef.current;
                        const updatedClassName = currentClassName.split(/\s+/).filter(t => t !== token).join(' ');
                        updateNodeClassName(targetId, updatedClassName);
                      }
                    }
                  }}
                >
                  {token}
                </span>
              ))}
              {/* Inline add-class input chip */}
              <input
                id="classname-input"
                aria-label="Add class"
                placeholder="Add class"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') {
                    e.preventDefault();
                    addTokens(newToken);
                    setNewToken('');
                  }
                }}
                onBlur={() => {
                  if (newToken.trim()) {
                    addTokens(newToken);
                    setNewToken('');
                  }
                }}
                className="px-1.5 py-0.5 rounded-sm border bg-transparent outline-none text-xs min-w-[90px] placeholder:text-muted-foreground/70"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Green tokens are new since last apply / selection change. Click any token to remove it.
            </p>
          </div>

          {/* Modifiers Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Modifiers</Label>
            <p className="text-xs text-muted-foreground">
              Modifiers prefix all classes you add below. For example: hover:bg-blue-500
            </p>
            <ModifierStack
              modifiers={activeModifierStack}
              onRemoveModifier={handleRemoveModifier}
              onUpdateModifier={handleUpdateModifier}
              onClearAll={handleClearModifiers}
            />
            <ModifierBuilder
              onAddModifier={handleAddModifier}
              currentStack={activeModifierStack.map(m => m.name)}
            />
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          </div>

          {/* Accordion-based Controls */}
          <div className="space-y-2">
            <Accordion type="multiple" className="w-full">
              {Object.entries(sortedGroups).map(([groupName, groupControls]) => (
                <AccordionItem key={groupName} value={groupName}>
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    {groupName} ({groupControls.length})
                  </AccordionTrigger>
                  <AccordionContent className="max-h-96 overflow-y-auto px-1 pb-1">
                    <div className="flex flex-col gap-0.5">
                      {displayNode && groupControls.map((definition) => (
                        <ClassNameEditor
                          key={definition.category}
                          definition={definition}
                          selectedNode={displayNode}
                          modifierPrefix={modifierPrefix}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
