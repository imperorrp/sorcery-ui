/**
 * ComponentTabs - IDE-Style Component Tab Bar
 *
 * A modern tab interface for switching between components, inspired by VS Code tabs.
 * Features overflow management with a popover for additional components, drag-and-drop
 * reordering, and integrated actions for adding/deleting components. Supports theme
 * switching and maintains tab state across component library changes.
 *
 * @returns {JSX.Element} The rendered ComponentTabs component
 */
import React, { useRef, useState, useEffect } from 'react';
import { useComponentStore } from '@/store/componentStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Plus, MoreHorizontal, BookOpenCheck, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LibraryPanel } from '@/components/Library/LibraryPanel';

/**
 * Examples dropdown component for loading code templates
 */




/**
 * Main ComponentTabs component providing IDE-style tab interface
 *
 * Manages component switching, tab ordering, overflow handling, and library integration.
 * Automatically adjusts to theme changes and component library updates.
 *
 * @returns {JSX.Element} The rendered ComponentTabs component
 */
export const ComponentTabs: React.FC = () => {
  // Subscribe to only the slices we need to avoid stale closures
  const components = useComponentStore((s) => s.components);
  const activeComponentId = useComponentStore((s) => s.activeComponentId);
  const setActiveComponent = useComponentStore((s) => s.setActiveComponent);
  const addComponent = useComponentStore((s) => s.addComponent);

  const componentList = React.useMemo(() => Object.values(components), [components]);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  // Track user-closed tabs (they remain in the library, but hidden from tab bar)
  const [closedTabIds, setClosedTabIds] = useState<string[]>([]);
  // Track the order in which tabs were opened. New/opened tabs move to the end (rightmost).
  const [openOrder, setOpenOrder] = useState<string[]>(() => componentList.map((c) => c.id));
  const { theme } = useTheme();
  const draggedIdRef = useRef<string | null>(null);
  // derive visible and hidden tabs from the live component list to avoid stale UI
  const maxVisible = 6;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [leftHiddenCount, setLeftHiddenCount] = useState(0);
  const [rightHiddenCount, setRightHiddenCount] = useState(0);
  // Build ordered open tabs using openOrder; fallback to componentList order for any missing ids
  const orderedOpenTabs = openOrder
    .map((id) => components[id])
    .filter(Boolean) as typeof componentList;
  // Include any components not yet in openOrder (e.g., initial load)
  const missingTabs = componentList.filter((c) => !openOrder.includes(c.id));
  const openTabs = [...orderedOpenTabs, ...missingTabs].filter((c) => !closedTabIds.includes(c.id));
  // Show up to `maxVisible` tabs; remaining go into the overflow menu
  const visibleTabs = openTabs.slice(0, maxVisible);
  const hiddenTabs = openTabs.slice(maxVisible);

  // If a component becomes active, ensure its tab is visible. Only append it to
  // the end of the open order when it was explicitly opened (for example via
  // the library). We read the transient flag from the global store.
  const lastOpenedTabId = useComponentStore((s) => s.lastOpenedTabId);
  useEffect(() => {
    if (!activeComponentId) return;
    setClosedTabIds((s) => s.filter((id) => id !== activeComponentId));
    // If this activation was due to an explicit 'open' action, append it to the end
    if (lastOpenedTabId && lastOpenedTabId === activeComponentId) {
      setOpenOrder((prev) => {
        const filtered = prev.filter((id) => id !== activeComponentId);
        return [...filtered, activeComponentId];
      });
      // After appending, scroll the tabs container to the right so the new tab is visible
      setTimeout(() => {
        try {
          const el = tabsContainerRef.current;
          if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
        } catch {
          // ignore
        }
      }, 50);
      // clear the transient flag so subsequent activations don't keep appending
      useComponentStore.getState().clearLastOpenedTab();
    }
    // Otherwise, do not change openOrder -- clicking an existing tab should not move it
  }, [activeComponentId, lastOpenedTabId]);

  // Auto-scroll the active tab into view when active changes
  useEffect(() => {
    if (!activeComponentId) return;
    const el = tabsContainerRef.current;
    if (!el) return;
    // find the child corresponding to the activeComponentId
    const child = Array.from(el.children).find((c) => c.getAttribute && c.getAttribute('data-component-id') === activeComponentId) as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [activeComponentId]);

  // Track scroll state for showing left/right jump buttons
  // Insert subtle scrollbar styles once for the no-scrollbar class and keep counts of hidden tabs
  useEffect(() => {
    const styleId = 'component-tabs-scrollbar-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        /* Very thin, subtle scrollbar for tabs - visible on hover */
        .no-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(60,60,60,0.18) transparent; }
        .no-scrollbar::-webkit-scrollbar { height: 4px; }
        .no-scrollbar::-webkit-scrollbar-thumb { background: rgba(60,60,60,0.18); border-radius: 999px; }
        /* Slightly stronger thumb when hovering over the tabs area */
        .no-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(60,60,60,0.32); }
        .no-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `;
      document.head.appendChild(style);
    }

    const el = tabsContainerRef.current;
    if (!el) return;

    const update = () => {
      const scrollLeft = el.scrollLeft;
      const clientW = el.clientWidth;
      const scrollW = el.scrollWidth;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollW > clientW + 2 && scrollLeft + clientW < scrollW - 2);

      // compute hidden counts by inspecting child positions
      let leftCount = 0;
      let rightCount = 0;
      const children = Array.from(el.children) as HTMLElement[];
      for (const child of children) {
        const childLeft = child.offsetLeft;
        const childRight = childLeft + child.offsetWidth;
        if (childRight <= scrollLeft + 1) leftCount++;
        if (childLeft >= scrollLeft + clientW - 1) rightCount++;
      }
      setLeftHiddenCount(leftCount);
      setRightHiddenCount(rightCount);
    };

    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [visibleTabs.length, openTabs.length]);

  // If the components collection changes (for example, when loading an example set),
  // reset closed tabs so the tab bar is freshly created from the new components.
  const examplesVersion = useComponentStore((s) => s.examplesVersion);
  // Reset closed tabs only when a new example set is loaded. This avoids
  // re-opening all tabs when the user adds a single component.
  useEffect(() => {
    setClosedTabIds([]);
  // Reset open order to match fresh example set (read directly from store to avoid hook lint)
  const freshComponents = useComponentStore.getState().components;
  setOpenOrder(Object.values(freshComponents).map((c) => c.id));
  }, [examplesVersion]);

  // Keep openOrder in sync when components are added/removed (preserve order)
  useEffect(() => {
    setOpenOrder((prev) => prev.filter((id) => !!components[id]));
  }, [components]);

  // Safety: If the components collection is fully replaced (for example when
  // switching example sets) and none of the previously open ids overlap the
  // new component ids, reset openOrder and closed tabs so tabs do not persist
  // across example switches.
  useEffect(() => {
    const currentIds = componentList.map((c) => c.id);
    // If there is any overlap between the current open order and new components
    const hasOverlap = openOrder.some((id) => components[id]);
    if (!hasOverlap) {
      setClosedTabIds([]);
      setOpenOrder(currentIds);
    }
  // Intentionally include openOrder; we only reset when overlap is gone
  }, [components, openOrder, componentList]);

  // If closed tabs changed and the active tab is now closed, switch to another open tab or clear active
  useEffect(() => {
    if (!activeComponentId) return;
    if (closedTabIds.includes(activeComponentId)) {
      const openTabs = componentList.filter((c) => !closedTabIds.includes(c.id));
      if (openTabs.length > 0) {
        setActiveComponent(openTabs[0].id);
      } else {
        // No open tabs left — clear active component so editor shows nothing
        useComponentStore.setState({ activeComponentId: null });
      }
    }
  }, [closedTabIds, activeComponentId, componentList, setActiveComponent]);

  // tabs are derived above; no resize listener needed

  /**
   * Handle closing a tab (hides it from the tab bar, but keeps it in the library)
   *
   * @param {string} componentId - The ID of the component to close
   * @param {React.MouseEvent | React.KeyboardEvent} [e] - Optional event to prevent propagation
   */
  const handleCloseTab = (componentId: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    setClosedTabIds((s) => Array.from(new Set([...s, componentId])));
    // Also remove the tab from our ordering
    setOpenOrder((s) => s.filter((id) => id !== componentId));
    // If the closed tab was active, switch to the first visible tab
    if (activeComponentId === componentId) {
      const remaining = componentList.filter((c) => c.id !== componentId && !closedTabIds.includes(c.id));
      if (remaining.length > 0) setActiveComponent(remaining[0].id);
    }
  };

  /**
   * Scroll the tabs container to the left by one page of tabs
   */
  const scrollToStart = () => {
    const el = tabsContainerRef.current;
    if (!el) return;
  // Scroll backward by one page of tabs (approx)
  const firstChild = el.children[0] as HTMLElement | undefined;
  const tabW = firstChild ? firstChild.offsetWidth : 120;
  const page = Math.max(1, Math.floor(el.clientWidth / tabW) - 1);
  el.scrollTo({ left: Math.max(0, el.scrollLeft - page * tabW), behavior: 'smooth' });
  };

  /**
   * Scroll the tabs container to the right by one page of tabs
   */
  const scrollToEnd = () => {
    const el = tabsContainerRef.current;
    if (!el) return;
  // Scroll forward by one page of tabs (approx)
  const firstChild = el.children[0] as HTMLElement | undefined;
  const tabW = firstChild ? firstChild.offsetWidth : 120;
  const page = Math.max(1, Math.floor(el.clientWidth / tabW) - 1);
  el.scrollTo({ left: Math.min(el.scrollWidth, el.scrollLeft + page * tabW), behavior: 'smooth' });
  };

  return (
    <div className={
      `flex items-center h-10 px-2 border-b border-border shrink-0 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`
    }>
      {/* Left scroll control */}
      <div className="flex items-center mr-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={scrollToStart}
          disabled={!canScrollLeft}
          title={canScrollLeft ? `Scroll left (${leftHiddenCount} hidden)` : 'Scroll to left'}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs Container */}
  <div ref={tabsContainerRef} className="flex items-center gap-1 overflow-x-auto overflow-y-hidden no-scrollbar flex-grow">
        {visibleTabs
          .filter((c) => !closedTabIds.includes(c.id))
          .map((component) => (
          <div
            data-component-id={component.id}
            key={component.id}
            draggable
            onDragStart={(e) => {
              draggedIdRef.current = component.id;
              e.dataTransfer?.setData('text/plain', component.id);
              e.dataTransfer!.effectAllowed = 'move';
            }}
            onDragEnd={() => {
              draggedIdRef.current = null;
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const droppedId = draggedIdRef.current || e.dataTransfer?.getData('text/plain');
              const targetId = component.id;
              if (!droppedId || droppedId === targetId) return;
              setOpenOrder((prev) => {
                const without = prev.filter((id) => id !== droppedId);
                const targetIndex = without.indexOf(targetId);
                if (targetIndex === -1) return [...without, droppedId];
                return [...without.slice(0, targetIndex), droppedId, ...without.slice(targetIndex)];
              });
            }}
            onClick={() => setActiveComponent(component.id)}
            className={cn(
              'flex items-center h-8 px-3 -mb-px border-t border-l border-r rounded-t-md select-none cursor-pointer',
              'text-sm font-medium',
              activeComponentId === component.id
                ? (theme === 'dark' ? 'bg-gray-800 border-border text-foreground' : 'bg-white border-border text-foreground')
                : (theme === 'dark' ? 'bg-transparent text-muted-foreground hover:bg-gray-850 border-transparent' : 'bg-transparent text-muted-foreground hover:bg-gray-50 border-transparent')
            )}
            style={{ marginRight: 6 }}
          >
            <span className="truncate max-w-[140px]">{component.name}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => handleCloseTab(component.id, e)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCloseTab(component.id, e); }}
              className="ml-2 opacity-60 hover:opacity-100 text-xs"
              title={`Close ${component.name}`}
            >
              <X className="h-3 w-3" />
            </span>
          </div>
        ))}
      </div>

      {/* Right scroll control */}
      <div className="flex items-center ml-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={scrollToEnd}
          disabled={!canScrollRight}
          title={canScrollRight ? `Scroll right (${rightHiddenCount} hidden)` : 'Scroll to right'}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
      {/* Actions Section */}
      <div className="flex items-center gap-2 pl-3 border-l border-border ml-2">
        {/* Overflow Menu */}
        {hiddenTabs.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                title={`${hiddenTabs.length} more components`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 z-[100]" align="end">
              <div className="p-3 border-b border-border">
                <h4 className="font-semibold text-sm">All Components</h4>
                <p className="text-xs text-muted-foreground">Manage your component library</p>
              </div>
              <div className="max-h-[400px] overflow-auto">
                <LibraryPanel />
              </div>
            </PopoverContent>
          </Popover>
        )}
  {/* Library (always visible) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Open component library">
              <BookOpenCheck className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-0 z-[100]">
            <div className="p-3 border-b border-border">
              <h4 className="font-semibold text-sm">Library</h4>
              <p className="text-xs text-muted-foreground">Manage components</p>
            </div>
            <div className="max-h-[400px] overflow-auto">
              <LibraryPanel />
            </div>
          </PopoverContent>
        </Popover>
        {/* Add Component Button (stays in library) */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => {
            // Add a component via the store. addComponent sets it active.
            addComponent();
            const newActive = useComponentStore.getState().activeComponentId;
            if (newActive) {
              setClosedTabIds((s) => s.filter((id) => id !== newActive));
              setActiveComponent(newActive);
            }
          }}
          title="Add new component"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
/* End ComponentTabs */
