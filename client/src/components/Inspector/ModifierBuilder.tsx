import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronRight, X, Plus } from 'lucide-react';
import modifiersData from '@/lib/definitions/modifiers.json';
import { commonModifierTypes, favoriteModifierTypes } from './inspector-config';

interface Modifier {
  name: string;
  type: string;
  description: string;
  css: string;
  requires?: string;
}

interface ModifierValue {
  name: string;
  value?: string;
  requires?: string;
}

interface ModifierBuilderProps {
  onAddModifier: (modifier: ModifierValue) => void;
  currentStack: string[];
  scope?: 'common' | 'favorites' | 'all';
}

/**
 * ModifierBuilder Component - Hierarchical UI for constructing Tailwind modifier stacks
 *
 * This component provides a guided, step-by-step interface for building complex
 * Tailwind CSS modifier combinations. Instead of overwhelming users with 164+ options,
 * it uses a hierarchical approach: Category → Modifier → Value Input (if needed).
 *
 * Features:
 * - Category selection (State, Breakpoint, Context, etc.)
 * - Modifier selection within chosen category
 * - Value input for arbitrary modifiers (nth-[value], max-[value], etc.)
 * - Search functionality within each view
 * - Breadcrumb navigation
 * - Clean, modal-style interface
 *
 * @param {function} onAddModifier - Callback when user completes modifier construction
 * @param {string[]} currentStack - Currently active modifier stack for context
 * @returns {JSX.Element} The ModifierBuilder popover component
 */
