import React from 'react';

export const EditorLayout = () => {
  return (
    <div className="flex h-screen w-screen bg-gray-800 text-white">
      <aside className="w-1/5 bg-gray-900 p-4">
        {/* ComponentTree will go here */}
        Navigator Panel
      </aside>
      <main className="flex-1 flex flex-col">
        <div className="flex-1 border-2 border-gray-700 m-4">
          {/* ComponentCanvas will go here */}
          Canvas
        </div>
        <div className="h-1/3 bg-gray-900 p-4">
          {/* MonacoEditor will go here */}
          Code Editor
        </div>
      </main>
      <aside className="w-1/5 bg-gray-900 p-4">
        {/* InspectorPanel will go here */}
        Inspector Panel
      </aside>
    </div>
  );
};