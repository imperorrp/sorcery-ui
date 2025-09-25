import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

interface ControlRowProps {
  definition: {
    category: string;
    label: string;
    description?: string;
    group?: string;
    control?: {
      type: string;
      [key: string]: unknown;
    };
    classes?: Array<{ class: string; value?: string; label?: string }> | { "$ref": string };
    modifiers?: string[];
  };
  selectedNode: SerializableElement;
  children: React.ReactNode;
  className?: string;
}

/**
 * ControlRow component for dense, navigable inspector control layout.
 * 
 * This component provides a sophisticated layout system for inspector controls with
 * advanced UX features including anchor navigation, visual active state indicators,
 * hover-based reset functionality, and responsive grid-based design. It serves as
 * a wrapper for individual control components, providing consistent styling and
 * interaction patterns across the entire inspector interface.
 * 
 * Key features:
 * - Visual active state indicators with color-coded dots (emerald for active)
 * - Anchor-based navigation with unique IDs for each control category
 * - Hover-activated reset buttons for quick property clearing
 * - Responsive 3-column grid layout (label, control, actions)
 * - Tooltip integration for detailed control descriptions
 * - Theme-aware styling with smooth transitions
 * - Compact design optimized for high-density inspector panels
 * - Accessibility features with proper ARIA labels and keyboard navigation
 * 
 * The component handles complex state management for active/inactive states while
 * providing a clean, consistent interface that enhances the overall inspector UX.
 * It automatically detects when controls have applied values and provides appropriate
 * visual feedback and interaction options.
 * 
 * @component
 * @param {ControlRowProps} props - Component props
 * @param {Object} props.definition - Control definition object containing metadata and configuration
 * @param {string} props.definition.category - The property category this control manages
 * @param {string} props.definition.label - Display label for the control row
 * @param {string} [props.definition.description] - Optional detailed description for tooltips
 * @param {string} [props.definition.group] - Optional grouping category for organization
 * @param {Object} [props.definition.control] - Optional control type configuration
 * @param {Array<{class: string, value: string, label?: string}>|{$ref: string}} [props.definition.classes] - Optional class definitions or dataset references
 * @param {string[]} [props.definition.modifiers] - Optional modifier classes
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @param {React.ReactNode} props.children - The control component(s) to render in the layout
 * @param {string} [props.className] - Additional CSS classes for customization
 * @returns {JSX.Element} The rendered ControlRow component with advanced layout and interaction features
 */
export const ControlRow: React.FC<ControlRowProps> = ({
  definition,
  selectedNode,
  children,
  className = ''
}) => {
  const { updateUtilityClass } = useComponentStore();

  // Check if this control is currently active (has relevant classes applied)
  const isActive = React.useMemo(() => {
    /**
     * Determines if the control is currently active based on utility state.
     * 
     * This memoized value checks whether the current control category has any
     * applied utility classes, which determines the visual state of the control
     * row including the active indicator dot and reset button visibility.
     * 
     * @returns {boolean} True if the control category has applied utility classes
     */
    return !!(selectedNode.utilityClassState?.[definition.category]);
  }, [selectedNode.utilityClassState, definition.category]);

  /**
   * Handles reset functionality to clear the current control's utility class.
   * 
   * This function removes the applied utility class for the current control category,
   * effectively resetting the property to its default state. It's called when the
   * user clicks the reset button that appears on hover for active controls.
   * 
   * @returns {void}
   */
  const handleReset = React.useCallback(() => {
    if (!definition.category) return;
    updateUtilityClass(selectedNode.id, definition.category, null);
  }, [selectedNode.id, definition.category, updateUtilityClass]);

  return (
    <div
      id={`control-${definition.category}`}
      className={`group grid items-center gap-2 py-1 rounded-sm transition-colors ${isActive ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : 'hover:bg-muted/40'} ${className}`}
      style={{ gridTemplateColumns: '140px 1fr 24px' }}
    >
      {/* Column 1: Active indicator + label (with tooltip) */}
      <div className="flex items-center gap-1.5 w-[140px] shrink-0 min-w-0 overflow-hidden">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-inset transition-colors ${
            isActive ? 'bg-emerald-500 ring-emerald-600' : 'bg-muted ring-border'
          }`}
        />
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Label
                className="text-xs font-medium truncate cursor-help text-muted-foreground group-hover:text-foreground transition-colors"
              >
                {definition.label}
              </Label>
            </TooltipTrigger>
            {definition.description && (
              <TooltipContent side="right" align="start" className="max-w-xs">
                <p className="text-xs leading-snug">{definition.description}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Column 2: Control component container */}
      <div className="flex items-center min-w-0">
        <div className="w-full min-w-0 [&_*]:text-xs flex items-center gap-1">{/* Allow controls to shrink & unify font size */}
          {children}
        </div>
      </div>

      {/* Column 3: Reset button (space reserved to prevent layout shift) */}
      <div className="flex items-center justify-end w-6">
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
            title={`Reset ${definition.label}`}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};