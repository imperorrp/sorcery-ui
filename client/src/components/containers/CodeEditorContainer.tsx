import React, { useRef } from 'react';
import { MonacoEditor, type MonacoEditorRef } from '../CodeEditor/MonacoEditor';
import { useTheme } from '@/contexts/ThemeContext';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { ComponentTabs } from '../CodeEditor/ComponentTabs';
import { IconCode } from '@tabler/icons-react';
import type { ComponentData } from '@/store/componentStore';

/**
 * CodeEditorContainer - Container component for the Code Editor panel
 *
 * This component wraps the MonacoEditor with its header and component tabs,
 * making it a self-contained module.
 *
 * @param {Object} props - Component props
 * @param {Object} props.activeComponent - The currently active component data
 * @param {string} props.activeCode - The code of the active component
 * @param {(code: string) => void} props.onCodeChange - Code change callback
 * @returns {JSX.Element} The CodeEditorContainer component
 */
interface CodeEditorContainerProps {
  activeComponent: ComponentData | null;
  activeCode: string;
  onCodeChange: (code: string) => void;
}

export const CodeEditorContainer: React.FC<CodeEditorContainerProps> = ({
  activeComponent,
  activeCode,
  onCodeChange,
}) => {
  const { theme } = useTheme();
  const monacoEditorRef = useRef<MonacoEditorRef>(null);

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="Code Editor" icon={<IconCode className="h-5 w-5" />}></PanelHeader>
      {/* Tabs should remain visible even when no component is open */}
      <ComponentTabs />
      <div className={`flex-grow overflow-hidden border-r ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        {activeComponent ? (
          <MonacoEditor
            ref={monacoEditorRef}
            code={activeCode}
            onCodeChange={onCodeChange}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <h3 className="mb-2 text-sm font-semibold">No component open</h3>
            <p className="text-xs">Open a component from the Library or load an Example to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};