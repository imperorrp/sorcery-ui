import React from 'react';
import { InspectorPanel } from '../Inspector/InspectorPanel';
import { useTheme } from '@/contexts/ThemeContext';
import { Undo2, Redo2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { IconPalette } from '@tabler/icons-react';

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
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            size="sm"
            variant="outline"
            title="Undo last change"
            className="overflow-hidden whitespace-nowrap flex-1 min-w-0"
          >
            <Undo2 className="h-4 w-4 flex-shrink-0" />
          </Button>
          <Button
            onClick={onRedo}
            disabled={!canRedo}
            size="sm"
            variant="outline"
            title="Redo last change"
            className="overflow-hidden whitespace-nowrap flex-1 min-w-0"
          >
            <Redo2 className="h-4 w-4 flex-shrink-0" />
          </Button>
          <Button
            onClick={() => {
              void onApplyChanges();
            }}
            disabled={!isDirty}
            size="sm"
            title={isDirty ? 'Apply inspector changes into the code editor' : 'No changes to apply'}
            className="px-2 sm:px-3 flex items-center gap-2 overflow-hidden whitespace-nowrap flex-none"
          >
            <Check className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">Apply Changes</span>
          </Button>
        </div>
      </PanelHeader>
      <div className={`flex-grow overflow-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <InspectorPanel />
      </div>
    </div>
  );
};