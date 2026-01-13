/**
 * Sorcery UI - Alternative Home Page Component
 *
 * Landing page for Sorcery UI - The Living Design System Studio.
 * Positions the product as an AI-native design system platform, not just a component tweaker.
 *
 * Key messaging pillars:
 * 1. Screenshot → Component AI workflow
 * 2. Design System as a Living Project
 * 3. Visual refinement without prompting
 * 4. AI-native workflow integration
 * 5. Production-ready export
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
  Camera,
  FolderTree,
  Layers3,
  Zap,
  Brain,
  FileCode2,
  Palette,
  Box,
  Network,
  Lightbulb,
  Code2,
  MousePointer2,
  Download,
  Upload
} from 'lucide-react';

/**
 * HomePageAlt component - Alternative landing page for Sorcery UI
 *
 * Features:
 * - Hero section with "Living Design System Studio" positioning
 * - Screenshot-to-component workflow showcase
 * - Five key value pillars with rich feature cards
 * - Interactive visual demos
 * - Futuristic, compelling design
 *
 * @returns {JSX.Element} The alternative home page JSX element
 */
export function HomePageAlt() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-zinc-50 to-white text-zinc-900 overflow-hidden font-sans selection:bg-violet-500 selection:text-white">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-violet-200/30 via-transparent to-transparent blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-200/20 via-transparent to-transparent blur-3xl rounded-full" />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-zinc-200/50 bg-white/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
              <Wand2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900 tracking-tight leading-none">Sorcery UI</span>
              <span className="text-[10px] text-zinc-500 font-medium">Design System Studio</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/imperorrp/runable-task"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors hidden sm:block"
            >
              Docs
            </a>
            <Button variant="ghost" size="sm" asChild className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">
              <a href="https://github.com/imperorrp/runable-task" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 relative">
        <div className="container mx-auto max-w-6xl text-center">
          {/* Beta Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-200 text-xs font-medium text-violet-700 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600"></span>
            </span>
            AI-Powered Design System Platform • Beta v0.1
          </div>

          {/* Main Title */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <span className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-600 bg-clip-text text-transparent">
              Your Living
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Design System Studio
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-zinc-600 max-w-3xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-light">
            Turn screenshots into components. Manage projects visually.
            Export production-ready code. <br />
            <span className="text-violet-600 font-medium">The AI-native workflow for modern UI teams.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 mb-20">
            <Button asChild size="lg" className="h-14 px-10 text-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 hover:scale-105 transition-all duration-300 shadow-xl shadow-violet-500/30 rounded-xl">
              <Link to="/editor">
                <Sparkles className="mr-2 h-5 w-5" />
                Launch Studio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg border-2 border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 transition-all duration-300 rounded-xl">
              <Link to="/editor-experimental">
                <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                Try Experimental
              </Link>
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            {[
              { icon: Camera, text: 'Screenshot → Component' },
              { icon: FolderTree, text: 'Project Management' },
              { icon: Brain, text: 'AI-Powered' },
              { icon: FileCode2, text: 'Production Ready' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full text-sm text-zinc-600 shadow-sm">
                <item.icon className="h-4 w-4 text-violet-600" />
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshot Workflow Showcase */}
      <section className="px-6 pb-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold mb-4">
              <Camera className="h-3 w-3" />
              NEW: AI Design Extraction
            </div>
            <h2 className="text-4xl font-bold mb-4 text-zinc-900">From Screenshot to Code in Seconds</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Upload any UI screenshot. Get shadcn-style components, design tokens, and Tailwind config instantly.
            </p>
          </div>

          <div className="relative rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-2xl overflow-hidden">
            {/* Workflow Steps */}
            <div className="grid md:grid-cols-3 divide-x divide-violet-200">
              {[
                {
                  step: '1',
                  icon: Upload,
                  title: 'Upload Screenshot',
                  desc: 'Drag & drop any UI design',
                  color: 'violet'
                },
                {
                  step: '2',
                  icon: Brain,
                  title: 'AI Extraction',
                  desc: 'Extract components & tokens',
                  color: 'indigo'
                },
                {
                  step: '3',
                  icon: Download,
                  title: 'Export Code',
                  desc: 'Production-ready React',
                  color: 'blue'
                }
              ].map((item) => (
                <div key={item.step} className="p-8 text-center group hover:bg-white/50 transition-colors">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className={`text-xs font-bold text-${item.color}-600 mb-2`}>STEP {item.step}</div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-600">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Demo Visual */}
            <div className="p-12 bg-white/60 backdrop-blur-sm border-t-2 border-violet-200">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Before */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-zinc-500 flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Input Screenshot
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-xl border-2 border-dashed border-zinc-300 flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                      <div className="text-xs text-zinc-500">Your UI Design</div>
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-violet-600 flex items-center gap-2">
                    <Code2 className="h-4 w-4" /> Generated Components
                  </div>
                  <div className="aspect-video bg-zinc-900 text-white rounded-xl border-2 border-violet-400 p-4 font-mono text-xs overflow-hidden shadow-xl">
                    <div className="space-y-2">
                      <div className="text-violet-400">// Button.tsx</div>
                      <div><span className="text-blue-400">export function</span> <span className="text-yellow-400">Button</span>() {'{'}</div>
                      <div className="pl-3 text-zinc-400">return (</div>
                      <div className="pl-6 text-emerald-400">&lt;button className="...</div>
                      <div className="pl-3 text-zinc-500">...</div>
                      <div>{'}'}</div>
                      <div className="mt-4 text-violet-400">// Design Tokens</div>
                      <div className="text-orange-400">colors: {'{'} primary: ... {'}'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Pillars Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-zinc-900">More Than a Component Editor</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              A complete platform for AI-native design system workflows
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FolderTree,
                title: 'Design System Projects',
                desc: 'Organize components into projects. Edit parent and child components together. Version history included.',
                gradient: 'from-violet-500 to-purple-600',
                features: ['Multi-component editing', 'Visual library', 'Version control']
              },
              {
                icon: Palette,
                title: 'Visual Refinement',
                desc: 'No more prompting for tiny tweaks. Click, adjust, see results instantly. Logic stays intact.',
                gradient: 'from-indigo-500 to-blue-600',
                features: ['Tailwind controls', 'Real-time preview', 'Undo/redo']
              },
              {
                icon: Network,
                title: 'Real Environment',
                desc: 'Not screenshots—actual React runtime. Props work. Context works. Dependencies work.',
                gradient: 'from-blue-500 to-cyan-600',
                features: ['Props injection', 'Context providers', 'CDN dependencies']
              },
              {
                icon: Brain,
                title: 'AI Integration',
                desc: 'Import AI-generated code and refine it. Future: MCP for IDE workflows and natural language controls.',
                gradient: 'from-purple-500 to-pink-600',
                features: ['Screenshot → Code', 'Future: MCP', 'Future: NL search']
              },
              {
                icon: FileCode2,
                title: 'Production Export',
                desc: 'Export entire design systems with clean, formatted code. Theme configs and component registry included.',
                gradient: 'from-emerald-500 to-teal-600',
                features: ['Clean JSX/TSX', 'Design tokens', 'Tailwind config']
              },
              {
                icon: Box,
                title: 'Non-Destructive',
                desc: 'Our hybrid AST architecture preserves your event handlers, hooks, and logic. Always.',
                gradient: 'from-amber-500 to-orange-600',
                features: ['Logic preservation', 'Smart boundaries', 'Type safety']
              }
            ].map((pillar, i) => (
              <div key={i} className="group relative bg-white border-2 border-zinc-200 rounded-2xl p-8 hover:border-violet-300 hover:shadow-2xl transition-all duration-300">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${pillar.gradient} text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <pillar.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">{pillar.title}</h3>
                <p className="text-zinc-600 mb-4 leading-relaxed">{pillar.desc}</p>
                <ul className="space-y-2">
                  {pillar.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-zinc-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-zinc-50 to-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-zinc-900">See It in Action</h2>
            <p className="text-lg text-zinc-600">Visual editing without breaking your code</p>
          </div>

          <div className="relative rounded-2xl border-2 border-zinc-200 bg-white shadow-xl overflow-hidden">
            {/* Window Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono text-zinc-500">
                  <Code2 className="w-4 h-4" />
                  <span>PricingCard.tsx</span>
                </div>
              </div>
              <div className="text-xs font-semibold text-violet-600 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                LIVE EDITOR
              </div>
            </div>

            {/* Split View */}
            <div className="grid md:grid-cols-2 divide-x divide-zinc-200">
              {/* Code */}
              <div className="p-8 bg-zinc-900 font-mono text-sm">
                <div className="space-y-2 text-white">
                  <div className="text-zinc-500 text-xs">// Your code stays intact</div>
                  <div className="text-purple-400">export function <span className="text-yellow-400">Card</span>() {'{'}</div>
                  <div className="pl-4 text-blue-400">const [count, setCount] = useState(0)</div>
                  <div className="pl-4 text-zinc-400">return (</div>
                  <div className="pl-8">
                    &lt;div className="
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-1 rounded">p-8 rounded-xl bg-white</span>
                    "&gt;
                  </div>
                  <div className="pl-12 text-zinc-500">{'// Logic preserved ✓'}</div>
                  <div className="pl-8 text-zinc-400">&lt;/div&gt;</div>
                  <div className="pl-4 text-zinc-400">)</div>
                  <div className="text-purple-400">{'}'}</div>
                </div>
              </div>

              {/* Visual */}
              <div className="p-8 bg-gradient-to-br from-zinc-50 to-white flex items-center justify-center relative group">
                <div className="w-full max-w-sm bg-white border-2 border-zinc-200 rounded-xl p-8 shadow-lg transform transition-all group-hover:scale-105 group-hover:shadow-2xl">
                  <div className="absolute -top-3 -right-3 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <MousePointer2 className="w-3 h-3" />
                    Click to edit
                  </div>
                  <div className="h-4 w-32 bg-zinc-200 rounded mb-4"></div>
                  <div className="space-y-2 mb-6">
                    <div className="h-3 w-full bg-zinc-100 rounded"></div>
                    <div className="h-3 w-3/4 bg-zinc-100 rounded"></div>
                  </div>
                  <div className="h-10 w-full bg-violet-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                    Get Started
                  </div>
                </div>

                {/* Floating Inspector */}
                <div className="absolute bottom-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2 items-center">
                    <div className="text-xs text-zinc-400">Padding:</div>
                    <div className="flex gap-1">
                      <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 hover:border-violet-500 cursor-pointer flex items-center justify-center text-xs text-zinc-400">4</div>
                      <div className="w-8 h-8 rounded bg-violet-600 border border-violet-500 cursor-pointer flex items-center justify-center text-xs text-white">8</div>
                      <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 hover:border-violet-500 cursor-pointer flex items-center justify-center text-xs text-zinc-400">12</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10x', label: 'Faster Refinement' },
              { value: '100%', label: 'Logic Preserved' },
              { value: '0', label: 'Token Cost' },
              { value: 'AI', label: 'Native Workflow' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-3xl p-12 md:p-16 shadow-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to build faster?
              </h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
                Join the future of design system development. Start with screenshots, refine visually, export production code.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="h-14 px-10 text-lg bg-white text-violet-600 hover:bg-zinc-50 hover:scale-105 transition-all duration-300 shadow-xl rounded-xl">
                  <Link to="/editor">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Launch Studio Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 rounded-xl">
                  <a href="https://github.com/imperorrp/runable-task" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-5 w-5" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
                <Wand2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900">Sorcery UI</span>
                <span className="text-xs text-zinc-500">Design System Studio</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="https://github.com/imperorrp/runable-task" target="_blank" rel="noopener noreferrer" className="hover:text-violet-600 transition-colors">
                Docs
              </a>
              <a href="https://github.com/imperorrp/runable-task" target="_blank" rel="noopener noreferrer" className="hover:text-violet-600 transition-colors">
                GitHub
              </a>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}