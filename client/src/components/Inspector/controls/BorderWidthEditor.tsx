import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link, Unlink } from 'lucide-react';

interface BorderWidthEditorProps {
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
 * BorderWidthEditor component - Presentational component for border width controls.
 *
 * This component provides a clean UI for controlling border width values, supporting
 * both linked (all sides) and unlinked (individual sides) modes. It displays
 * inputs for each side with appropriate labels and a toggle button for linked mode.
 *
 * The component is designed to be dumb and props-driven, with all data logic handled
 * by the parent BorderWidthControl component.
 *
 * @component
 * @param {BorderWidthEditorProps} props - Component props
 * @param {boolean} props.isLinked - Whether sides are linked (single input) or unlinked (individual inputs)
 * @param {() => void} props.onLinkToggle - Callback to toggle linked/unlinked mode
 * @param {string} props.valueAll - Value for all sides (linked mode)
 * @param {(value: string) => void} props.onAllChange - Callback when all sides value changes
 * @param {string} props.valueTop - Value for top side
 * @param {(value: string) => void} props.onTopChange - Callback when top value changes
 * @param {string} props.valueRight - Value for right side
 * @param {(value: string) => void} props.onRightChange - Callback when right value changes
 * @param {string} props.valueBottom - Value for bottom side
 * @param {(value: string) => void} props.onBottomChange - Callback when bottom value changes
 * @param {string} props.valueLeft - Value for left side
 * @param {(value: string) => void} props.onLeftChange - Callback when left value changes
 * @returns {JSX.Element} The rendered BorderWidthEditor UI
 */
export const BorderWidthEditor: React.FC<BorderWidthEditorProps> = ({
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
    <div className="space-y-3">
      {/* Link/Unlink Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Border Width</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLinkToggle}
          className="h-6 w-6 p-0"
          title={isLinked ? 'Unlink sides' : 'Link sides'}
        >
          {isLinked ? <Unlink className="h-3 w-3" /> : <Link className="h-3 w-3" />}
        </Button>
      </div>

      {isLinked ? (
        /* Linked Mode: Single input for all sides */
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">All Sides</Label>
          <Input
            value={valueAll}
            onChange={(e) => onAllChange(e.target.value)}
            placeholder="border-2"
            className="h-8 text-sm"
          />
        </div>
      ) : (
        /* Unlinked Mode: Individual inputs for each side */
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Top</Label>
            <Input
              value={valueTop}
              onChange={(e) => onTopChange(e.target.value)}
              placeholder="border-t-2"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Right</Label>
            <Input
              value={valueRight}
              onChange={(e) => onRightChange(e.target.value)}
              placeholder="border-r-2"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bottom</Label>
            <Input
              value={valueBottom}
              onChange={(e) => onBottomChange(e.target.value)}
              placeholder="border-b-2"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Left</Label>
            <Input
              value={valueLeft}
              onChange={(e) => onLeftChange(e.target.value)}
              placeholder="border-l-2"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};