/**
 * Component Examples - Pre-built Component Templates
 *
 * Collection of example React components for demonstration and testing.
 * Includes single components, interactive examples, and multi-component setups.
 * Used by the editor for quick component loading and user education.
 *
 * EXAMPLE CATEGORIES:
 * - Single Component Examples: Basic templates for individual component development
 * - Multi-Component Examples: Complex setups demonstrating parent-child relationships
 * - Missing Component Demo: Showcases automatic mock generation for missing components
 *
 * MISSING COMPONENT DEMO (v1.2):
 * - Demonstrates the missing component detection system
 * - Shows both imported missing components (FancyButton) and JSX-used missing components (UserAvatar, ProductCard)
 * - All missing components display as red dashed placeholders
 * - Tests the global scope injection and JSX resolution system
 */

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
export const cardDashboardExample = {
  activeId: 'card-list-id',
  components: [
    {
      id: 'card-list-id',
      name: 'CardList',
      code: `
// This component imports and uses the 'Card' component
// from the component library.
import Card from './Card';

export default function CardList() {
  const items = [
    { title: 'Responsive Design', description: 'Ensure the layout works on all screen sizes.' },
    { title: 'State Simulation', description: 'Test loading, error, and empty states.' },
    { title: 'Component Polish', description: 'Refine animations and interactions for a production-ready feel.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', fontFamily: 'sans-serif', backgroundColor: '#f9f9f9' }}>
      {items.map(item => (
        <Card
          key={item.title}
          title={item.title}
          description={item.description}
        />
      ))}
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
      code: `
// This is a reusable child component.
// Its props are passed down from CardList.
export default function Card({ title, description }) {
  return (
    <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#333' }}>
        {title || 'No Title'}
      </h3>
      <p style={{ margin: 0, color: '#666' }}>
        {description || 'No description provided.'}
      </p>
    </div>
  );
}`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: JSON.stringify({ title: "Example Title", description: "This is a sample description for the card when viewed alone." }, null, 2),
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
export const multiComponentExamples: Record<string, typeof cardDashboardExample> = {
  'Card Dashboard': cardDashboardExample,
  'Missing Component Demo': {
    activeId: 'missing-demo-id',
    components: [
      {
        id: 'missing-demo-id',
        name: 'MissingComponentDemo',
        code: `
// MISSING COMPONENT DEMO - Showcases Automatic Mock Generation
//
// This component demonstrates the missing component detection system that:
// 1. Detects components used in JSX but not imported (UserAvatar, ProductCard)
// 2. Detects components imported but not found in library (FancyButton)
// 3. Automatically creates red dashed placeholder mocks for all missing components
// 4. Uses global scope injection for reliable component resolution
//
// Expected Behavior:
// - FancyButton: Shows "Missing Component: <FancyButton />" (imported but missing)
// - UserAvatar: Shows "Missing Component: <UserAvatar />" (JSX-used but not imported)
// - ProductCard: Shows "Missing Component: <ProductCard />" (JSX-used but not imported)
//
// All placeholders have red dashed borders and descriptive text.

import FancyButton from './FancyButton';

export default function MissingComponentDemo() {
  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ marginTop: 0, color: '#1f2937' }}>
        Missing Component Detection Demo
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        This demo showcases automatic mock generation for missing components:
      </p>
      <ul style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        <li><strong>Imported but missing:</strong> FancyButton is imported but doesn't exist</li>
        <li><strong>JSX-used but not imported:</strong> UserAvatar and ProductCard are used in JSX but never imported</li>
      </ul>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <FancyButton label="Imported Missing" />
        <UserAvatar name="John Doe" />
        <ProductCard title="Used But Not Imported" />
      </div>

      <p style={{
        marginTop: '1.5rem',
        fontSize: '14px',
        color: '#6b7280',
        fontStyle: 'italic'
      }}>
        All three components will show red dashed placeholders because they're not in the library.
      </p>
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
    ] as ComponentData[]
  },
};
