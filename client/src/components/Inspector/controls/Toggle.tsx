import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

interface ToggleProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string }>;
  };
  selectedNode: SerializableElement;
}

/**
 * Toggle component for boolean state control with visual feedback.
 * 
 * This component provides an elegant toggle button interface for enabling or disabling
 * boolean Tailwind utility classes. It offers clear visual feedback with check/X icons
 * and integrates seamlessly with the component store's utility state system for
 * properties like visibility, display states, and other binary CSS attributes.
 * 
 * Key features:
 * - Visual toggle button with check (active) and X (inactive) icons
 * - Automatic state detection from component utility state
 * - Single-click toggle functionality for quick state changes
 * - Consistent UI with shadcn/ui Button component and theme integration
 * - Support for multiple toggle classes with intelligent selection
 * - Real-time utility state synchronization
 * - Compact design optimized for inspector panels
 * 
 * The component handles the complexity of boolean state management while providing
 * an intuitive, accessible interface for binary property control in the visual editor.
 * It automatically selects the first available class when activating and clears
 * the utility class when deactivating.
 * 
 * @component
 * @param {ToggleProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata and toggle options
 * @param {string} props.definition.category - The boolean property category (e.g., 'hidden', 'visible', 'block', 'flex')
 * @param {string} props.definition.label - Display label for the toggle control
 * @param {string} props.definition.description - Descriptive text explaining the toggle's purpose
 * @param {Array<{class: string, value: string}>} props.definition.classes - Array of available toggle classes (typically one for active state)
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @returns {JSX.Element} The rendered Toggle component with visual state indication
 */
export const Toggle: React.FC<ToggleProps> = ({
  definition,
  selectedNode,
}) => {
  const { updateUtilityClass } = useComponentStore();

  // Check if the class is currently applied
  const isActive = !!(selectedNode.utilityClassState?.[definition.category]);

  /**
   * Handles toggle state changes and updates the component's utility state.
   * 
   * This function toggles between active and inactive states for the boolean property.
   * When activating, it selects the first available class from the definition. When
   * deactivating, it clears the utility class by setting it to null.
   * 
   * @returns {void}
   */
  const handleToggle = () => {
    const newClass = !isActive && definition.classes.length > 0 ? definition.classes[0].class : null;
    updateUtilityClass(selectedNode.id, definition.category, newClass);
  };

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      className="w-8 h-8 p-0"
    >
      {isActive ? (
        <Check className="w-4 h-4" />
      ) : (
        <X className="w-4 h-4" />
      )}
    </Button>
  );
};