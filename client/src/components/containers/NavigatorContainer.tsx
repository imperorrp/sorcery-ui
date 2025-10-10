import React from 'react';
import { ComponentTree } from '../Navigator/ComponentTree';
import { useTheme } from '@/contexts/ThemeContext';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { IconTree } from '@tabler/icons-react';

/**
 * NavigatorContainer - Container component for the Navigator panel
 *
 * This component wraps the ComponentTree with its header,
 * making it a self-contained module that can be placed in any layout.
 *
 * @returns {JSX.Element} The NavigatorContainer component
 */
export const NavigatorContainer: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="Navigator" icon={<IconTree className="h-5 w-5" />} />
      <div className={`flex-grow overflow-auto p-2 ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        <ComponentTree />
      </div>
    </div>
  );
};