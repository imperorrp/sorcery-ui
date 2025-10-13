import React from 'react';
import { ComponentTree } from '../Navigator/ComponentTree';
import { useTheme } from '@/contexts/ThemeContext';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { IconTree, IconMaximize, IconMinimize } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

/**
 * NavigatorContainer - Container component for the Navigator panel
 *
 * This component wraps the ComponentTree with its header,
 * making it a self-contained module that can be placed in any layout.
 * Includes expand/minimize functionality for better space utilization.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isExpanded - Whether the navigator is in expanded mode
 * @param {() => void} props.onToggleExpanded - Callback to toggle expanded state
 * @returns {JSX.Element} The NavigatorContainer component
 */
export const NavigatorContainer: React.FC<{
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}> = ({ isExpanded = false, onToggleExpanded }) => {
  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col">
      <PanelHeader
        title="Navigator"
        icon={<IconTree className="h-5 w-5" />}
      >
        {onToggleExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <IconMinimize className="h-4 w-4" />
            ) : (
              <IconMaximize className="h-4 w-4" />
            )}
          </Button>
        )}
      </PanelHeader>
      <div className={`flex-grow overflow-auto p-2 ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        <ComponentTree />
      </div>
    </div>
  );
};