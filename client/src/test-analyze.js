import { analyzeCode } from '../lib/renderer';

// Test the analyzeCode function with the default component code
const testCode = `
// Paste your React component here
// Make sure it's a single default export

function MyComponent() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '24px', color: '#333', marginBottom: '1rem' }}>
        Hello World!
      </h1>
      <p style={{ marginBottom: '1rem' }}>
        This is your component. Click 'Render' to see it above.
      </p>
      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Count: {count}
      </button>
    </div>
  );
}

export default MyComponent;
`;

async function testAnalyzeCode() {
  console.log('Testing analyzeCode function...');

  try {
    const result = await analyzeCode(testCode);
    console.log('analyzeCode result:', result);

    if (result.jsxLocation) {
      console.log('✅ jsxLocation is set:', result.jsxLocation);
      console.log('✅ Element location map has', result.elementLocationMap.size, 'entries');
      console.log('Element locations:', Array.from(result.elementLocationMap.entries()));
    } else {
      console.log('❌ jsxLocation is null');
    }
  } catch (error) {
    console.error('❌ Error in analyzeCode:', error);
  }
}

testAnalyzeCode();
