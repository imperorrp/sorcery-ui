import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker';
import { TEXT_COLORS, BACKGROUND_COLORS } from '@/lib/colorConstants';
import { Trash2 } from 'lucide-react';
import { updateClassProperty } from '@/lib/tailwindParser';

interface Shadow {
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
  color: string;
  inset: boolean;
}

interface ShadowEditorProps {
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
 * ShadowEditor component for creating and editing box-shadow and drop-shadow properties
 * Provides controls for offset, blur, spread, color, and inset options with multiple shadow support
 * @param {ShadowEditorProps} props - Component props
 * @param {Object} props.definition - Definition object containing category, label, description, and classes
 * @param {string} props.definition.category - The category (shadow, drop-shadow)
 * @param {string} props.definition.label - Display label for the control
 * @param {string} props.definition.description - Description text for the control
 * @param {Array} props.definition.classes - Array of available shadow classes
 * @param {string} props.currentClassName - Current className string to parse shadow values from
 * @param {Function} props.onClassChange - Callback function called when shadow properties change
 * @returns {JSX.Element} The ShadowEditor component
 */
export const ShadowEditor: React.FC<ShadowEditorProps> = ({
  definition,
  currentClassName,
  onClassChange,
}) => {
  const [shadows, setShadows] = useState<Shadow[]>([
    {
      offsetX: '0',
      offsetY: '4',
      blur: '6',
      spread: '-1',
      color: 'rgba(0, 0, 0, 0.1)',
      inset: false,
    },
  ]);

  // Parse current shadow from className
  useEffect(() => {
    const parseShadow = () => {
      const classes = currentClassName.split(' ').filter(Boolean);

      // Look for shadow classes
      const shadowClass = classes.find(cls =>
        cls.startsWith('shadow-') ||
        cls.startsWith('drop-shadow-') ||
        cls === 'shadow'
      );

      if (!shadowClass || shadowClass === 'shadow-none') {
        setShadows([{
          offsetX: '0',
          offsetY: '4',
          blur: '6',
          spread: '-1',
          color: 'rgba(0, 0, 0, 0.1)',
          inset: false,
        }]);
        return;
      }

      // For now, we'll use predefined shadows
      // In a real implementation, you'd parse the actual shadow values
      const shadowMap: Record<string, Shadow> = {
        'shadow-sm': {
          offsetX: '0',
          offsetY: '1',
          blur: '2',
          spread: '0',
          color: 'rgba(0, 0, 0, 0.05)',
          inset: false,
        },
        'shadow': {
          offsetX: '0',
          offsetY: '1',
          blur: '3',
          spread: '0',
          color: 'rgba(0, 0, 0, 0.1)',
          inset: false,
        },
        'shadow-md': {
          offsetX: '0',
          offsetY: '4',
          blur: '6',
          spread: '-1',
          color: 'rgba(0, 0, 0, 0.1)',
          inset: false,
        },
        'shadow-lg': {
          offsetX: '0',
          offsetY: '10',
          blur: '15',
          spread: '-3',
          color: 'rgba(0, 0, 0, 0.1)',
          inset: false,
        },
        'shadow-xl': {
          offsetX: '0',
          offsetY: '20',
          blur: '25',
          spread: '-5',
          color: 'rgba(0, 0, 0, 0.1)',
          inset: false,
        },
      };

      const parsedShadow = shadowMap[shadowClass];
      if (parsedShadow) {
        setShadows([parsedShadow]);
      }
    };

    parseShadow();
  }, [currentClassName]);

  const updateShadow = (index: number, updates: Partial<Shadow>) => {
    const newShadows = [...shadows];
    newShadows[index] = { ...newShadows[index], ...updates };
    setShadows(newShadows);
    generateClassName(newShadows);
  };

  const addShadow = () => {
    const newShadow: Shadow = {
      offsetX: '0',
      offsetY: '4',
      blur: '6',
      spread: '0',
      color: 'rgba(0, 0, 0, 0.1)',
      inset: false,
    };
    const newShadows = [...shadows, newShadow];
    setShadows(newShadows);
    generateClassName(newShadows);
  };

  const removeShadow = (index: number) => {
    if (shadows.length > 1) {
      const newShadows = shadows.filter((_, i) => i !== index);
      setShadows(newShadows);
      generateClassName(newShadows);
    }
  };

  const generateClassName = (currentShadows: Shadow[]) => {
    // For now, we'll map to predefined shadow classes
    // In a real implementation, you'd generate custom shadow values
    const shadowClasses = currentShadows.map(shadow => {
      // Simple mapping to predefined classes based on common values
      if (shadow.offsetX === '0' && shadow.offsetY === '1' && shadow.blur === '2') {
        return 'shadow-sm';
      }
      if (shadow.offsetX === '0' && shadow.offsetY === '1' && shadow.blur === '3') {
        return 'shadow';
      }
      if (shadow.offsetX === '0' && shadow.offsetY === '4' && shadow.blur === '6') {
        return 'shadow-md';
      }
      if (shadow.offsetX === '0' && shadow.offsetY === '10' && shadow.blur === '15') {
        return 'shadow-lg';
      }
      if (shadow.offsetX === '0' && shadow.offsetY === '20' && shadow.blur === '25') {
        return 'shadow-xl';
      }
      return 'shadow';
    });

    const newClassName = updateClassProperty(currentClassName, definition.category, shadowClasses.join(' '));
    onClassChange(newClassName);
  };

  const currentShadow = shadows[0]; // For simplicity, focus on first shadow

  return (
    <div className="space-y-4">
      <Label className="text-xs font-medium">{definition.label}</Label>

      <div className="space-y-3 p-3 border rounded-md bg-muted/20">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Offset X</Label>
            <Input
              type="text"
              placeholder="0"
              value={currentShadow.offsetX}
              onChange={(e) => updateShadow(0, { offsetX: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Offset Y</Label>
            <Input
              type="text"
              placeholder="4"
              value={currentShadow.offsetY}
              onChange={(e) => updateShadow(0, { offsetY: e.target.value })}
              className="text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Blur</Label>
            <Input
              type="text"
              placeholder="6"
              value={currentShadow.blur}
              onChange={(e) => updateShadow(0, { blur: e.target.value })}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Spread</Label>
            <Input
              type="text"
              placeholder="-1"
              value={currentShadow.spread}
              onChange={(e) => updateShadow(0, { spread: e.target.value })}
              className="text-xs"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Color</Label>
          <ColorSwatchPicker
            value={currentShadow.color}
            onValueChange={(value) => updateShadow(0, { color: value })}
            colors={[...TEXT_COLORS, ...BACKGROUND_COLORS]}
            type="background"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="inset-shadow"
            checked={currentShadow.inset}
            onChange={(e) => updateShadow(0, { inset: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="inset-shadow" className="text-xs">Inset shadow</Label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={addShadow}
          className="text-xs"
        >
          Add Shadow
        </Button>

        {shadows.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeShadow(0)}
            className="text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{definition.description}</p>
    </div>
  );
};