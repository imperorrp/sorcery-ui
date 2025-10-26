import React from 'react';
import { InspectorPanel } from '../Inspector/InspectorPanel';
import { useTheme } from '@/contexts/ThemeContext';
import { Undo2, Redo2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { IconPalette } from '@tabler/icons-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * InspectorContainer - Container component for the Style Editor panel
 *
 * This component wraps the InspectorPanel with its header and action buttons,
 * making it a self-contained module that can be placed in any layout.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.canUndo - Whether undo is available
 * @param {boolean} props.canRedo - Whether redo is available
 * @param {boolean} props.isDirty - Whether there are unsaved changes
 * @param {() => void} props.onUndo - Undo callback function
 * @param {() => void} props.onRedo - Redo callback function
 * @param {() => void} props.onApplyChanges - Apply changes callback function
 * @returns {JSX.Element} The InspectorContainer component
 */
interface InspectorContainerProps {
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onApplyChanges: () => void;
}

export const InspectorContainer: React.FC<InspectorContainerProps> = ({
  canUndo,
  canRedo,
  isDirty,
  onUndo,
  onRedo,
  onApplyChanges,
}) => {
  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="Style Editor" icon={<IconPalette className="h-5 w-5" />}>
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    onClick={onUndo}
                    disabled={!canUndo}
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 shrink-0 hover:bg-accent hover:text-accent-foreground"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Undo last change</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ctrl+Z</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    onClick={onRedo}
                    disabled={!canRedo}
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 shrink-0 hover:bg-accent hover:text-accent-foreground"
                  >
                    <Redo2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Redo last change</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ctrl+Y</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    onClick={() => {
                      void onApplyChanges();
                    }}
                    disabled={!isDirty}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 flex items-center gap-1 shrink-0 hover:bg-accent hover:text-accent-foreground"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span className="text-xs hidden sm:inline">Apply</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{isDirty ? 'Apply changes to code' : 'No changes to apply'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </PanelHeader>
      <div className={`grow overflow-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <InspectorPanel />
      </div>
    </div>
  );
};