/**
 * Editor Page - Vibe Layout Editor
 *
 * The main editor interface using the Vibe layout.
 * Contains all the state and logic for the component editor.
 *
 * @author Sorcery UI Team
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompactNavbar } from './CompactNavbar';
import VibeLayout from '../layouts/VibeLayout';
import { examples, multiComponentExamples } from '../examples/examples';
import { useComponentStore } from '../store/componentStore';

/**
 * EditorPage component - Main editor with Vibe layout
 *
 * Provides the complete editing interface using the Vibe layout,
 * including navbar controls, panel visibility toggles, and inline configuration surface.
 *
 * @returns {JSX.Element} The editor page JSX element
 */
export function EditorPage() {
  const navigate = useNavigate();
  const [mainSection, setMainSection] = useState<'preview' | 'code' | 'config'>('preview');

  // Panel visibility state for dock system
  const [isInspectorVisible, setIsInspectorVisible] = useState(true);
  const [isNavigatorVisible, setIsNavigatorVisible] = useState(true);

  const { isRendering, loadExample, renderActiveComponent, examplesVersion, currentExampleName } = useComponentStore();
  
  // Access state directly through project structure to avoid getter function issues
  const activeProjectId = useComponentStore((state) => state.activeProjectId);
  const projects = useComponentStore((state) => state.projects);
  
  const activeProject = activeProjectId ? projects[activeProjectId] : null;
  const activeComponentId = activeProject?.activeComponentId ?? null;
  const activeComponent = activeComponentId && activeProject 
    ? activeProject.components[activeComponentId] 
    : null;

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
    if (layout === 'experimental') {
      navigate('/editor-experimental');
    }
    // Already on vibe layout, no need to navigate
  };

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
        onMainSectionChange={setMainSection}
        onInspectorToggle={() => setIsInspectorVisible(!isInspectorVisible)}
        onNavigatorToggle={() => setIsNavigatorVisible(!isNavigatorVisible)}
        onExampleSelect={handleExampleSelect}
        onRender={renderActiveComponent}
        currentLayout="vibe"
        onLayoutChange={handleLayoutChange}
      />
      <div className="flex-1 overflow-hidden">
        <VibeLayout
          mainSection={mainSection}
          isInspectorVisible={isInspectorVisible}
          isNavigatorVisible={isNavigatorVisible}
          onNavigatorToggle={() => setIsNavigatorVisible(!isNavigatorVisible)}
        />
      </div>
    </div>
  );
}