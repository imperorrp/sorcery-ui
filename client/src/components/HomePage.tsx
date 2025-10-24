/**
 * Sorcery UI - Home Page Component
 *
 * The landing page for Sorcery UI, a developer tool for fine-tuning UI components.
 * Provides an overview of the tool's capabilities and navigation to the editors.
 *
 * @author Sorcery UI Team
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Wand2,
  ArrowRight,
  Github,
  Terminal,
  Sparkles,
  Code2
} from 'lucide-react';

/**
 * HomePage component - Landing page for Sorcery UI
 *
 * Features:
 * - Minimalistic hero section with gradient headline
 * - Direct value proposition explaining the problem and solution
 * - Feature cards highlighting key capabilities
 * - Call-to-action buttons linking to editor routes
 * - Clean, modern design with dark theme
 *
 * @returns {JSX.Element} The home page JSX element
 */
export function HomePage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      {/* Background layer to ensure dark background renders even if global CSS differs */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 to-zinc-900 -z-10" aria-hidden />
      {/* Header */}
      <header className="border-b border-zinc-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Wand2 className="h-5 w-5 text-teal-400" />
              <span className="font-semibold text-zinc-100">Sorcery UI</span>
              <span className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">
                Beta
              </span>
            </Link>
            <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-zinc-100">
              <a href="https://github.com/imperorrp/runable-task" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto pt-12 md:pt-20 pb-12 md:pb-16 min-h-[55vh] md:min-h-[50vh]">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-400">
              <Terminal className="h-3.5 w-3.5" />
              A tool for frontend developers
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              <span className="block text-zinc-100">Visual editor for</span>
              <span
                className="block mt-1"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #06b6d4, #fb923c)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                UI components
              </span>
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              GUI tool to fine-tune React components. Stop prompting AI for minor tweaks. Adjust styles yourself. 
              Saves AI calls/tokens, saves time.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-violet-600 hover:bg-violet-700 text-white border-0"
              >
                <Link to="/editor">
                  Open Editor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-100"
              >
                <Link to="/editor-experimental">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Experimental
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Code2 className="h-5 w-5 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">Low/No-code visual controls</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Use Tailwind utility pickers, box model editors, color swatches. Or write CSS directly.
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">Real component preview</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                WYSIWYG. Load props, context providers, dependencies. See state and interactivity work. 
              </p>
            </div>

            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-sky-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">Two workflows</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Paste code in browser, or connect via MCP so your AI copilot opens it for you.
              </p>
            </div>
          </div>
        </div>

        {/* Why Section */}
        <div className="max-w-3xl mx-auto py-20">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-12 space-y-6">
            <h2 className="text-2xl font-semibold text-zinc-100">The problem</h2>
            <div className="space-y-4 text-zinc-400">
              <p>
                You're building UI with AI assistants. They generate 90% of what you need, but the final polish—
                padding tweaks, color adjustments, responsive spacing—takes forever through prompts. You describe changes, wait for regeneration, 
                and repeat until it's right.
              </p>
              <p>
                Each iteration costs tokens and time. You end up describing visual details in text, 
                waiting for regeneration, and repeating.
              </p>
            </div>
            <div className="pt-2">
              <h3 className="text-lg font-semibold text-zinc-100 mb-3">This tool solves that</h3>
              <p className="text-zinc-400">
                Paste your AI-generated component (or any React component). Use visual controls to fine-tune styles 
                and Tailwind classes. See changes live with real props and dependencies loaded. Copy the updated code back.
              </p>
              <p className="text-zinc-400 mt-4">
                Perfect for the last 10-20% of design work that's frustrating to articulate in prompts.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <div className="grid sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-zinc-500 mb-2">How to use</div>
                  <ul className="space-y-1.5 text-zinc-400">
                    <li>• Direct: Paste code in browser</li>
                    <li>• MCP: Let your AI copilot open it</li>
                    <li>• Configure props & context</li>
                    <li>• Export clean JSX/TSX</li>
                  </ul>
                </div>
                <div>
                  <div className="text-zinc-500 mb-2">Current support</div>
                  <ul className="space-y-1.5 text-zinc-400">
                    <li>• React components</li>
                    <li>• Tailwind CSS utilities</li>
                    <li>• Standard CSS</li>
                    <li>• Multi-component editing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Wand2 className="h-4 w-4" />
              <span>Sorcery UI</span>
              <span>·</span>
              <span>Beta</span>
            </div>
            <div className="text-sm text-zinc-500">
              Built for developers who value their time
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}