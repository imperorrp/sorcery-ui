import React from 'react';
import { ComponentCanvas } from '../Canvas/ComponentCanvas';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { IconBox } from '@tabler/icons-react';

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
 * @returns {JSX.Element} The CanvasContainer component
 */
interface CanvasContainerProps {
  selectionMode: 'select' | 'interact';
  isFullscreen: boolean;
  onSelectionModeChange: (mode: 'select' | 'interact') => void;
  onFullscreenToggle: () => void;
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({
  selectionMode,
  isFullscreen,
  onSelectionModeChange,
  onFullscreenToggle,
}) => {
  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="Component Preview" icon={<IconBox className="h-5 w-5" />}>
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Button
            onClick={() => onSelectionModeChange(selectionMode === 'interact' ? 'select' : 'interact')}
            variant={selectionMode === 'select' ? 'default' : 'outline'}
            size="sm"
            title={
              selectionMode === 'select'
                ? 'Selection mode: Click to select elements. Click to toggle off.'
                : 'Interaction mode: Click to interact. Toggle to enable selection mode.'
            }
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap flex-none"
          >
            <span className="truncate min-w-0 overflow-hidden whitespace-nowrap">{selectionMode === 'select' ? 'Selection Mode' : 'Interaction Mode'}</span>
          </Button>
          <Button
            onClick={onFullscreenToggle}
            variant="outline"
            size="sm"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="flex items-center overflow-hidden whitespace-nowrap flex-none"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </PanelHeader>
      <div className="flex-grow p-4 overflow-auto">
        <ComponentCanvas />
      </div>
    </div>
  );
};