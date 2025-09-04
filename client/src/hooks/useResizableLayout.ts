/**
 * Resizable Layout Hook - Panel Management System
 *
 * This custom hook manages the resizable panel layout system for the Live Component Editor.
 * It provides state management, persistence, and event handling for the three-panel layout:
 * Navigator, Code Editor, and Inspector panels.
 *
 * Key Features:
 * - Panel size management with percentage-based layouts
 * - Persistent layout state using localStorage
 * - Minimization controls for each panel
 * - Integration with react-resizable-panels library
 * - Automatic layout restoration on app reload
 * - Error handling for storage operations
 *
 * Architecture:
 * - Uses react-resizable-panels for robust resizing behavior
 * - Persists layout preferences to maintain user experience
 * - Provides toggle controls for panel minimization
 * - Handles layout constraints and size validation
 *
 * Panel Structure:
 * - Navigator Panel (left): Component library and tree navigation
 * - Code Editor Panel (center): Monaco editor for code editing
 * - Inspector Panel (right): Props, styles, and component settings
 *
 * @author Live Component Editor Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing resizable layout panels using react-resizable-panels.
 *
 * This hook provides comprehensive state management for the three-panel layout system.
 * It handles panel sizes, minimization states, layout persistence, and user interactions.
 * The hook integrates with react-resizable-panels for smooth, performant resizing.
 *
 * Features:
 * - Percentage-based panel sizing for responsive behavior
 * - Persistent layout storage in localStorage
 * - Panel minimization controls with toggle functions
 * - Automatic layout restoration on component mount
 * - Error handling for storage operations
 * - Callback optimization for performance
 *
 * @returns Object containing panel sizes, states, and handler functions
 */
export function useResizableLayout() {
  // Panel size states (in percentages for react-resizable-panels)
  const [navPanelSize, setNavPanelSize] = useState<number>(20); // Navigator panel size
  const [editorPanelSize, setEditorPanelSize] = useState<number>(50); // Code editor panel size
  const [inspectorPanelSize, setInspectorPanelSize] = useState<number>(30); // Inspector panel size

  // Minimization states
  const [isLeftPanelMinimized, setIsLeftPanelMinimized] = useState(false);
  const [isInspectorMinimized, setIsInspectorMinimized] = useState(false);
  const [isNavMinimized, setIsNavMinimized] = useState(false);

  // Layout persistence keys
  const NAV_LAYOUT_KEY = 'editor-nav-layout';
  const EDITOR_LAYOUT_KEY = 'editor-main-layout';

  // Load persisted layouts on mount
  useEffect(() => {
    try {
      const navLayout = localStorage.getItem(NAV_LAYOUT_KEY);
      if (navLayout) {
        const parsed = JSON.parse(navLayout);
        if (Array.isArray(parsed) && parsed.length >= 1) {
          setNavPanelSize(parsed[0]);
        }
      }

      const editorLayout = localStorage.getItem(EDITOR_LAYOUT_KEY);
      if (editorLayout) {
        const parsed = JSON.parse(editorLayout);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          setEditorPanelSize(parsed[0]);
          setInspectorPanelSize(parsed[1]);
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted layout:', error);
    }
  }, []);

  // Handlers for layout changes
  const handleNavLayoutChange = useCallback((sizes: number[]) => {
    if (sizes.length >= 1) {
      setNavPanelSize(sizes[0]);
      try {
        localStorage.setItem(NAV_LAYOUT_KEY, JSON.stringify(sizes));
      } catch (error) {
        console.warn('Failed to persist nav layout:', error);
      }
    }
  }, []);

  const handleMainLayoutChange = useCallback((sizes: number[]) => {
    if (sizes.length >= 2) {
      setEditorPanelSize(sizes[0]);
      setInspectorPanelSize(sizes[1]);
      try {
        localStorage.setItem(EDITOR_LAYOUT_KEY, JSON.stringify(sizes));
      } catch (error) {
        console.warn('Failed to persist main layout:', error);
      }
    }
  }, []);

  // Toggle handlers
  const toggleLeftPanel = useCallback(() => {
    setIsLeftPanelMinimized(prev => !prev);
  }, []);

  const toggleInspector = useCallback(() => {
    setIsInspectorMinimized(prev => !prev);
  }, []);

  const toggleNav = useCallback(() => {
    setIsNavMinimized(prev => !prev);
  }, []);

  return {
    // Panel sizes
    navPanelSize,
    editorPanelSize,
    inspectorPanelSize,

    // Minimization states
    isLeftPanelMinimized,
    isInspectorMinimized,
    isNavMinimized,

    // Layout change handlers
    handleNavLayoutChange,
    handleMainLayoutChange,

    // Toggle handlers
    toggleLeftPanel,
    toggleInspector,
    toggleNav,

    // Constants for backward compatibility
    HEADER_HEIGHT: 48,
  };
}
