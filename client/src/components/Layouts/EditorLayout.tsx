// React import not required with automatic JSX runtime
import { ComponentTree } from '@/components/Navigator/ComponentTree';
import { ComponentCanvas } from '@/components/Canvas/ComponentCanvas';
import { MonacoEditor } from '@/components/CodeEditor/MonacoEditor';
import { InspectorPanel } from '@/components/Inspector/InspectorPanel';

export const EditorLayout = () => {
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      <aside className="w-64 bg-gray-950 p-2 border-r border-gray-800 flex flex-col">
        <h2 className="text-lg font-bold mb-4 px-2">Navigator</h2>
        <div className="overflow-y-auto flex-grow">
          <ComponentTree />
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 border-2 border-gray-800 m-4 min-h-0">
          <ComponentCanvas />
        </div>
        <div className="h-1/3 bg-gray-900 p-4 border-t border-gray-800 min-h-0">
          <MonacoEditor />
        </div>
      </main>
      <aside className="w-96 bg-gray-950 p-0 border-l border-gray-800">
        <InspectorPanel onApplyChanges={() => { /* legacy layout noop */ }} />
      </aside>
    </div>
  );
};