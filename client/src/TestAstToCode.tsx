import React from 'react';
import { generateAndFormatJsx } from '@/lib/astToCode';

// Test component for the new AST-to-Code generation system
const TestComponent: React.FC = () => {
  const [testResult, setTestResult] = React.useState<string>('');

  const runTest = async () => {
    // Create a test AST structure
    const testAst = {
      id: 'test-root',
      type: 'div',
      props: {
        className: 'test-container',
        style: {
          backgroundColor: 'lightblue',
          padding: '20px',
          borderRadius: '8px'
        },
        children: [
          {
            id: 'test-heading',
            type: 'h1',
            props: {
              children: ['Hello, AST-to-Code!'],
              style: { color: 'darkblue' }
            }
          },
          {
            id: 'test-button',
            type: 'button',
            props: {
              onClick: () => console.log('clicked'),
              disabled: false,
              children: ['Click me'],
              style: {
                backgroundColor: 'blue',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px'
              }
            }
          }
        ]
      }
    };

    try {
      const generatedCode = await generateAndFormatJsx(testAst);
      setTestResult(generatedCode);
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>AST-to-Code Generation Test</h2>
      <button
        onClick={runTest}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Run AST-to-Code Test
      </button>

      {testResult && (
        <div>
          <h3>Generated JSX:</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            border: '1px solid #ddd'
          }}>
            {testResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestComponent;
