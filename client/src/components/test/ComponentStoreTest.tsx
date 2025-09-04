import React from 'react';
import { useComponentStore } from '@/store/componentStore';

/**
 * Simple test component to verify the new multi-component state management
 * This is for testing purposes only and can be removed later
 */
export const ComponentStoreTest: React.FC = () => {
  const {
    components,
    activeComponentId,
    addComponent,
    setActiveComponent,
    updateComponentName,
    // Legacy getters should still work
    componentAst,
    componentPreviewAst,
    propsJson,
    dependencies,
    wrapperCode,
    originalCode,
    jsxLocation,
    history,
    historyIndex,
  } = useComponentStore();

  const activeComponent = activeComponentId ? components[activeComponentId] : null;

  return (
    <div style={{ padding: '20px', border: '2px solid #ccc', margin: '10px' }}>
      <h3>Component Store Test</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Active Component ID:</strong> {activeComponentId}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Active Component Name:</strong> {activeComponent?.name || 'None'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Total Components:</strong> {Object.keys(components).length}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Component List:</strong>
        <ul>
          {Object.values(components).map((comp) => (
            <li key={comp.id}>
              {comp.name} ({comp.id})
              {comp.id === activeComponentId && ' ← Active'}
            </li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <button onClick={addComponent} style={{ marginRight: '10px' }}>
          Add Component
        </button>
        {activeComponent && (
          <button 
            onClick={() => updateComponentName(activeComponent.id, `Updated ${Date.now()}`)}
            style={{ marginRight: '10px' }}
          >
            Update Name
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Switch to Component:</strong>
        {Object.values(components).map((comp) => (
          <button
            key={comp.id}
            onClick={() => setActiveComponent(comp.id)}
            style={{ 
              marginRight: '5px', 
              backgroundColor: comp.id === activeComponentId ? '#007bff' : undefined,
              color: comp.id === activeComponentId ? 'white' : undefined
            }}
          >
            {comp.name}
          </button>
        ))}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Legacy Getters Test:</strong>
        <ul>
          <li>componentAst: {componentAst ? 'Present' : 'Null'}</li>
          <li>componentPreviewAst: {componentPreviewAst ? 'Present' : 'Null'}</li>
          <li>propsJson: {propsJson}</li>
          <li>dependencies: {JSON.stringify(dependencies)}</li>
          <li>originalCode: {originalCode ? 'Present' : 'Null'}</li>
          <li>jsxLocation: {jsxLocation ? 'Present' : 'Null'}</li>
          <li>history length: {history.length}</li>
          <li>historyIndex: {historyIndex}</li>
        </ul>
      </div>
    </div>
  );
};
