import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { updateClassProperty } from '@/lib/tailwindParser';

interface ToggleProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string }>;
  };
  currentClassName: string;
  onClassChange: (newClassName: string) => void;
}

/**
 * Toggle component for enabling/disabling boolean Tailwind utility classes
 * Provides a visual toggle button interface for on/off type properties
 * @param {ToggleProps} props - Component props
 * @param {Object} props.definition - Definition object containing category, label, description, and classes
 * @param {string} props.definition.category - The toggle category (hidden, visible, etc.)
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Description text for the control
 * @param {Array} props.definition.classes - Array of available toggle classes
 * @param {string} props.currentClassName - Current className string to check toggle state
 * @param {Function} props.onClassChange - Callback function called when toggle state changes
 * @returns {JSX.Element} The Toggle component
 */
export const Toggle: React.FC<ToggleProps> = ({
  definition,
  currentClassName,
  onClassChange,
}) => {
  // Check if the class is currently applied
  const isActive = definition.classes.some(cls =>
    currentClassName.includes(cls.class)
  );

  const handleToggle = () => {
    const newClass = !isActive && definition.classes.length > 0 ? definition.classes[0].class : '';
    const newClassName = updateClassProperty(currentClassName, definition.category, newClass);
    onClassChange(newClassName);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Label className="text-xs font-medium">
          {definition.label}
        </Label>
        <p className="text-xs text-muted-foreground">
          {definition.description}
        </p>
      </div>
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        className="ml-2 w-8 h-8 p-0"
      >
        {isActive ? (
          <Check className="w-4 h-4" />
        ) : (
          <X className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};