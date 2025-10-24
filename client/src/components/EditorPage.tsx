/**
 * Editor Page - Vibe Layout Editor
 *
 * The main editor interface using the Vibe layout.
 * Contains all the state and logic for the component editor.
 *
 * @author Sorcery UI Team
 */

import { Navbar } from './Navbar';
import VibeLayout from '../layouts/VibeLayout';
import { useState } from 'react';
import { examples, multiComponentExamples } from '../examples/examples';
import { useComponentStore } from '../store/componentStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfigurerContainer } from './containers/ConfigurerContainer';

/**
 * EditorPage component - Main editor with Vibe layout
 *
 * Provides the complete editing interface using the Vibe layout,
 * including navbar controls, panel visibility toggles, and configuration modal.
 *
 * @returns {JSX.Element} The editor page JSX element
 */
export function EditorPage() {
  // Layout state - lifted up to App.tsx for centralized control
  const [layoutMode] = useState('vibe'); // Fixed to vibe for this route
  const [mainView, setMainView] = useState('canvas'); // 'canvas' or 'code'

  // Panel visibility state for dock system
  const [isInspectorVisible, setIsInspectorVisible] = useState(true);
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(true);

  // Config panel modal state for Vibe layout
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // Store hooks for global actions
  const { isRendering, loadExample, renderActiveComponent } = useComponentStore();

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar
        layoutMode={layoutMode}
        mainView={mainView}
        isInspectorVisible={isInspectorVisible}
        isNavigatorVisible={isNavigatorVisible}
        examples={examples}
        multiComponentExamples={multiComponentExamples}
        isRendering={isRendering}
        onLayoutModeChange={() => {}} // No-op since fixed
        onMainViewChange={setMainView}
        onInspectorToggle={() => setIsInspectorVisible(!isInspectorVisible)}
        onNavigatorToggle={() => setIsNavigatorVisible(!isNavigatorVisible)}
        onExampleSelect={loadExample}
        onRender={renderActiveComponent}
        onConfigToggle={() => setIsConfigPanelOpen(true)}
      />
      <div className="flex-1 overflow-hidden">
        <VibeLayout
          mainView={mainView}
          isInspectorVisible={isInspectorVisible}
          isNavigatorVisible={isNavigatorVisible}
        />
      </div>

      {/* Config Panel Modal - only for Vibe layout */}
      <Dialog open={isConfigPanelOpen} onOpenChange={setIsConfigPanelOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Component Configuration</DialogTitle>
            <DialogDescription>
              Adjust props, dependencies, and theme for your component's environment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <ConfigurerContainer />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}