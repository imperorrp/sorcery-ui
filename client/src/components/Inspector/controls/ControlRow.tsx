import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    docUrl?: string;
    notes?: string;
  };
  children: React.ReactNode;
  className?: string;
  /**
   * Indicates whether any variant within this control currently has an applied utility class.
   */
  isActive?: boolean;
  /**
   * Callback invoked when the control's reset action is triggered.
   */
  onReset?: () => void;
  currentClass?: string | null;
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
 * The component delegates state management responsibilities to parent containers,
 * receiving active state and reset callbacks as props while ensuring the visual
 * presentation remains consistent across the inspector.
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
 * @param {React.ReactNode} props.children - The control component(s) to render in the layout
 * @param {string} [props.className] - Additional CSS classes for customization
 * @param {boolean} [props.isActive] - Flag indicating if any variant of the control is active
 * @param {() => void} [props.onReset] - Callback that clears all associated utility classes
 * @returns {JSX.Element} The rendered ControlRow component with advanced layout and interaction features
 */
export const ControlRow: React.FC<ControlRowProps> = ({
  definition,
  children,
  className = '',
  isActive,
  onReset
  , currentClass = null
}) => {
  const controlId = definition.category;
  const displayLabel = definition.label;
  const displayDescription = definition.description;
  const displayNotes = definition.notes;
  const docUrl = definition.docUrl;

  const isControlActive = Boolean(isActive);

  return (
    <div
      id={`control-${controlId}`}
      className={`group grid items-start gap-2 py-3 rounded-sm transition-colors ${
        isControlActive ? 'bg-emerald-50/50 dark:bg-emerald-950/30' : 'hover:bg-muted/40'
      } grid-cols-[minmax(140px,1fr)_1fr_24px] sm:grid-cols-[140px_1fr_24px] ${className}`}
    >
      {/* Column 1: Active indicator + label + description (with info icon tooltip) */}
      <div className="flex flex-col gap-1 w-full sm:w-[140px] shrink-0 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-inset transition-colors ${
              isControlActive ? 'bg-emerald-500 ring-emerald-600' : 'bg-muted ring-border'
            }`}
          />
          <div className="flex items-center gap-1 min-w-0">
            <Label
              className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors"
            >
              {displayLabel}
            </Label>
            {docUrl && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 opacity-60 hover:opacity-100 transition-opacity"
                      title="View documentation and notes"
                    >
                      <Info className="h-2.5 w-2.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" align="start" className="max-w-sm">
                    <div className="space-y-2">
                      {displayNotes && (
                        <p className="text-xs leading-snug text-muted-foreground">{displayNotes}</p>
                      )}
                      {docUrl && (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          View documentation →
                        </a>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        {displayDescription && (
          <div className="text-xs text-muted-foreground leading-relaxed pl-3.5">
            {displayDescription.replace(/^Utilities for controlling\s+/i, '')}
          </div>
        )}
        {currentClass && (
          <div className="text-xs text-muted-foreground font-mono pl-3.5 bg-muted/50 px-2 py-1 rounded border">
            {currentClass}
          </div>
        )}
      </div>

      {/* Column 2: Control component container */}
      <div className="flex items-center min-w-0 col-span-2 sm:col-span-1">
        <div className="w-full min-w-0 [&_*]:text-xs flex items-center gap-1">{/* Allow controls to shrink & unify font size */}
          {children}
        </div>
      </div>

      {/* Column 3: Reset button (space reserved to prevent layout shift) */}
      <div className="flex items-center justify-end w-6 col-start-3 row-start-1 sm:row-start-auto">
        {isControlActive && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
            title={`Reset ${displayLabel}`}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};