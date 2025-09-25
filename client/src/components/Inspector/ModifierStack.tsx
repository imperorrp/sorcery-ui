import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export interface ModifierValue {
  name: string;
  value?: string;
  requires?: string;
}

interface ModifierStackProps {
  modifiers: ModifierValue[];
  onRemoveModifier: (index: number) => void;
  onUpdateModifier: (index: number, value: string) => void;
  onClearAll: () => void;
}

/**
 * ModifierStack Component - Displays active modifier stack as editable pills
 *
 * This component visualizes the current modifier stack as a series of badge-style
 * pills that can be individually removed or edited inline when they require user input.
 * 
 * Features:
 * - Individual modifier removal
 * - Inline editing for modifiers that require arbitrary values
 * - Clear all modifiers option
 * - Visual feedback for active modifiers
 * - Empty state handling
 *
 * @param {ModifierValue[]} modifiers - Array of active modifier objects
 * @param {function} onRemoveModifier - Callback to remove modifier at specific index
 * @param {function} onUpdateModifier - Callback to update modifier value at specific index
 * @param {function} onClearAll - Callback to clear entire modifier stack
 * @returns {JSX.Element} The ModifierStack component
 */
export const ModifierStack: React.FC<ModifierStackProps> = ({
  modifiers,
  onRemoveModifier,
  onUpdateModifier,
  onClearAll
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (index: number, currentValue?: string) => {
    setEditingIndex(index);
    setEditValue(currentValue || '');
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      onUpdateModifier(editingIndex, editValue);
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const getDisplayText = (modifier: ModifierValue) => {
    if (modifier.requires && modifier.value) {
      return modifier.name.replace(`[${modifier.requires}]`, modifier.value);
    }
    return modifier.name;
  };

  const getPlaceholder = (modifier: ModifierValue) => {
    if (modifier.requires) {
      switch (modifier.requires.toLowerCase()) {
        case 'attribute_selector':
          return 'expanded, hidden, etc.';
        case 'value':
          return 'custom value';
        case 'query':
          return 'media query';
        case 'selector':
          return 'css selector';
        case 'nth_value':
          return 'odd, even, 2n+1, etc.';
        default:
          return 'enter value';
      }
    }
    return '';
  };

  if (modifiers.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No active modifiers. Click "Add Modifier" to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Active:</span>
        {modifiers.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {modifiers.map((modifier, index) => (
          <div key={`${modifier.name}-${index}`}>
            {editingIndex === index ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-background">
                <span className="text-xs font-mono text-muted-foreground">
                  {modifier.name.split('[')[0]}
                </span>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={getPlaceholder(modifier)}
                  className="h-6 w-24 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  onBlur={handleSaveEdit}
                  autoFocus
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {modifier.name.includes(']') ? modifier.name.split(']')[1] : ''}
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 rounded-md border bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200 text-xs font-mono">
                <span 
                  className={modifier.requires && !modifier.value ? 'cursor-pointer underline' : ''}
                  onClick={() => modifier.requires && handleStartEdit(index, modifier.value)}
                  title={modifier.requires && !modifier.value ? 'Click to edit value' : ''}
                >
                  {getDisplayText(modifier)}
                  {modifier.requires && !modifier.value && (
                    <span className="text-muted-foreground ml-1 text-[10px]">[edit]</span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveModifier(index)}
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full ml-1"
                  title={`Remove ${getDisplayText(modifier)} modifier`}
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        Prefix applied: 
        <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs ml-1">
          {modifiers.map(getDisplayText).join(':')}:
        </code>
      </div>
    </div>
  );
};