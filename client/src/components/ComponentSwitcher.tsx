/**
 * ComponentSwitcher Component
 * 
 * A dropdown component that displays all components in the active project
 * and allows switching between them. Features include:
 * - Visual list of all components with active indicator
 * - Search/filter functionality
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Component count badge
 * - Create new component action
 * 
 * Used in the CompactNavbar for global component switching.
 */

import { useState, useRef, useEffect } from 'react';
import { useComponentStore } from '@/store/componentStore';
import { ChevronDown, Plus, Search, FileCode } from 'lucide-react';

export function ComponentSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get data from store
  const activeProjectId = useComponentStore((state) => state.activeProjectId);
  const projects = useComponentStore((state) => state.projects);
  const setActiveComponent = useComponentStore((state) => state.setActiveComponent);
  const addComponent = useComponentStore((state) => state.addComponent);

  const activeProject = activeProjectId ? projects[activeProjectId] : null;
  const activeComponentId = activeProject?.activeComponentId ?? null;
  const activeComponent = activeComponentId && activeProject 
    ? activeProject.components[activeComponentId] 
    : null;
  const allComponents = activeProject ? Object.values(activeProject.components) : [];

  // Filter components based on search query
  const filteredComponents = allComponents.filter((component) =>
    component.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleSelectComponent = (componentId: string) => {
    setActiveComponent(componentId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateComponent = () => {
    addComponent();
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 min-w-40"
        aria-label="Switch component"
        aria-expanded={isOpen}
      >
        <FileCode className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="flex-1 text-left text-sm truncate">
          {activeComponent?.name || 'No Component'}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            {allComponents.length}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Component List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredComponents.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No components found' : 'No components yet'}
              </div>
            ) : (
              <div className="py-1">
                {filteredComponents.map((component) => {
                  const isActive = component.id === activeComponent?.id;
                  return (
                    <button
                      key={component.id}
                      onClick={() => handleSelectComponent(component.id)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <FileCode className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{component.name}</span>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create New Component Button */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCreateComponent}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Component</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
