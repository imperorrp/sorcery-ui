import React from 'react';

interface PanelHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  children,
}) => {
  return (
    <div className="flex items-center justify-between h-10 px-2 sm:px-3 border-b bg-card text-xs font-semibold text-foreground">
      <span>{title}</span>
      <div className="flex items-center gap-1 ml-auto">
        {children}
      </div>
    </div>
  );
};
