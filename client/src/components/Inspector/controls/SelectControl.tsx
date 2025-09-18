import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

interface SelectControlProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string; label?: string }>;
  };
  selectedNode: SerializableElement;
}

/**
 * SelectControl component for dropdown selection of Tailwind utility classes.
 * 
 * This component provides an elegant dropdown interface for selecting from predefined
 * sets of Tailwind CSS utility classes, commonly used for properties like border styles,
 * text transforms, overflow behaviors, and other categorical CSS properties. It integrates
 * seamlessly with the component store's utility state system and provides clear visual
 * feedback for the current selection.
 * 
 * Key features:
 * - Dropdown menu interface with proper z-indexing for overlay management
 * - Automatic current selection detection and display from utility state
 * - "None" option for clearing selections and removing utility classes
 * - Label fallback system (uses label if available, otherwise class name)
 * - Real-time utility state synchronization with component store
 * - Consistent UI with shadcn/ui DropdownMenu components
 * 
 * The component handles the complexity of option management and state synchronization
 * while providing an intuitive, accessible interface for categorical property selection
 * in the visual editor.
 * 
 * @component
 * @param {SelectControlProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata and class options
 * @param {string} props.definition.category - The property category (e.g., 'borderStyle', 'textTransform', 'overflow')
 * @param {string} props.definition.label - Display label for the dropdown control
 * @param {string} props.definition.description - Descriptive text explaining the control's purpose
 * @param {Array<{class: string, value: string, label?: string}>} props.definition.classes - Array of available Tailwind classes with optional display labels
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @returns {JSX.Element} The rendered SelectControl component with dropdown selection interface
 */
export const SelectControl: React.FC<SelectControlProps> = ({
  definition,
  selectedNode,
}) => {
  const { updateUtilityClass } = useComponentStore();

  // The state for this control is now stored directly in the node's utilityClassState
  const currentValue = selectedNode.utilityClassState?.[definition.category] || '';

  /**
   * Handles dropdown selection changes and updates the component's utility state.
   * 
   * This function processes user selections from the dropdown menu, updating the
   * component store with the selected Tailwind class. Empty string selections
   * result in clearing the utility class (setting it to null) for the "None" option.
   * 
   * @param {string} selectedClass - The selected Tailwind class name, or empty string to clear
   * @returns {void}
   */
  const handleSelectionChange = (selectedClass: string) => {
    // This is now simple, direct, and unambiguous.
    // We are updating the category with the class or null to remove it.
    updateUtilityClass(selectedNode.id, definition.category, selectedClass || null);
  };

  // Find the current label for display
  const currentOption = definition.classes.find(cls => cls.class === currentValue);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            {currentOption?.label || currentOption?.class || 'Select option'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 z-[100]">
          <DropdownMenuItem onClick={() => handleSelectionChange('')}>
            None
          </DropdownMenuItem>
          {definition.classes.map((option) => (
            <DropdownMenuItem
              key={option.class}
              onClick={() => handleSelectionChange(option.class)}
            >
              {option.label || option.class}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};