import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { EditorLayout } from './components/EditorLayout';

function App() {
  return (
    <ThemeProvider>
      <div className="h-screen overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
        <Navbar />
        <div className="flex-1 overflow-hidden">
          <EditorLayout />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
