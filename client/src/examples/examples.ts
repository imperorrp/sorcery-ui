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
 * MISSING COMPONENT DEMO:
 * - Demonstrates the missing component detection system
 * - Shows both imported missing components (FancyButton) and JSX-used missing components (UserAvatar, ProductCard)
 * - All missing components display as red dashed placeholders
 * - Tests the global scope injection and JSX resolution system
 */

export interface Example {
  code: string;
  props?: object;
  dependency?: string | string[];
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
    <div className="p-8 border-2 border-dashed border-gray-300">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Hello, {props.name || 'Component'}!</h1>
      <p className="text-gray-600">Start editing to see your changes.</p>
    </div>
  );
}

export default MyComponent;
`,
  props: { name: 'World' },
  dependency: 'https://cdn.tailwindcss.com',
  description: 'minimal template with Tailwind CSS'
};

// Interactive counter example
export const interactiveCounterExample: Example = {
  code: `
// Paste your React component here
// Make sure it's a single default export

function MyComponent() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="p-8 bg-gray-100 rounded-lg text-center">
      <h1 className="text-2xl text-gray-800 mb-4">
        Hello World!
      </h1>
      <p className="mb-4">
        This is your component. Click 'Render' to see it above.
      </p>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Count: {count}
      </button>
    </div>
  );
}

export default MyComponent;
`,
  props: { title: "Interactive Counter" },
  dependency: 'https://cdn.tailwindcss.com',
  description: 'uses state and Tailwind CSS'
};

// User profile card example
export const userProfileCardExample: Example = {
  code: `
// Paste your React component here
// Make sure it's a single default export

function UserProfile(props) {
  const { name, age, email } = props;

  return (
    <div className="max-w-sm mx-auto p-5 border border-gray-200 rounded-xl bg-white shadow-lg font-sans">
      <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
        {(name || 'U').charAt(0).toUpperCase()}
      </div>
      <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
        {name || 'Anonymous User'}
      </h2>
      {age && (
        <p className="text-sm text-gray-500 text-center mb-1">
          Age: {age}
        </p>
      )}
      {email && (
        <p className="text-sm text-gray-500 text-center mb-4">
          {email}
        </p>
      )}
      <button className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
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
  dependency: 'https://cdn.tailwindcss.com',
  description: 'uses props and Tailwind CSS'
};

// Data visualization example
export const dataVisualizationExample: Example = {
  code: `// @ts-nocheck
// Requires lodash (UMD) - window._ becomes available after script loads
export default function DataChart(props) {
  const data = props.data || [
    { label: 'Jan', value: 65 },
    { label: 'Feb', value: 78 },
    { label: 'Mar', value: 90 },
    { label: 'Apr', value: 81 },
    { label: 'May', value: 95 }
  ];

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="p-5 font-sans">
      <h2 className="mb-5 text-gray-800">{props.title || 'Monthly Performance'}</h2>
      <div className="flex items-end gap-2 h-48 border-b border-gray-200">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-full max-w-10 bg-blue-500 rounded-t transition-all duration-300"
              style={{ height: \`\${(item.value / maxValue) * 180}px\` }}
            />
            <span className="mt-2 text-xs text-gray-500">{item.label}</span>
            <span className="text-sm font-semibold text-gray-800">{item.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-gray-500 text-center">
        Data visualization with {typeof window !== 'undefined' && window._ ? 'lodash' : 'native JS'}
      </p>
    </div>
  );
}
`,
  props: {
    title: "Monthly Performance",
    data: [
      { label: 'Jan', value: 65 },
      { label: 'Feb', value: 78 },
      { label: 'Mar', value: 90 },
      { label: 'Apr', value: 81 },
      { label: 'May', value: 95 }
    ]
  },
  dependency: ['https://cdn.tailwindcss.com', 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'],
  description: 'uses dependencies and Tailwind CSS'
};

// Multi-component example (CardList + Card)
export const cardDashboardExample = {
  activeId: 'card-list-id',
  description: 'demonstrates parent-child component relationships',
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
    <div className="flex flex-col gap-4 p-4 font-sans bg-gray-50">
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
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: '{}',
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
    <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h3 className="mt-0 mb-2 text-gray-800">
        {title || 'No Title'}
      </h3>
      <p className="m-0 text-gray-600">
        {description || 'No description provided.'}
      </p>
    </div>
  );
}`,
      componentAst: null,
      componentPreviewAst: null,
      jsxLocation: null,
      propsJson: JSON.stringify({ title: "Example Title", description: "This is a sample description for the card when viewed alone." }, null, 2),
      dependencies: ['https://cdn.tailwindcss.com'],
      originalPropsJson: JSON.stringify({ title: "Example Title", description: "This is a sample description for the card when viewed alone." }, null, 2),
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

// Multi-component examples collection (separate from regular examples for backward compatibility)
export const multiComponentExamples: Record<string, typeof cardDashboardExample> = {
  'Card Dashboard': cardDashboardExample,
  'Missing Component Demo': {
    activeId: 'missing-demo-id',
    description: 'showcases automatic mock generation for missing components',
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
    <div className="p-8 bg-gray-50 rounded-lg font-sans">
      <h2 className="mt-0 text-gray-800">
        Missing Component Detection Demo
      </h2>
      <p className="text-gray-600 mb-6">
        This demo showcases automatic mock generation for missing components:
      </p>
      <ul className="text-gray-600 mb-6">
        <li><strong>Imported but missing:</strong> FancyButton is imported but doesn't exist</li>
        <li><strong>JSX-used but not imported:</strong> UserAvatar and ProductCard are used in JSX but never imported</li>
      </ul>

      <div className="flex gap-4 items-center flex-wrap">
        <FancyButton label="Imported Missing" />
        <UserAvatar name="John Doe" />
        <ProductCard title="Used But Not Imported" />
      </div>

      <p className="mt-6 text-sm text-gray-600 italic">
        All three components will show red dashed placeholders because they're not in the library.
      </p>
    </div>
  );
}`,
        componentAst: null,
        componentPreviewAst: null,
        jsxLocation: null,
        propsJson: '{}',
        dependencies: ['https://cdn.tailwindcss.com'],
        originalPropsJson: '{}',
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
