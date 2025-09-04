export interface Example {
  code: string;
  props?: object;
  dependency?: string;
  description: string;
}

// Import ComponentData for the multi-component example
import type { ComponentData } from '@/store/componentStore';

// Default minimal template
export const defaultExample: Example = {
  code: `
// Paste your React component here
// Make sure it's a single default export

function MyComponent(props) {
  return (
    <div style={{ padding: '2rem', border: '2px dashed #ccc' }}>
      <h1>Hello, {props.name || 'Component'}!</h1>
      <p>Start editing to see your changes.</p>
    </div>
  );
}

export default MyComponent;
`,
  props: { name: 'World' },
  description: 'minimal template'
};

// Interactive counter example
export const interactiveCounterExample: Example = {
  code: `
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
`,
  description: 'uses state'
};

// User profile card example
export const userProfileCardExample: Example = {
  code: `
// Paste your React component here
// Make sure it's a single default export

function UserProfile(props) {
  const { name, age, email } = props;

  return (
    <div style={{
      maxWidth: '300px',
      margin: '20px auto',
      padding: '20px',
      border: '1px solid #e1e5e9',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        margin: '0 auto 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '32px',
        fontWeight: 'bold'
      }}>
        {(name || 'U').charAt(0).toUpperCase()}
      </div>
      <h2 style={{
        margin: '0 0 8px 0',
        color: '#1f2937',
        fontSize: '20px',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        {name || 'Anonymous User'}
      </h2>
      {age && (
        <p style={{
          margin: '0 0 4px 0',
          color: '#6b7280',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          Age: {age}
        </p>
      )}
      {email && (
        <p style={{
          margin: '0 0 16px 0',
          color: '#6b7280',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {email}
        </p>
      )}
      <button style={{
        width: '100%',
        padding: '8px 16px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}>
        View Profile
      </button>
    </div>
  );
}

export default UserProfile;
`,
  props: {
    name: 'Sarah Johnson',
    age: 28,
    email: 'sarah.johnson@example.com'
  },
  description: 'uses props'
};

// Data visualization example
export const dataVisualizationExample: Example = {
  code: `// @ts-nocheck
// Requires lodash (UMD) - window._ becomes available after script loads
export default function DataChart() {
  const data = [
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 78 },
    { label: 'Mar', value: 90 },
    { label: 'Apr', value: 81 },
    { label: 'May', value: 95 }
  ];

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Monthly Performance</h2>
      <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '200px', borderBottom: '1px solid #e5e7eb' }}>
        {data.map((item, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div
              style={{
                width: '100%',
                maxWidth: '40px',
                height: \`\${(item.value / maxValue) * 180}px\`,
                backgroundColor: '#3b82f6',
                borderRadius: '4px 4px 0 0',
                transition: 'all 0.3s ease'
              }}
            />
            <span style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>{item.label}</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{item.value}</span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
        Data visualization with {typeof window !== 'undefined' && window._ ? 'lodash' : 'native JS'}
      </p>
    </div>
  );
}
`,
  dependency: 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
  description: 'uses dependencies'
};

// Multi-component example (CardList + Card)
export const multiComponentExample = {
  activeId: 'card-list-id',
  components: [
    {
      id: 'card-list-id',
      name: 'CardList',
      code: `// CardList Component - Uses the Card component
export default function CardList() {
  const items = [
    { title: 'First Card', description: 'This is the first card' },
    { title: 'Second Card', description: 'This is the second card' },
    { title: 'Third Card', description: 'This is the third card' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '1rem',
      padding: '1rem',
      flexWrap: 'wrap'
    }}>
      {items.map((item, index) => (
        <Card
          key={index}
          title={item.title}
          description={item.description}
        />
      ))}
    </div>
  );
}

// Note: In a real app, you would import Card from another file
// For this demo, we'll define it here
function Card({ title, description }) {
  return (
    <div style={{
      padding: '1rem',
      border: '1px solid #ccc',
      borderRadius: '8px',
      maxWidth: '200px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{title}</h3>
      <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{description}</p>
    </div>
  );
}`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{}',
      dependencies: [],
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
    {
      id: 'card-id',
      name: 'Card',
      code: `// Reusable Card Component
export default function Card({ title, description = "No description provided" }) {
  return (
    <div style={{
      padding: '1.5rem',
      border: '2px solid #e2e8f0',
      borderRadius: '12px',
      maxWidth: '250px',
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }}
    >
      <h3 style={{
        margin: '0 0 0.75rem 0',
        color: '#1a202c',
        fontSize: '1.25rem',
        fontWeight: 'bold'
      }}>
        {title}
      </h3>
      <p style={{
        margin: 0,
        color: '#4a5568',
        fontSize: '1rem',
        lineHeight: '1.5'
      }}>
        {description}
      </p>
    </div>
  );
}`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: '{"title": "Sample Card", "description": "This is a sample card description"}',
      dependencies: [],
      wrapperCode: `function Wrapper({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default Wrapper;`,
      history: [{ ast: null, preview: null }],
      historyIndex: 0,
    },
  ] as ComponentData[]
};

// All examples collection
export const examples: Record<string, Example> = {
  'Default': defaultExample,
  'Interactive Counter': interactiveCounterExample,
  'User Profile Card': userProfileCardExample,
  'Data Visualization': dataVisualizationExample,
};

// Multi-component examples collection (separate from regular examples)
export const multiComponentExamples: Record<string, typeof multiComponentExample> = {
  'Multi-Component Demo': multiComponentExample,
};
