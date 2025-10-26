/**
 * Experimental Editor Page - Experimental Layout Editor
 *
 * The experimental editor interface using the Experimental layout.
 * Contains all the state and logic for the component editor.
 *
 * @author Sorcery UI Team
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompactNavbar } from './CompactNavbar';
import { ExperimentalLayout } from '../layouts/ExperimentalLayout';
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
  const navigate = useNavigate();
  const [mainSection, setMainSection] = useState<'preview' | 'code' | 'config'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Panel visibility state for dock system
  const [isCodeEditorVisible, setIsCodeEditorVisible] = useState(true);
  const [isInspectorVisible, setIsInspectorVisible] = useState(true);
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(true);
  const [isConfigurerVisible, setIsConfigurerVisible] = useState(true);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  // Remember panel states before entering fullscreen
  const [preFullscreenStates, setPreFullscreenStates] = useState({
    codeEditor: true,
    inspector: true,
    navigator: true,
    configurer: true,
    preview: true
  });

  const { isRendering, loadExample, renderActiveComponent, examplesVersion, currentExampleName } = useComponentStore();
  const activeComponent = useComponentStore((state) =>
    state.activeComponentId ? state.components[state.activeComponentId] : null
  );

  const currentProjectName = currentExampleName ?? activeComponent?.name ?? Object.keys(examples)[0] ?? 'Loading...';

  useEffect(() => {
    void renderActiveComponent();
  }, [renderActiveComponent]);

  useEffect(() => {
    if (examplesVersion > 0) {
      void renderActiveComponent();
    }
  }, [examplesVersion, renderActiveComponent]);

  // Auto-load the first example on initial load
  useEffect(() => {
    const firstExampleKey = Object.keys(examples)[0]; // 'Default'
    if (firstExampleKey) {
      loadExample(firstExampleKey);
    }
  }, [loadExample]); // Only depend on loadExample, not activeComponent

  const handleExampleSelect = (key: string) => {
    loadExample(key);
    setMainSection('preview');
  };

  const handleLayoutChange = (layout: 'vibe' | 'experimental') => {
    if (layout === 'vibe') {
      navigate('/editor');
    }
    // Already on experimental layout, no need to navigate
  };

  const handleMainSectionChange = useCallback(
    (section: 'preview' | 'code' | 'config') => {
      setMainSection(section);

      if (section === 'code') {
        setIsCodeEditorVisible(true);
      }

      if (section === 'config') {
        setIsConfigurerVisible(true);
      }
    },
    [setIsCodeEditorVisible, setIsConfigurerVisible],
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <CompactNavbar
        currentProjectName={currentProjectName}
        mainSection={mainSection}
        isInspectorVisible={isInspectorVisible}
        isNavigatorVisible={isNavigatorVisible}
        examples={examples}
        multiComponentExamples={multiComponentExamples}
        isRendering={isRendering}
        onMainSectionChange={handleMainSectionChange}
        onInspectorToggle={() => setIsInspectorVisible(!isInspectorVisible)}
        onNavigatorToggle={() => setIsNavigatorVisible(!isNavigatorVisible)}
        onExampleSelect={handleExampleSelect}
        onRender={renderActiveComponent}
        isCodeEditorVisible={isCodeEditorVisible}
        isConfigurerVisible={isConfigurerVisible}
        isPreviewVisible={isPreviewVisible}
        onCodeEditorToggle={() => setIsCodeEditorVisible(!isCodeEditorVisible)}
        onConfigurerToggle={() => setIsConfigurerVisible(!isConfigurerVisible)}
        onPreviewToggle={() => setIsPreviewVisible(!isPreviewVisible)}
        currentLayout="experimental"
        onLayoutChange={handleLayoutChange}
      />
      <div className="flex-1 overflow-hidden">
        <ExperimentalLayout
          mainSection={mainSection}
          isFullscreen={isFullscreen}
          isCodeEditorVisible={isCodeEditorVisible}
          isInspectorVisible={isInspectorVisible}
          isNavigatorVisible={isNavigatorVisible}
          isConfigurerVisible={isConfigurerVisible}
          isPreviewVisible={isPreviewVisible}
          preFullscreenStates={preFullscreenStates}
          setIsFullscreen={setIsFullscreen}
          setIsCodeEditorVisible={setIsCodeEditorVisible}
          setIsInspectorVisible={setIsInspectorVisible}
          setIsNavigatorVisible={setIsNavigatorVisible}
          setIsConfigurerVisible={setIsConfigurerVisible}
          setIsPreviewVisible={setIsPreviewVisible}
          setPreFullscreenStates={setPreFullscreenStates}
          onRender={renderActiveComponent}
          isRendering={isRendering}
        />
      </div>
    </div>
  );
}