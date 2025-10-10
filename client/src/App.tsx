/**
 * Live Component Editor - Main Application Component
 *
 * This is the root component of the Live Component Editor application. It provides
 * the overall application structure, theme management, and layout coordination.
 *
 * Architecture Overview:
 * - ThemeProvider: Manages light/dark theme state and transitions
 * - TwentyFirstToolbar: External toolbar integration for additional tools
 * - Navbar: Top navigation with branding and global controls
 * - VibeLayout/ExperimentalLayout: Main editing interfaces with panels and canvas
 * - Config Panel Modal: Modal dialog for component configuration (Vibe layout only)
 *
 * Layout Structure:
 * - Full-screen container with proper overflow handling
 * - Theme-aware background colors with smooth transitions
 * - Responsive flex layout for navbar and main content
 * - Modal overlay system for configuration panels
 * - Overflow management to prevent layout issues
 *
 * Key Features:
 * - Theme support with system preference detection
 * - Responsive design for different screen sizes
 * - Multiple layout modes (Vibe and Experimental)
 * - Modal-based configuration panels
 * - Proper accessibility with semantic HTML structure
 * - Performance optimized with minimal re-renders
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

import { ThemeProvider } from '@/contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { ExperimentalLayout } from './components/ExperimentalLayout';
import VibeLayout from './components/Layouts/VibeLayout';
import { TwentyFirstToolbar } from '@21st-extension/toolbar-react';
import { ReactPlugin } from '@21st-extension/react';
import { useState } from 'react';
import { examples, multiComponentExamples } from './examples/examples';
import { useComponentStore } from './store/componentStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfigurerContainer } from './components/containers/ConfigurerContainer';

/**
 * Root application component that orchestrates the entire Live Component Editor.
 *
 * This component serves as the main container and coordinator for all major
 * application features. It establishes the theme context, provides the basic
 * layout structure, and ensures proper component composition.
 *
 * @returns The complete Live Component Editor application interface
 */
function App() {
  // Layout state - lifted up to App.tsx for centralized control
  const [layoutMode, setLayoutMode] = useState('vibe'); // 'vibe' or 'experimental'
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

  // Config panel modal state for Vibe layout
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  // Store hooks for global actions
  const { isRendering, loadExample, renderActiveComponent } = useComponentStore();

  return (
    <ThemeProvider>
      <TwentyFirstToolbar config={{ plugins: [ReactPlugin] }} />
      <div className="h-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navbar
          layoutMode={layoutMode}
          mainView={mainView}
          isInspectorVisible={isInspectorVisible}
          isNavigatorVisible={isNavigatorVisible}
          examples={examples}
          multiComponentExamples={multiComponentExamples}
          isRendering={isRendering}
          onLayoutModeChange={setLayoutMode}
          onMainViewChange={setMainView}
          onInspectorToggle={() => setIsInspectorVisible(!isInspectorVisible)}
          onNavigatorToggle={() => setIsNavigatorVisible(!isNavigatorVisible)}
          onExampleSelect={loadExample}
          onRender={renderActiveComponent}
          onConfigToggle={() => setIsConfigPanelOpen(true)}
        />
        <div className="flex-1 overflow-hidden">
          {layoutMode === 'vibe' ? (
            <VibeLayout
              mainView={mainView}
              isInspectorVisible={isInspectorVisible}
              isNavigatorVisible={isNavigatorVisible}
            />
          ) : (
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
          )}
        </div>
      </div>

      {/* Config Panel Modal - only for Vibe layout */}
      {layoutMode === 'vibe' && (
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
      )}
    </ThemeProvider>
  );
}

export default App;
