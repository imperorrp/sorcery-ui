import React from 'react';
import { ConfigurerPanel } from '../Inspector/ConfigurerPanel';
import { useTheme } from '@/contexts/ThemeContext';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { IconSettings } from '@tabler/icons-react';

/**
 * ConfigurerContainer - Container component for the Configurer panel
 *
 * This component wraps the ConfigurerPanel with its header,
 * making it a self-contained module that can be placed in any layout.
 *
 * @returns {JSX.Element} The ConfigurerContainer component
 */
export const ConfigurerContainer: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="Configurer" icon={<IconSettings className="h-5 w-5" />} />
      <div className={`flex-grow overflow-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <ConfigurerPanel />
      </div>
    </div>
  );
};