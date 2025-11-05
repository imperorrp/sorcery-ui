/**
 * VariantEditor - Visual interface for editing component variants
 * 
 * This component displays variant options as visual cards and allows
 * users to switch between variants. When a variant is selected, it
 * updates the JSX attribute on the selected element.
 * 
 * Example: For a Button with variants: default, outline, ghost
 * Shows 3 cards with preview of each variant's styling.
 */

import { useState } from 'react';
import type { ComponentSchema, VariantDefinition } from '@/store/types';

interface VariantEditorProps {
  /** The extracted component schema */
  schema: ComponentSchema;
  /** Current variant values (e.g., { variant: 'outline', size: 'lg' }) */
  currentValues: Record<string, string>;
  /** Callback when variant is changed */
  onVariantChange: (variantName: string, value: string) => void;
}

/**
 * VariantEditor component
 * 
 * Renders all variants from the schema as interactive cards
 */
export function VariantEditor({ schema, currentValues, onVariantChange }: VariantEditorProps) {
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(
    new Set(Object.keys(schema.variants))
  );

  const toggleVariant = (variantName: string) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(variantName)) {
        next.delete(variantName);
      } else {
        next.add(variantName);
      }
      return next;
    });
  };

  if (Object.keys(schema.variants).length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        No variants detected in this component.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Component info */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {schema.name}
        </h3>
        {schema.library && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            from {schema.library}
          </p>
        )}
        {schema.detectionMethod && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Detected via: {schema.detectionMethod}
          </p>
        )}
      </div>

      {/* Variants list */}
      {Object.entries(schema.variants).map(([variantName, variantDef]) => (
        <VariantSection
          key={variantName}
          variantName={variantName}
          variantDef={variantDef}
          currentValue={currentValues[variantName] || variantDef.default || ''}
          isExpanded={expandedVariants.has(variantName)}
          onToggle={() => toggleVariant(variantName)}
          onChange={(value) => onVariantChange(variantName, value)}
        />
      ))}
    </div>
  );
}

interface VariantSectionProps {
  variantName: string;
  variantDef: VariantDefinition;
  currentValue: string;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}

/**
 * VariantSection - Displays a single variant axis with all its options
 */
function VariantSection({
  variantName,
  variantDef,
  currentValue,
  isExpanded,
  onToggle,
  onChange,
}: VariantSectionProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {variantName}
          </span>
          {currentValue && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              {currentValue}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Options */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {variantDef.options.map((option) => (
            <VariantOption
              key={option.value}
              option={option}
              isSelected={currentValue === option.value}
              onClick={() => onChange(option.value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface VariantOptionProps {
  option: {
    value: string;
    label?: string;
    classes: string;
    description?: string;
    preview?: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

/**
 * VariantOption - Individual variant option card
 */
function VariantOption({ option, isSelected, onClick }: VariantOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-2 rounded-md border transition-all text-left
        ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-sm'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `}
    >
      {/* Option label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {option.label || option.value}
        </span>
        {isSelected && (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Description */}
      {option.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</p>
      )}

      {/* Class preview */}
      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
        {option.classes || 'No classes'}
      </div>

      {/* Visual preview (if provided) */}
      {option.preview && (
        <div className="mt-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
          <div className={option.classes}>Preview</div>
        </div>
      )}
    </button>
  );
}
