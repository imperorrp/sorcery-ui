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
  Sparkles,
  Code2,
  Layers,
  Zap,
  Cpu,
  MousePointer2
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
    <div className="relative min-h-screen bg-white text-zinc-900 overflow-hidden font-sans selection:bg-zinc-900 selection:text-white">
      {/* Grid Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-size-[24px_24px]"></div>

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity group">
            <div className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200 group-hover:bg-zinc-200 transition-colors">
              <Wand2 className="h-4 w-4 text-zinc-900" />
            </div>
            <span className="font-bold text-zinc-900 tracking-tight">Sorcery UI</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/imperorrp/runable-task" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block"
            >
              Documentation
            </a>
            <Button variant="ghost" size="sm" asChild className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">
              <a href="https://github.com/imperorrp/runable-task" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="container mx-auto max-w-5xl text-center">
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
                </span>
                Public Beta v0.1
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 text-zinc-900">
                Stop prompting. <br />
                <span className="text-zinc-500">
                    Start refining.
                </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-light">
                The missing GUI for your AI-generated React components. 
                Paste code, tweak styles visually with Tailwind controls, and export clean JSX.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <Button asChild size="lg" className="h-12 px-8 text-base bg-zinc-900 text-white hover:bg-zinc-800 hover:scale-105 transition-all duration-300 shadow-lg shadow-zinc-900/20">
                    <Link to="/editor">
                        Open Editor <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-all duration-300">
                    <Link to="/editor-experimental">
                        <Sparkles className="mr-2 h-4 w-4 text-zinc-400" /> Try Experimental
                    </Link>
                </Button>
            </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section className="px-6 pb-32">
         <div className="container mx-auto max-w-5xl">
            <div className="relative rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                {/* Fake Window Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                        </div>
                        <div className="h-4 w-px bg-white/10 mx-2"></div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                            <Code2 className="w-3 h-3" />
                            <span>Card.tsx</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Read-Write Mode</div>
                </div>

                {/* Split View Content */}
                <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12 items-center relative">
                    {/* Code Side */}
                    <div className="space-y-3 font-mono text-sm relative z-10">
                        <div className="text-zinc-500 italic">// 1. Paste AI Code</div>
                        <div className="text-purple-400">export function <span className="text-blue-400">PricingCard</span>() {'{'}</div>
                        <div className="pl-4 text-zinc-300">return (</div>
                        <div className="pl-8 text-zinc-400">
                            &lt;<span className="text-pink-400">div</span> className="
                            <span className="text-emerald-400 bg-emerald-400/10 px-1 rounded border border-emerald-400/20 animate-pulse">p-8 rounded-2xl bg-zinc-900</span>
                            "&gt;
                        </div>
                        <div className="pl-12 text-zinc-500">...content</div>
                        <div className="pl-8 text-zinc-400">&lt;/<span className="text-pink-400">div</span>&gt;</div>
                        <div className="pl-4 text-zinc-300">)</div>
                        <div className="text-purple-400">{'}'}</div>
                    </div>

                    {/* Visual Side */}
                    <div className="relative group cursor-default perspective-1000">
                        <div className="absolute -inset-4 bg-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition duration-700"></div>

                        <div className="relative bg-zinc-900 text-white border border-zinc-200 rounded-2xl p-6 shadow-md transform transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-lg">
                          <div className="absolute -top-3 -right-3 bg-zinc-800 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow flex items-center gap-1 z-20">
                            <MousePointer2 className="w-3 h-3" /> You are here
                          </div>

                          <div className="h-3 w-24 bg-zinc-800 rounded mb-6"></div>
                          <div className="space-y-3 mb-8">
                            <div className="h-2 w-full bg-zinc-800/60 rounded"></div>
                            <div className="h-2 w-2/3 bg-zinc-800/60 rounded"></div>
                          </div>
                          <div className="flex gap-3">
                            <div className="h-9 w-full bg-white rounded flex items-center justify-center text-xs font-medium text-zinc-900">Get Started</div>
                          </div>

                          {/* Overlay UI Controls */}
                          <div className="absolute inset-0 bg-black/5 border-2 border-zinc-200 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="bg-zinc-900 border border-zinc-700 p-2 rounded-lg shadow-xl flex gap-2">
                              <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 hover:border-zinc-400 cursor-pointer"></div>
                              <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 hover:border-zinc-400 cursor-pointer"></div>
                              <div className="w-px h-6 bg-zinc-800"></div>
                              <div className="text-xs text-zinc-400 flex items-center px-1">p-8</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-4 text-xs text-zinc-500 font-mono">2. Tweak Visually</div>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* The Problem & Solution */}
      <section className="py-24 px-6 relative bg-zinc-50 border-y border-zinc-200">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">The "Last Mile" Problem</h2>
              <div className="space-y-4 text-zinc-600 text-lg leading-relaxed font-light">
                <p>
                  AI assistants are incredible. They generate 90% of what you need instantly. 
                  But that final 10%—the padding tweaks, color adjustments, responsive spacing—takes forever through prompts.
                </p>
                <p>
                  You describe changes, wait for regeneration, and repeat. 
                  Each iteration costs tokens, time, and mental energy.
                </p>
              </div>
            </div>
            
            <div className="relative bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
               <div className="absolute -top-4 -left-4 bg-zinc-900 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  The Solution
               </div>
               <h3 className="text-xl font-semibold text-zinc-900 mb-4 mt-2">Stop describing. Start clicking.</h3>
               <p className="text-zinc-600 mb-6 font-light">
                 Sorcery UI is designed for that specific frustration. Don't prompt for pixel-perfect design. 
                 Just fix it yourself in seconds.
               </p>
               
               <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-100">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 mb-3">How to use</h4>
                    <ul className="space-y-2 text-sm text-zinc-500">
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-zinc-400"></div>Direct: Paste code</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-zinc-400"></div>MCP: AI copilot opens it</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-zinc-400"></div>Configure props & context</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-zinc-400"></div>Export clean JSX/TSX</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 mb-3">Current support</h4>
                    <ul className="space-y-2 text-sm text-zinc-500">
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-zinc-900"></div>React Components</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-zinc-900"></div>Tailwind CSS utilities</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-zinc-900"></div>Standard CSS</li>
                      <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-zinc-900"></div>Multi-component editing</li>
                    </ul>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4 text-zinc-900">Why Sorcery UI?</h2>
                <p className="text-zinc-500 font-light">Built for the "last mile" of UI development.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    {
                        icon: <Layers className="w-6 h-6 text-zinc-900" />,
                        title: "Logic-Preserving Edits",
                        desc: "We parse your code into a visual tree. Edit structure and styles without breaking logic."
                    },
                    {
                        icon: <Zap className="w-6 h-6 text-zinc-900" />,
                        title: "Tailwind Native",
                        desc: "First-class support for Tailwind CSS. Visual pickers for spacing, colors, and typography."
                    },
                    {
                        icon: <Cpu className="w-6 h-6 text-zinc-900" />,
                        title: "Real Environment",
                        desc: "Not just a picture. A real React runtime with props, context, and interactivity."
                    }
                ].map((feature, i) => (
                    <div key={i} className="group p-8 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-300">
                        <div className="mb-6 p-3 rounded-xl bg-zinc-50 border border-zinc-100 w-fit group-hover:scale-110 transition-transform duration-300">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-semibold mb-3 text-zinc-900">{feature.title}</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed font-light">
                            {feature.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-zinc-100 border border-zinc-200">
                    <Wand2 className="h-4 w-4 text-zinc-900" />
                </div>
                <span className="text-sm font-medium text-zinc-900">Sorcery UI</span>
            </div>
            <div className="text-sm text-zinc-400 font-light">
                &copy; {new Date().getFullYear()} Sorcery UI Team
            </div>
        </div>
      </footer>
    </div>
  );
}