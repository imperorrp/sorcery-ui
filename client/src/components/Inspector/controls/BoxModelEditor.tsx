import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link, Unlink } from 'lucide-react';
import { updateClassProperty } from '@/lib/tailwindParser';

interface BoxModelEditorProps {
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
 * BoxModelEditor component for editing padding and margin properties
 * Provides a visual interface for setting box model values with linked/unlinked controls
 * @param {BoxModelEditorProps} props - Component props
 * @param {Object} props.definition - Definition object containing category, label, description, and classes
 * @param {string} props.definition.category - The category (padding or margin)
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Description text for the control
 * @param {Array} props.definition.classes - Array of available classes with class and value properties
 * @param {string} props.currentClassName - Current className string to parse values from
 * @param {Function} props.onClassChange - Callback function called when className changes
 * @returns {JSX.Element} The BoxModelEditor component
 */
export const BoxModelEditor: React.FC<BoxModelEditorProps> = ({
  definition,
  currentClassName,
  onClassChange,
}) => {
  const [isLinked, setIsLinked] = useState(true);
  const [values, setValues] = useState({
    top: '',
    right: '',
    bottom: '',
    left: '',
    all: '',
  });

  // Parse current values from className
  useEffect(() => {
    const parseValues = () => {
      const classes = currentClassName.split(' ').filter(Boolean);

      // Look for padding or margin classes
      const prefix = definition.category === 'padding' ? 'p' : 'm';
      const foundClasses = classes.filter(cls => cls.startsWith(prefix));

      if (foundClasses.length === 0) {
        setValues({ top: '', right: '', bottom: '', left: '', all: '' });
        return;
      }

      // Check for all-direction class (p-4, m-2, etc.)
      const allClass = foundClasses.find(cls => cls.match(new RegExp(`^${prefix}-\\d+$|^${prefix}-px$|^${prefix}-auto$`)));
      if (allClass) {
        const value = allClass.split('-')[1];
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

      // Check for directional classes
      const directionalValues: Record<string, string> = {};
      ['t', 'r', 'b', 'l'].forEach((dir, index) => {
        const dirClass = foundClasses.find(cls => cls.startsWith(`${prefix}${dir}-`));
        if (dirClass) {
          directionalValues[['top', 'right', 'bottom', 'left'][index]] = dirClass.split('-')[1];
        }
      });

      // Check if all directional values are the same
      const uniqueValues = Object.values(directionalValues).filter(v => v);
      const allSame = uniqueValues.length > 1 && uniqueValues.every(v => v === uniqueValues[0]);

      if (allSame) {
        setValues({
          top: directionalValues.top || '',
          right: directionalValues.right || '',
          bottom: directionalValues.bottom || '',
          left: directionalValues.left || '',
          all: uniqueValues[0] as string,
        });
        setIsLinked(true);
      } else {
        setValues({
          top: directionalValues.top || '',
          right: directionalValues.right || '',
          bottom: directionalValues.bottom || '',
          left: directionalValues.left || '',
          all: '',
        });
        setIsLinked(false);
      }
    };

    parseValues();
  }, [currentClassName, definition.category]);

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

    // Generate className
    const prefix = definition.category === 'padding' ? 'p' : 'm';
    let className = '';

    if (isLinked && updatedValues.all) {
      className = `${prefix}-${updatedValues.all}`;
    } else {
      // Generate directional classes
      const directions = [
        { side: 'top', dir: 't' },
        { side: 'right', dir: 'r' },
        { side: 'bottom', dir: 'b' },
        { side: 'left', dir: 'l' },
      ];

      directions.forEach(({ side, dir }) => {
        const value = updatedValues[side as keyof typeof updatedValues];
        if (value) {
          className += `${prefix}${dir}-${value} `;
        }
      });
      className = className.trim();
    }

    // Use updateClassProperty to get the full updated className
    const newClassName = updateClassProperty(currentClassName, definition.category, className);
    onClassChange(newClassName);
  };

  const toggleLink = () => {
    setIsLinked(!isLinked);
    if (!isLinked) {
      // When linking, use the "all" value or the first non-empty value
      const linkValue = values.all || values.top || values.right || values.bottom || values.left || '';
      handleValueChange('all', linkValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{definition.label}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLink}
          className="h-6 w-6 p-0"
        >
          {isLinked ? <Link className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
        </Button>
      </div>

      {isLinked ? (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="e.g., 4, 12, px"
              value={values.all}
              onChange={(e) => handleValueChange('all', e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="text-xs text-muted-foreground">All sides</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Top</Label>
            <Input
              type="text"
              placeholder="4"
              value={values.top}
              onChange={(e) => handleValueChange('top', e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Right</Label>
            <Input
              type="text"
              placeholder="4"
              value={values.right}
              onChange={(e) => handleValueChange('right', e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Bottom</Label>
            <Input
              type="text"
              placeholder="4"
              value={values.bottom}
              onChange={(e) => handleValueChange('bottom', e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Left</Label>
            <Input
              type="text"
              placeholder="4"
              value={values.left}
              onChange={(e) => handleValueChange('left', e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{definition.description}</p>
    </div>
  );
};