import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, Unlink } from 'lucide-react';

interface BoxModelEditorProps {
  isLinked: boolean;
  onLinkToggle: () => void;
  valueAll: string;
  onAllChange: (value: string) => void;
  valueTop: string;
  onTopChange: (value: string) => void;
  valueRight: string;
  onRightChange: (value: string) => void;
  valueBottom: string;
  onBottomChange: (value: string) => void;
  valueLeft: string;
  onLeftChange: (value: string) => void;
}

/**
 * BoxModelEditor component for editing CSS box model properties (padding and margin).
 * 
 * This component provides an intuitive visual interface for setting box model values with
 * support for both linked (all sides equal) and unlinked (individual side control) modes.
 * It is now purely presentational, receiving all values and callbacks as props.
 * 
 * Key features:
 * - Linked/unlinked mode toggle for controlling all sides simultaneously or individually
 * - Visual feedback with directional input fields (T/R/B/L) in unlinked mode
 * - Simple prop-driven interface for easy integration
 * 
 * @component
 * @param {BoxModelEditorProps} props - Component props
 * @param {boolean} props.isLinked - Whether all sides are linked to the same value
 * @param {() => void} props.onLinkToggle - Callback to toggle linked/unlinked mode
 * @param {string} props.valueAll - Value for all sides when linked
 * @param {(value: string) => void} props.onAllChange - Callback when all sides value changes
 * @param {string} props.valueTop - Value for top side
 * @param {(value: string) => void} props.onTopChange - Callback when top value changes
 * @param {string} props.valueRight - Value for right side
 * @param {(value: string) => void} props.onRightChange - Callback when right value changes
 * @param {string} props.valueBottom - Value for bottom side
 * @param {(value: string) => void} props.onBottomChange - Callback when bottom value changes
 * @param {string} props.valueLeft - Value for left side
 * @param {(value: string) => void} props.onLeftChange - Callback when left value changes
 * @returns {JSX.Element} The rendered BoxModelEditor component with linked/unlinked controls
 */
export const BoxModelEditor: React.FC<BoxModelEditorProps> = ({
  isLinked,
  onLinkToggle,
  valueAll,
  onAllChange,
  valueTop,
  onTopChange,
  valueRight,
  onRightChange,
  valueBottom,
  onBottomChange,
  valueLeft,
  onLeftChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onLinkToggle}
        className="h-6 w-6 p-0 shrink-0"
        title={isLinked ? 'Unlink sides' : 'Link all sides'}
      >
        {isLinked ? <Link className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
      </Button>
      {isLinked ? (
        <Input
          type="text"
          placeholder="e.g., 4, 12, px"
          value={valueAll}
          onChange={(e) => onAllChange(e.target.value)}
          className="text-xs h-7"
        />
      ) : (
        <div className="grid grid-cols-4 gap-1 flex-1">
          <Input
            type="text"
            placeholder="T"
            value={valueTop}
            onChange={(e) => onTopChange(e.target.value)}
            className="text-xs h-7"
            title="Top"
          />
          <Input
            type="text"
            placeholder="R"
            value={valueRight}
            onChange={(e) => onRightChange(e.target.value)}
            className="text-xs h-7"
            title="Right"
          />
          <Input
            type="text"
            placeholder="B"
            value={valueBottom}
            onChange={(e) => onBottomChange(e.target.value)}
            className="text-xs h-7"
            title="Bottom"
          />
          <Input
            type="text"
            placeholder="L"
            value={valueLeft}
            onChange={(e) => onLeftChange(e.target.value)}
            className="text-xs h-7"
            title="Left"
          />
        </div>
      )}
    </div>
  );
};