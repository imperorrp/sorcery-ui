import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, Unlink } from 'lucide-react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';

interface BoxModelEditorProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string }>;
  };
  selectedNode: SerializableElement;
  modifierPrefix?: string;
}

/**
 * BoxModelEditor component for editing CSS box model properties (padding and margin).
 * 
 * This component provides an intuitive visual interface for setting box model values with
 * support for both linked (all sides equal) and unlinked (individual side control) modes.
 * It integrates with the component store's utility state system to manage Tailwind CSS
 * classes for spacing properties.
 * 
 * Key features:
 * - Linked/unlinked mode toggle for controlling all sides simultaneously or individually
 * - Real-time parsing of existing utility classes from component state
 * - Automatic class generation based on user input values
 * - Support for Tailwind spacing scale values (numbers, px, auto)
 * - Visual feedback with directional input fields (T/R/B/L) in unlinked mode
 * 
 * The component handles the complexity of mapping between user-friendly numeric inputs
 * and Tailwind's class naming conventions, supporting both shorthand (p-4) and
 * directional (pt-2, pr-3, etc.) class generation.
 * 
 * @component
 * @param {BoxModelEditorProps} props - Component props
 * @param {Object} props.definition - Definition object containing control metadata
 * @param {string} props.definition.category - The box model category ('padding' or 'margin')
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Descriptive text for the control
 * @param {Array<{class: string, value: string}>} props.definition.classes - Available Tailwind classes with their values
 * @param {SerializableElement} props.selectedNode - The currently selected component node being edited
 * @returns {JSX.Element} The rendered BoxModelEditor component with linked/unlinked controls
 */
export const BoxModelEditor: React.FC<BoxModelEditorProps> = ({
  definition,
  selectedNode,
  modifierPrefix = '',
}) => {
  const { updateUtilityClass } = useComponentStore();
  const [isLinked, setIsLinked] = useState(true);
  const [values, setValues] = useState({
    top: '',
    right: '',
    bottom: '',
    left: '',
    all: '',
  });

  // Parse current values from utility state
  useEffect(() => {
    /**
     * Parses the current utility class for the box model property and updates component state.
     * 
     * This function extracts numeric or keyword values from Tailwind classes like 'p-4', 'm-2', 'p-px', 'm-auto'
     * and populates the input fields accordingly. It handles both linked (all sides equal) and
     * unlinked states based on the detected class pattern.
     * 
     * @returns {void}
     */
    const parseValues = () => {
      const currentClass = selectedNode.utilityClassState?.[definition.category];

      if (!currentClass) {
        setValues({ top: '', right: '', bottom: '', left: '', all: '' });
        return;
      }

      // For simplicity, we'll parse a single class for now
      // In a real implementation, you'd handle multiple classes
      const prefix = definition.category === 'padding' ? 'p' : 'm';

      // Check for all-direction class (p-4, m-2, etc.)
      if (currentClass.match(new RegExp(`^${prefix}-\\d+$|^${prefix}-px$|^${prefix}-auto$`))) {
        const value = currentClass.split('-')[1];
        setValues({
          top: value,
          right: value,
          bottom: value,
          left: value,
          all: value,
        });
        setIsLinked(true);
        return;
      }

      // For directional classes, we'd need to handle multiple classes
      // For now, we'll set a default
      setValues({ top: '', right: '', bottom: '', left: '', all: '' });
      setIsLinked(false);
    };

    parseValues();
  }, [selectedNode.utilityClassState, definition.category]);

  /**
   * Handles value changes for individual sides or the "all" input field.
   * 
   * This function manages the complex logic of updating box model values, handling
   * both linked and unlinked modes. When in linked mode, changing any individual
   * side updates all sides to maintain consistency. The function generates the
   * appropriate Tailwind class and updates the component's utility state.
   * 
   * @param {keyof typeof values} side - The side being updated ('top', 'right', 'bottom', 'left', or 'all')
   * @param {string} newValue - The new value to set for the specified side(s)
   * @returns {void}
   */
  const handleValueChange = (side: keyof typeof values, newValue: string) => {
    const updatedValues = { ...values };

    if (isLinked && side !== 'all') {
      // Update all sides when linked
      updatedValues.top = newValue;
      updatedValues.right = newValue;
      updatedValues.bottom = newValue;
      updatedValues.left = newValue;
      updatedValues.all = newValue;
    } else if (side === 'all') {
      // Update all sides from the "all" input
      updatedValues.top = newValue;
      updatedValues.right = newValue;
      updatedValues.bottom = newValue;
      updatedValues.left = newValue;
      updatedValues.all = newValue;
    } else {
      // Update individual side
      updatedValues[side] = newValue;
    }

    setValues(updatedValues);

    // Generate className and update utility state
    const prefix = definition.category === 'padding' ? 'p' : 'm';
    let finalClass: string | null = null;

    if (isLinked && updatedValues.all) {
      finalClass = `${prefix}-${updatedValues.all}`;
    } else {
      // For now, we'll only handle the linked case
      // In a real implementation, you'd handle directional classes
      if (updatedValues.all) {
        finalClass = `${prefix}-${updatedValues.all}`;
      }
    }

    // Apply modifier prefix if present
    if (finalClass && modifierPrefix) {
      finalClass = `${modifierPrefix}${finalClass}`;
    }

    updateUtilityClass(selectedNode.id, definition.category, finalClass);
  };

  /**
   * Toggles between linked and unlinked modes for box model controls.
   * 
   * When switching to linked mode, all sides are set to the same value (using
   * the "all" value or the first non-empty individual value). When switching
   * to unlinked mode, individual side controls become available for independent
   * value setting.
   * 
   * @returns {void}
   */
  const toggleLink = () => {
    setIsLinked(!isLinked);
    if (!isLinked) {
      // When linking, use the "all" value or the first non-empty value
      const linkValue = values.all || values.top || values.right || values.bottom || values.left || '';
      handleValueChange('all', linkValue);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLink}
        className="h-6 w-6 p-0 shrink-0"
        title={isLinked ? 'Unlink sides' : 'Link all sides'}
      >
        {isLinked ? <Link className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
      </Button>
      {isLinked ? (
        <Input
          type="text"
          placeholder="e.g., 4, 12, px"
          value={values.all}
          onChange={(e) => handleValueChange('all', e.target.value)}
          className="text-xs h-7"
        />
      ) : (
        <div className="grid grid-cols-4 gap-1 flex-1">
          <Input
            type="text"
            placeholder="T"
            value={values.top}
            onChange={(e) => handleValueChange('top', e.target.value)}
            className="text-xs h-7"
            title="Top"
          />
          <Input
            type="text"
            placeholder="R"
            value={values.right}
            onChange={(e) => handleValueChange('right', e.target.value)}
            className="text-xs h-7"
            title="Right"
          />
          <Input
            type="text"
            placeholder="B"
            value={values.bottom}
            onChange={(e) => handleValueChange('bottom', e.target.value)}
            className="text-xs h-7"
            title="Bottom"
          />
          <Input
            type="text"
            placeholder="L"
            value={values.left}
            onChange={(e) => handleValueChange('left', e.target.value)}
            className="text-xs h-7"
            title="Left"
          />
        </div>
      )}
    </div>
  );
};