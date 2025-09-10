import React from 'react';

interface PanelHeaderProps {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * PanelHeader Component - Reusable Panel Header with Title and Controls
 *
 * A flexible header component for panels that displays a title with optional icon
 * and provides space for action buttons or controls on the right side.
 *
 * @param title - The title text to display
 * @param icon - Optional icon to display next to the title
 * @param children - Optional action buttons or controls
 * @returns The rendered PanelHeader component
 */
export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  icon,
  children,
}) => {
  return (
    <div className="flex items-center justify-between h-12 px-3 sm:px-4 border-b bg-card text-md font-bold text-foreground font-sans min-w-0 overflow-hidden">
      {/* Title area: keep visible as long as possible (do not aggressively shrink) */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0 overflow-hidden">
        {icon}
        <span className="truncate whitespace-nowrap">{title}</span>
      </div>

      {/* Controls area: allow controls to shrink first; individual buttons should manage their own truncation */}
      <div className="flex items-center gap-2 ml-auto min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
