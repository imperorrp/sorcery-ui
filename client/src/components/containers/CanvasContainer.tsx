import React from 'react';
import { ComponentCanvas } from '../Canvas/ComponentCanvas';
import { Maximize2, RefreshCw, MousePointer2, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { IconBox } from '@tabler/icons-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * CanvasContainer - Container component for the Component Preview panel
 *
 * This component wraps the ComponentCanvas with its header and control buttons,
 * making it a self-contained module that can be placed in any layout.
 *
 * @param {Object} props - Component props
 * @param {string} props.selectionMode - Current selection mode ('select' or 'interact')
 * @param {boolean} props.isFullscreen - Whether fullscreen mode is active
 * @param {(mode: 'select' | 'interact') => void} props.onSelectionModeChange - Selection mode change callback
 * @param {() => void} props.onFullscreenToggle - Fullscreen toggle callback
 * @param {() => void} props.onRender - Callback that triggers the render pipeline
 * @param {boolean} props.isRendering - Rendering state for disabling controls
 * @returns {JSX.Element} The CanvasContainer component
 */
interface CanvasContainerProps {
  selectionMode: 'select' | 'interact';
  isFullscreen: boolean;
  onSelectionModeChange: (mode: 'select' | 'interact') => void;
  onFullscreenToggle: () => void;
  onRender: () => void | Promise<void>;
  isRendering: boolean;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  selectionMode,
  isFullscreen,
  onSelectionModeChange,
  onFullscreenToggle,
  onRender,
  isRendering,
}) => {
  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="Component Preview" icon={<IconBox className="h-5 w-5" />}>
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onRender()}
                  variant="outline"
                  size="sm"
                  disabled={isRendering}
                  className="h-7 w-7 p-0 shrink-0 hover:bg-accent hover:text-accent-foreground transition-transform hover:scale-110 active:scale-95"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRendering ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Refresh the canvas</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ctrl+R</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onSelectionModeChange(selectionMode === 'interact' ? 'select' : 'interact')}
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0 hover:bg-accent hover:text-accent-foreground transition-transform hover:scale-110 active:scale-95"
                >
                  {selectionMode === 'select' ? (
                    <MousePointer2 className="h-3.5 w-3.5" />
                  ) : (
                    <Hand className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Toggle selection/interaction mode</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Click to switch</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onFullscreenToggle}
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0 hover:bg-accent hover:text-accent-foreground transition-transform hover:scale-110 active:scale-95"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">F11</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </PanelHeader>
  <div className="grow p-4 overflow-auto">
        <ComponentCanvas />
      </div>
    </div>
  );
};