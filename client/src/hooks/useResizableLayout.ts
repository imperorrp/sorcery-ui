import { useState, useEffect } from 'react';

/**
 * Custom hook for managing resizable layout panels in the editor.
 *
 * This hook encapsulates all the state and logic for resizing the navigator,
 * code editor, and inspector panels. It handles mouse events, boundary constraints,
 * and persistence of panel sizes to localStorage.
 *
 * @returns An object containing all state values and handler functions for layout management
 */
export function useResizableLayout() {
  // Panel size states
  const [leftPanelWidthPx, setLeftPanelWidthPx] = useState<number | null>(null);
  const [navWidth, setNavWidth] = useState<number>(240); // px
  const [inspectorHeight, setInspectorHeight] = useState<number>(384); // pixels

  // Minimization states
  const [isLeftPanelMinimized, setIsLeftPanelMinimized] = useState(false);
  const [isInspectorMinimized, setIsInspectorMinimized] = useState(false);
  const [isNavMinimized, setIsNavMinimized] = useState(false);

  // Resizing states
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingInspector, setIsResizingInspector] = useState(false);
  const [isResizingNav, setIsResizingNav] = useState(false);

  // Constants
  const HEADER_HEIGHT = 48;
  const INSPECTOR_KEY = 'inspectorHeight';

  // Handler functions
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    setIsResizingLeft(true);
    e.preventDefault();
  };

  const handleInspectorResizeStart = (e: React.MouseEvent) => {
    setIsResizingInspector(true);
    e.preventDefault();
  };

  const handleNavResizeStart = (e: React.MouseEvent) => {
    setIsResizingNav(true);
    e.preventDefault();
  };

  // Main useEffect for handling resize logic and initialization
  useEffect(() => {
    // Initialize editor width to 50% of available space on first mount
    if (leftPanelWidthPx === null) {
      const container = document.querySelector('[data-layout-container]');
      if (container) {
        const rect = (container as HTMLElement).getBoundingClientRect();
        const navResizerW = 4; // tailwind w-1 = 4px
        const leftResizerW = 4;
        const effectiveNav = (isNavMinimized ? 40 : navWidth);
        const available = rect.width - effectiveNav - navResizerW - leftResizerW;
        const initial = Math.max(240, Math.floor(available * 0.5));
        setLeftPanelWidthPx(initial);
      }
    }

    // Load persisted inspector height on mount
    try {
      const stored = localStorage.getItem(INSPECTOR_KEY);
      if (stored) {
        const parsed = Number(stored);
        if (!Number.isNaN(parsed)) {
          setInspectorHeight(Math.max(100, Math.min(600, parsed)));
        }
      }
    } catch {
      // ignore
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const container = document.querySelector('[data-layout-container]');
        if (container) {
          const rect = container.getBoundingClientRect();
          // Compute pixel width relative to the available space to the right of the navigator
          const navResizerW = 4; // tailwind w-1
          const leftResizerW = 4;
          const effectiveNav = (isNavMinimized ? 40 : navWidth);
          const leftEdge = rect.left + effectiveNav + navResizerW;
          const available = rect.width - effectiveNav - navResizerW - leftResizerW;
          const raw = e.clientX - leftEdge;
          const minPx = 200; // minimum editor width
          const maxPx = Math.max(minPx, available - 300); // keep at least 300px for the canvas
          const clamped = Math.max(minPx, Math.min(maxPx, raw));
          setLeftPanelWidthPx(Math.floor(clamped));
        }
      } else if (isResizingInspector) {
        const container = document.querySelector('[data-inspector-container]');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newHeight = rect.bottom - e.clientY;
          const clamped = Math.max(100, Math.min(600, newHeight));
          setInspectorHeight(clamped);
          // persist while resizing
          try {
            localStorage.setItem(INSPECTOR_KEY, String(clamped));
          } catch {
            // ignore
          }
        }
      } else if (isResizingNav) {
        const container = document.querySelector('[data-layout-container]');
        if (container) {
          const rect = container.getBoundingClientRect();
          const min = 160;
          const max = Math.min(480, rect.width * 0.4);
          const newWidth = Math.max(min, Math.min(max, e.clientX - rect.left));
          setNavWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingInspector(false);
      setIsResizingNav(false);
    };

    if (isResizingLeft || isResizingInspector || isResizingNav) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingInspector, isResizingNav, isNavMinimized, navWidth, leftPanelWidthPx]);

  // Persist inspectorHeight when it changes (and not minimized)
  useEffect(() => {
    if (!isInspectorMinimized) {
      try {
        localStorage.setItem(INSPECTOR_KEY, String(inspectorHeight));
      } catch {
        // ignore
      }
    }
  }, [inspectorHeight, isInspectorMinimized]);

  return {
    // State values
    leftPanelWidthPx,
    navWidth,
    inspectorHeight,
    isLeftPanelMinimized,
    isInspectorMinimized,
    isNavMinimized,
    isResizingLeft,
    isResizingInspector,
    isResizingNav,

    // State setters
    setIsLeftPanelMinimized,
    setIsInspectorMinimized,
    setIsNavMinimized,

    // Handler functions
    handleLeftResizeStart,
    handleInspectorResizeStart,
    handleNavResizeStart,

    // Constants (exposed for use in component)
    HEADER_HEIGHT,
  };
}
