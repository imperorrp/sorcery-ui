import React from 'react';
import { ComponentTree } from '../Navigator/ComponentTree';
import { useTheme } from '@/contexts/ThemeContext';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { IconTree, IconMaximize, IconMinimize, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
 * @param {() => void} props.onMinimize - Callback to minimize/hide the navigator (same as navbar toggle)
 * @returns {JSX.Element} The NavigatorContainer component
 */
export const NavigatorContainer: React.FC<{
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  onMinimize?: () => void;
}> = ({ isExpanded = false, onToggleExpanded, onMinimize }) => {
  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col">
      <PanelHeader
        title="Navigator"
        icon={<IconTree className="h-5 w-5" />}
      >
        <div className="flex items-center gap-1">
          {/* Expand/Minimize button (changes panel size within its container) */}
          {onToggleExpanded && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{isExpanded ? 'Minimize Panel' : 'Maximize Panel'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Close/Hide button (hides the entire navigator - same as navbar toggle) */}
          {onMinimize && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMinimize}
                    className="h-6 w-6 p-0"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Hide Navigator</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </PanelHeader>
      <div className={`grow overflow-auto p-2 ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        <ComponentTree />
      </div>
    </div>
  );
};