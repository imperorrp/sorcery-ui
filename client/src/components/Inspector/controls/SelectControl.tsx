import React from 'react';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { updateClassProperty } from '@/lib/tailwindParser';

interface SelectControlProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string; label?: string }>;
  };
  currentClassName: string;
  onClassChange: (newClassName: string) => void;
}

/**
 * SelectControl component for choosing from predefined class options
 * Provides a dropdown interface for selecting Tailwind utility classes
 * @param {SelectControlProps} props - Component props
 * @param {Object} props.definition - Definition object containing category, label, description, and classes
 * @param {string} props.definition.category - The category of the control
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Description text for the control
 * @param {Array} props.definition.classes - Array of available class options with class, value, and optional label
 * @param {string} props.currentClassName - Current className string to determine selected option
 * @param {Function} props.onClassChange - Callback function called when selection changes
 * @returns {JSX.Element} The SelectControl component
 */
export const SelectControl: React.FC<SelectControlProps> = ({
  definition,
  currentClassName,
  onClassChange,
}) => {
  // Find current selection by checking which class is present in currentClassName
  const currentClass = definition.classes.find(cls =>
    currentClassName.includes(cls.class)
  );

  const handleSelectionChange = (selectedClass: string) => {
    // Use updateClassProperty to intelligently replace the old class with the new one
    const newClassName = updateClassProperty(
      currentClassName,
      definition.category,
      selectedClass
    );
    onClassChange(newClassName);
  };

  return (
    <div>
      <Label className="text-xs font-medium mb-1 block">
        {definition.label}
      </Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            {currentClass?.label || currentClass?.class || 'Select option'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
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
      <p className="text-xs text-muted-foreground mt-1">
        {definition.description}
      </p>
    </div>
  );
};