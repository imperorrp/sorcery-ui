import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface ToggleProps {
  options: Array<{ value: string; label: string }>;
  value: string | null;
  onChange: (value: string | null) => void;
  arbitraryValue?: string | null;
  onArbitraryChange?: (arbitraryValue: string | null) => void;
  supportsArbitrary?: boolean;
}

/**
 * Toggle component for boolean state control with visual feedback.
 *
 * This component provides an elegant toggle button interface for enabling or disabling
 * boolean Tailwind utility classes. It offers clear visual feedback with check/X icons.
 *
 * Key features:
 * - Visual toggle button with check (active) and X (inactive) icons
 * - Single-click toggle functionality
 * - Consistent UI with shadcn/ui Button component
 *
 * @component
 * @param {ToggleProps} props - Component props
 * @param {Array<{value: string, label: string}>} props.options - Array of available toggle options
 * @param {string | null} props.value - Currently selected value
 * @param {(value: string | null) => void} props.onChange - Callback for value changes
 * @param {string | null} props.arbitraryValue - Current arbitrary value (not used for toggles)
 * @param {(arbitraryValue: string | null) => void} props.onArbitraryChange - Callback for arbitrary value (not used)
 * @param {boolean} props.supportsArbitrary - Whether arbitrary values are supported (not used)
 * @returns {JSX.Element} The rendered Toggle component
 */
export const Toggle: React.FC<ToggleProps> = ({
  options,
  value,
  onChange
}) => {
  const isActive = !!value;

  const handleToggle = () => {
    const nextValue = !isActive && options.length > 0 ? options[0].value : null;
    onChange(nextValue);
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