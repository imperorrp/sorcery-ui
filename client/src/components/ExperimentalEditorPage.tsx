/**
 * Experimental Editor Page - Experimental Layout Editor
 *
 * The experimental editor interface using the Experimental layout.
 * Contains all the state and logic for the component editor.
 *
 * @author Sorcery UI Team
 */

import { Navbar } from './Navbar';
import { ExperimentalLayout } from '../layouts/ExperimentalLayout';
import { useState } from 'react';
import { examples, multiComponentExamples } from '../examples/examples';
import { useComponentStore } from '../store/componentStore';

/**
 * ExperimentalEditorPage component - Experimental editor with Experimental layout
 *
 * Provides the experimental editing interface with advanced panel controls,
 * fullscreen mode, and comprehensive layout management.
 *
 * @returns {JSX.Element} The experimental editor page JSX element
 */
export function ExperimentalEditorPage() {
  // Layout state - lifted up to App.tsx for centralized control
  const [layoutMode] = useState('experimental'); // Fixed to experimental for this route
  const [mainView, setMainView] = useState('canvas'); // 'canvas' or 'code'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Panel visibility state for dock system
  const [isCodeEditorVisible, setIsCodeEditorVisible] = useState(true);
  const [isInspectorVisible, setIsInspectorVisible] = useState(true);
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(true);
  const [isConfigurerVisible, setIsConfigurerVisible] = useState(true);

  // Remember panel states before entering fullscreen
  const [preFullscreenStates, setPreFullscreenStates] = useState({
    codeEditor: true,
    inspector: true,
    navigator: true,
    configurer: true
  });

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
        onConfigToggle={() => {}} // No config modal for experimental
      />
      <div className="flex-1 overflow-hidden">
        <ExperimentalLayout
          isFullscreen={isFullscreen}
          isCodeEditorVisible={isCodeEditorVisible}
          isInspectorVisible={isInspectorVisible}
          isNavigatorVisible={isNavigatorVisible}
          isConfigurerVisible={isConfigurerVisible}
          preFullscreenStates={preFullscreenStates}
          setIsFullscreen={setIsFullscreen}
          setIsCodeEditorVisible={setIsCodeEditorVisible}
          setIsInspectorVisible={setIsInspectorVisible}
          setIsNavigatorVisible={setIsNavigatorVisible}
          setIsConfigurerVisible={setIsConfigurerVisible}
          setPreFullscreenStates={setPreFullscreenStates}
        />
      </div>
    </div>
  );
}