import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link, Unlink } from 'lucide-react';

interface BorderRadiusEditorProps {
  isLinked: boolean;
  onLinkToggle: () => void;
  valueAll: string;
  onAllChange: (value: string) => void;
  valueTopLeft: string;
  onTopLeftChange: (value: string) => void;
  valueTopRight: string;
  onTopRightChange: (value: string) => void;
  valueBottomRight: string;
  onBottomRightChange: (value: string) => void;
  valueBottomLeft: string;
  onBottomLeftChange: (value: string) => void;
}

/**
 * BorderRadiusEditor component - Presentational component for border radius controls.
 *
 * This component provides a clean UI for controlling border radius values, supporting
 * both linked (all corners) and unlinked (individual corners) modes. It displays
 * inputs for each corner with appropriate labels and a toggle button for linked mode.
 *
 * The component is designed to be dumb and props-driven, with all data logic handled
 * by the parent BorderRadiusControl component.
 *
 * @component
 * @param {BorderRadiusEditorProps} props - Component props
 * @param {boolean} props.isLinked - Whether corners are linked (single input) or unlinked (individual inputs)
 * @param {() => void} props.onLinkToggle - Callback to toggle linked/unlinked mode
 * @param {string} props.valueAll - Value for all corners (linked mode)
 * @param {(value: string) => void} props.onAllChange - Callback when all corners value changes
 * @param {string} props.valueTopLeft - Value for top-left corner
 * @param {(value: string) => void} props.onTopLeftChange - Callback when top-left value changes
 * @param {string} props.valueTopRight - Value for top-right corner
 * @param {(value: string) => void} props.onTopRightChange - Callback when top-right value changes
 * @param {string} props.valueBottomRight - Value for bottom-right corner
 * @param {(value: string) => void} props.onBottomRightChange - Callback when bottom-right value changes
 * @param {string} props.valueBottomLeft - Value for bottom-left corner
 * @param {(value: string) => void} props.onBottomLeftChange - Callback when bottom-left value changes
 * @returns {JSX.Element} The rendered BorderRadiusEditor UI
 */
export const BorderRadiusEditor: React.FC<BorderRadiusEditorProps> = ({
  isLinked,
  onLinkToggle,
  valueAll,
  onAllChange,
  valueTopLeft,
  onTopLeftChange,
  valueTopRight,
  onTopRightChange,
  valueBottomRight,
  onBottomRightChange,
  valueBottomLeft,
  onBottomLeftChange,
}) => {
  return (
    <div className="space-y-3">
      {/* Link/Unlink Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Border Radius</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLinkToggle}
          className="h-6 w-6 p-0"
          title={isLinked ? 'Unlink corners' : 'Link corners'}
        >
          {isLinked ? <Unlink className="h-3 w-3" /> : <Link className="h-3 w-3" />}
        </Button>
      </div>

      {isLinked ? (
        /* Linked Mode: Single input for all corners */
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">All Corners</Label>
          <Input
            value={valueAll}
            onChange={(e) => onAllChange(e.target.value)}
            placeholder="rounded-lg"
            className="h-8 text-sm"
          />
        </div>
      ) : (
        /* Unlinked Mode: Individual inputs for each corner */
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Top Left</Label>
            <Input
              value={valueTopLeft}
              onChange={(e) => onTopLeftChange(e.target.value)}
              placeholder="rounded-tl-lg"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Top Right</Label>
            <Input
              value={valueTopRight}
              onChange={(e) => onTopRightChange(e.target.value)}
              placeholder="rounded-tr-lg"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bottom Right</Label>
            <Input
              value={valueBottomRight}
              onChange={(e) => onBottomRightChange(e.target.value)}
              placeholder="rounded-br-lg"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bottom Left</Label>
            <Input
              value={valueBottomLeft}
              onChange={(e) => onBottomLeftChange(e.target.value)}
              placeholder="rounded-bl-lg"
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};