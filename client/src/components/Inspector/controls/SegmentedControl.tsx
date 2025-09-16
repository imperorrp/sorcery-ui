import React from 'react';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { updateClassProperty } from '@/lib/tailwindParser';

interface SmartSegmentedControlProps {
  definition: {
    category: string;
    label: string;
    description: string;
    classes: Array<{ class: string; value: string; label?: string }>;
  };
  currentClassName: string;
  onClassChange: (newClassName: string) => void;
  options?: Array<{ value: string; label?: string }>;
}

export const SmartSegmentedControl: React.FC<SmartSegmentedControlProps> = ({
  definition,
  currentClassName,
  onClassChange,
  options,
}) => {
  // Find current selection
  const currentClass = definition.classes.find(cls =>
    currentClassName.includes(cls.class)
  );

  const currentValue = currentClass?.class || '';

  const handleValueChange = (value: string) => {
    const newClassName = updateClassProperty(currentClassName, definition.category, value);
    onClassChange(newClassName);
  };

  // Use provided options or generate from definition.classes
  const controlOptions = options || definition.classes.map(cls => ({
    value: cls.class,
    label: cls.label || cls.class,
  }));

  return (
    <div>
      <Label className="text-xs font-medium mb-1 block">
        {definition.label}
      </Label>
      <SegmentedControl
        value={currentValue}
        onValueChange={handleValueChange}
        options={controlOptions}
        className="w-full"
      />
      <p className="text-xs text-muted-foreground mt-1">
        {definition.description}
      </p>
    </div>
  );
};