export const ModifierBuilder: React.FC<ModifierBuilderProps> = ({
  onAddModifier,
  currentStack,
  scope = 'all'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'categories' | 'modifiers' | 'value-input'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedModifier, setSelectedModifier] = useState<Modifier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');

  React.useEffect(() => {
    setCurrentView('categories');
    setSelectedCategory('');
    setSelectedModifier(null);
    setSearchQuery('');
    setInputValue('');
  }, [scope]);

  // Extract unique categories from modifiers data
  const categories = useMemo(() => {
    const uniqueTypes = new Set(modifiersData.modifiers.map((mod: Modifier) => mod.type));
    const allCategories = Array.from(uniqueTypes).sort();
    if (scope === 'common') {
      return allCategories.filter((cat) => commonModifierTypes.includes(cat as typeof commonModifierTypes[number]));
    }
    if (scope === 'favorites') {
      return allCategories.filter((cat) => favoriteModifierTypes.includes(cat));
    }
    return allCategories;
  }, [scope]);

  // Get modifiers for selected category
  const categoryModifiers = useMemo(() => {
    if (!selectedCategory) return [];
    return modifiersData.modifiers.filter((mod: Modifier) => mod.type === selectedCategory);
  }, [selectedCategory]);

  // Filter modifiers based on search query
  const filteredModifiers = useMemo(() => {
    if (!searchQuery.trim()) return categoryModifiers;
    const query = searchQuery.toLowerCase();
    return categoryModifiers.filter((mod: Modifier) =>
      mod.name.toLowerCase().includes(query) ||
      mod.description.toLowerCase().includes(query)
    );
  }, [categoryModifiers, searchQuery]);

  // Check if selected modifier requires value input
  const requiresValueInput = useMemo(() => {
    if (!selectedModifier) return false;
    return selectedModifier.name.includes('[') && selectedModifier.name.includes(']');
  }, [selectedModifier]);

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentView('modifiers');
    setSearchQuery('');
  };

  // Handle modifier selection
  const handleModifierSelect = (modifier: Modifier) => {
    setSelectedModifier(modifier);
    if (requiresValueInput) {
      setCurrentView('value-input');
      setInputValue('');
    } else {
      // Complete the modifier construction
      onAddModifier({
        name: modifier.name,
        requires: modifier.requires
      });
      handleReset();
    }
  };

  // Handle value input completion
  const handleValueSubmit = () => {
    if (!selectedModifier || !inputValue.trim()) return;

    // Replace placeholder in modifier name with user input
    let finalModifier = selectedModifier.name;
    if (finalModifier.includes('[ATTRIBUTE_SELECTOR]')) {
      finalModifier = finalModifier.replace('[ATTRIBUTE_SELECTOR]', inputValue.trim());
    } else if (finalModifier.includes('[NTH_VALUE]')) {
      finalModifier = finalModifier.replace('[NTH_VALUE]', inputValue.trim());
    } else if (finalModifier.includes('[value]')) {
      finalModifier = finalModifier.replace('[value]', inputValue.trim());
    } else if (finalModifier.includes('[VALUE]')) {
      finalModifier = finalModifier.replace('[VALUE]', inputValue.trim());
    } else if (finalModifier.includes('[SELECTOR]')) {
      finalModifier = finalModifier.replace('[SELECTOR]', inputValue.trim());
    } else if (finalModifier.includes('[name]')) {
      finalModifier = finalModifier.replace('[name]', inputValue.trim());
    } else if (finalModifier.includes('[QUERY]')) {
      finalModifier = finalModifier.replace('[QUERY]', inputValue.trim());
    } else {
      // Generic replacement for any bracketed placeholder
      const requiresField = selectedModifier.requires;
      if (requiresField) {
        const placeholder = `[${requiresField.toUpperCase()}]`;
        if (finalModifier.includes(placeholder)) {
          finalModifier = finalModifier.replace(placeholder, inputValue.trim());
        } else {
          // If the placeholder doesn't match exactly, try a case-insensitive match
          const lowerPlaceholder = `[${requiresField.toLowerCase()}]`;
          if (finalModifier.includes(lowerPlaceholder)) {
            finalModifier = finalModifier.replace(lowerPlaceholder, inputValue.trim());
          }
        }
      }
    }

    onAddModifier({
      name: selectedModifier.name,
      value: inputValue.trim(),
      requires: selectedModifier.requires
    });
    handleReset();
  };

  // Reset builder state
  const handleReset = () => {
    setCurrentView('categories');
    setSelectedCategory('');
    setSelectedModifier(null);
    setSearchQuery('');
    setInputValue('');
    setIsOpen(false);
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentView === 'value-input') {
      setCurrentView('modifiers');
      setSelectedModifier(null);
      setInputValue('');
    } else if (currentView === 'modifiers') {
      setCurrentView('categories');
      setSelectedCategory('');
      setSearchQuery('');
    }
  };

  // Render breadcrumb navigation
  const renderBreadcrumbs = () => {
    const crumbs = ['Categories'];
    if (selectedCategory) crumbs.push(selectedCategory);
    if (selectedModifier) crumbs.push(selectedModifier.name);

    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
        {crumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-3 w-3" />}
            <span className={index === crumbs.length - 1 ? 'text-foreground font-medium' : ''}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={!currentStack}
        >
          <Plus className="h-4 w-4" />
          Add Modifier
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Add Modifier</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Breadcrumbs */}
          {renderBreadcrumbs()}

          {/* Search */}
          {(currentView === 'modifiers' || currentView === 'value-input') && (
            <div className="mb-3">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          {/* Content */}
          <div className="h-64 overflow-y-auto">
            {currentView === 'categories' && (
              <div className="space-y-1">
                {categories.length === 0 ? (
                  <div className="rounded-md border px-3 py-4 text-xs text-muted-foreground text-center">
                    No favorite modifiers yet. Mark modifiers as favorites to surface them here.
                  </div>
                ) : (
                  categories.map((category) => (
                    <Button
                      key={category}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => handleCategorySelect(category)}
                    >
                      <div>
                        <div className="font-medium text-sm">{category}</div>
                        <div className="text-xs text-muted-foreground">
                          {modifiersData.modifiers.filter((m: Modifier) => m.type === category).length} modifiers
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            )}

            {currentView === 'modifiers' && (
              <div className="space-y-1">
                {filteredModifiers.map((modifier: Modifier) => (
                  <Button
                    key={modifier.name}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleModifierSelect(modifier)}
                  >
                    <div>
                      <div className="font-medium text-sm font-mono">{modifier.name}</div>
                      <div className="text-xs text-muted-foreground">{modifier.description}</div>
                    </div>
                  </Button>
                ))}
                {filteredModifiers.length === 0 && searchQuery && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No modifiers found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}

            {currentView === 'value-input' && selectedModifier && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="modifier-value" className="text-sm font-medium">
                    Enter value for {selectedModifier.name}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedModifier.description}
                  </p>
                </div>
                <Input
                  id="modifier-value"
                  placeholder="Enter value..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      handleValueSubmit();
                    }
                  }}
                  className="text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleValueSubmit}
                    disabled={!inputValue.trim()}
                    className="flex-1"
                  >
                    Add Modifier
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer with current stack preview */}
          {currentStack.length > 0 && (
            <>
              <div className="my-4 border-t border-border" />
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Current Stack:</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentStack.map((modifier, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-md border bg-secondary text-secondary-foreground text-xs"
                    >
                      {modifier}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};