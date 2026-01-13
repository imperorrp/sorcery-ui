/**
 * Sorcery UI - Main Application Component
 *
 * This is the root component of the Sorcery UI application. It provides
 * the overall application structure, theme management, and routing.
 *
 * Architecture Overview:
 * - ThemeProvider: Manages light/dark theme state and transitions
 * - BrowserRouter: Handles client-side routing between pages
 * - Routes: Defines paths for home page and editor variants
 *
 * Layout Structure:
 * - Full-screen container with proper overflow handling
 * - Theme-aware background colors with smooth transitions
 * - Responsive routing for different application sections
 *
 * Key Features:
 * - Theme support with system preference detection
 * - Client-side routing between home and editor pages
 * - Multiple layout modes (Vibe and Experimental)
 * - Proper accessibility with semantic HTML structure
 * - Performance optimized with minimal re-renders
 *
 * @author Sorcery UI Team
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { HomePage } from './components/HomePage';
// import { HomePageAlt } from './components/HomePageAlt'; // temporarily disabled
import { EditorPage } from './components/EditorPage';
import { ExperimentalEditorPage } from './components/ExperimentalEditorPage';

/**
 * Root application component that orchestrates the entire Sorcery UI application.
 *
 * This component serves as the main container and coordinator for all major
 * application features. It establishes the theme context and handles routing
 * between the home page and different editor layouts.
 *
 * @returns {JSX.Element} The complete Sorcery UI application interface
 */
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* /alt route temporarily disabled */}
          {/* <Route path="/alt" element={<HomePageAlt />} /> */}
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/editor-experimental" element={<ExperimentalEditorPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
