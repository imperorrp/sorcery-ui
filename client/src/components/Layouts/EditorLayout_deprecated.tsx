// note: this file's code is NOT in use currently. ignore it.

/**
 * EditorLayout_deprecated Component - Deprecated Layout Implementation
 *
 * This is a deprecated layout implementation that has been replaced by the main EditorLayout.tsx.
 * This file is kept for reference but is not currently used in the application.
 *
 * @deprecated Use EditorLayout.tsx instead
 * @returns The rendered deprecated EditorLayout component
 */

// React import not required with automatic JSX runtime
import { ComponentTree } from '@/components/Navigator/ComponentTree';
import { ComponentCanvas } from '@/components/Canvas/ComponentCanvas';
import { CodeEditorWithTabs } from '@/components/CodeEditor/CodeEditorWithTabs';
import { ConfigurerPanel } from '@/components/Inspector/ConfigurerPanel';

export const EditorLayout = () => {
  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <aside className="w-64 bg-card p-2 border-r border-border flex flex-col">
        <h2 className="text-lg font-bold mb-4 px-2">Navigator</h2>
        <div className="overflow-y-auto flex-grow">
          <ComponentTree />
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 border-2 border-border m-4 min-h-0">
          <ComponentCanvas />
        </div>
        <div className="h-1/3 bg-card border-t border-border min-h-0">
          <CodeEditorWithTabs />
        </div>
      </main>
      <aside className="w-96 bg-card p-0 border-l border-border">
        <ConfigurerPanel />
      </aside>
    </div>
  );
};