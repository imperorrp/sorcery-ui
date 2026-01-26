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
  Sparkles,
  Code2,
  Layers,
  Cpu,
  MousePointer2,
  Camera,
  Upload,
  Brain,
  Download,
  Users,
  Zap,
  Calendar,
  ExternalLink
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
            <Button asChild size="sm" className="h-9 px-3 text-sm bg-zinc-900 text-white hover:bg-zinc-800 transition-all duration-200">
              <Link to="/editor">Open Editor</Link>
            </Button>

            <Button asChild variant="outline" size="sm" className="h-9 px-3 text-sm border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-all duration-200">
              <a href="https://forms.gle/ZE48yyJdBwcKs92T7" target="_blank" rel="noopener noreferrer">Sign up</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="container mx-auto max-w-5xl text-center">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500"></div>
                Open Beta
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                <span className="text-zinc-900">AI generates the first 90%.</span><br />
                <span className="text-zinc-900">
                    You edit the last 10% 
                </span>
                <span className="text-zinc-400"> visually.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                Stop re-prompting for padding, spacing, and color tweaks. <br className="hidden md:block" />
                Paste AI-generated code. Edit visually. Export clean React.
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
                        <Sparkles className="mr-2 h-4 w-4 text-zinc-400" /> Try Experimental editor 
                    </Link>
                </Button>
            </div>

            {/* Coming Soon */}
            <div className="text-center mt-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                <p className="text-sm text-zinc-500 font-light">
                    MCP integration into your IDE coming soon
                </p>
            </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section className="px-6 pb-24">
         <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
               <h2 className="text-4xl font-bold mb-4 text-zinc-900">Direct Visual Manipulation</h2>
               <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                 Don't guess with prompts. Interact directly with your component tree in a real React runtime.
               </p>
            </div>

            <div className="relative rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-500">
                {/* Fake Window Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] hover:scale-110 transition-transform cursor-pointer"></div>
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:scale-110 transition-transform cursor-pointer"></div>
                            <div className="w-3 h-3 rounded-full bg-[#27C93F] hover:scale-110 transition-transform cursor-pointer"></div>
                        </div>
                        <div className="h-4 w-px bg-zinc-300 mx-2"></div>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                            <Code2 className="w-3 h-3" />
                            <span>Card.tsx</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Read-Write Mode
                    </div>
                </div>

                {/* Split View Content */}
                <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12 items-center relative">
                    {/* Code Side */}
                    <div className="space-y-3 font-mono text-sm relative z-10">
                        <div className="text-zinc-500 italic animate-in fade-in duration-500 delay-100">// 1. Paste AI Code</div>
                        <div className="text-purple-400 animate-in fade-in duration-500 delay-200">export function <span className="text-blue-400">PricingCard</span>() {'{'}</div>
                        <div className="pl-4 text-zinc-300 animate-in fade-in duration-500 delay-300">return (</div>
                        <div className="pl-8 text-zinc-400 animate-in fade-in duration-500 delay-400">
                            &lt;<span className="text-pink-400">div</span> className="
                            <span className="text-emerald-400 bg-emerald-400/10 px-1 rounded border border-emerald-400/20 animate-pulse">p-8 rounded-2xl bg-zinc-900</span>
                            "&gt;
                        </div>
                        <div className="pl-12 text-zinc-500 animate-in fade-in duration-500 delay-500">...content</div>
                        <div className="pl-8 text-zinc-400 animate-in fade-in duration-500 delay-600">&lt;/<span className="text-pink-400">div</span>&gt;</div>
                        <div className="pl-4 text-zinc-300 animate-in fade-in duration-500 delay-700">)</div>
                        <div className="text-purple-400 animate-in fade-in duration-500 delay-800">{'}'}</div>
                    </div>

                    {/* Visual Side */}
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-4 bg-zinc-900/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="relative bg-zinc-900 text-white border border-zinc-200 rounded-2xl p-6 shadow-md transform transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:border-zinc-300">
                          <div className="absolute -top-3 -right-3 bg-zinc-800 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 z-20 group-hover:scale-110 transition-transform">
                            <MousePointer2 className="w-3 h-3" /> You are here
                          </div>

                          <div className="h-3 w-24 bg-zinc-800 rounded mb-6 animate-pulse"></div>
                          <div className="space-y-3 mb-8">
                            <div className="h-2 w-full bg-zinc-800/60 rounded"></div>
                            <div className="h-2 w-2/3 bg-zinc-800/60 rounded"></div>
                          </div>
                          <div className="flex gap-3">
                            <div className="h-9 w-full bg-white rounded flex items-center justify-center text-xs font-medium text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer">Get Started</div>
                          </div>

                          {/* Overlay UI Controls */}
                          <div className="absolute inset-0 bg-black/5 border-2 border-emerald-400/0 group-hover:border-emerald-400/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="bg-zinc-900 border border-zinc-700 p-2 rounded-lg shadow-xl flex gap-2 transform scale-90 group-hover:scale-100 transition-transform">
                              <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 hover:border-emerald-400 hover:bg-emerald-400/10 cursor-pointer transition-all"></div>
                              <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 hover:border-emerald-400 hover:bg-emerald-400/10 cursor-pointer transition-all"></div>
                              <div className="w-px h-6 bg-zinc-700"></div>
                              <div className="text-xs text-zinc-400 flex items-center px-1 font-mono">p-8</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-4 text-xs text-zinc-500 font-mono group-hover:text-zinc-900 transition-colors">2. Tweak Visually</div>
                    </div>
                </div>
            </div>

            {/* CTA after visual demo removed per request */}
         </div>
      </section>

      {/* Before/After Comparison: The Pain vs The Solution */}
      <section className="px-6 pb-24">
         <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-bold mb-4 text-zinc-900">The Reality of AI-Assisted UI Work</h2>
               <p className="text-lg text-zinc-600 max-w-3xl mx-auto">
                 One simple request: "Make the card padding larger and the button more prominent."
               </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* LEFT: The Old Way - Prompt Hell */}
              <div className="relative group">
                <div className="absolute -top-4 left-6 bg-red-100 border border-red-200 text-red-900 px-4 py-1 rounded-full text-sm font-semibold z-10 shadow-sm group-hover:shadow-md transition-shadow">
                  The Old Way
                </div>
                
                <div className="border-2 border-red-200 rounded-2xl bg-red-50/30 p-6 h-full hover:shadow-lg transition-all duration-300 hover:border-red-300">
                  <div className="space-y-4">
                    {/* Prompt 1 */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="text-xs font-mono text-zinc-400 mt-1">You:</div>
                        <div className="flex-1 text-sm text-zinc-700">
                          "Make the card padding larger and button more prominent"
                        </div>
                      </div>
                    </div>

                    {/* Response 1 */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 hover:bg-zinc-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="text-xs font-mono text-zinc-400 mt-1">AI:</div>
                        <div className="flex-1">
                          <div className="font-mono text-xs text-zinc-600 mb-2">className="p-12 ..."</div>
                          <div className="text-xs text-zinc-500 italic">Changed p-8 → p-12</div>
                        </div>
                      </div>
                    </div>

                    {/* Prompt 2 */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="text-xs font-mono text-zinc-400 mt-1">You:</div>
                        <div className="flex-1 text-sm text-zinc-700">
                          "Actually make it p-10, and the button needs better contrast"
                        </div>
                      </div>
                    </div>

                    {/* Response 2 */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 hover:bg-zinc-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="text-xs font-mono text-zinc-400 mt-1">AI:</div>
                        <div className="flex-1">
                          <div className="font-mono text-xs text-zinc-600 mb-2">className="p-10 ..."</div>
                          <div className="text-xs text-zinc-500 italic">Regenerated entire component</div>
                        </div>
                      </div>
                    </div>

                    {/* Prompt 3 */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="text-xs font-mono text-zinc-400 mt-1">You:</div>
                        <div className="flex-1 text-sm text-zinc-700">
                          "The button text color isn't right, make it white"
                        </div>
                      </div>
                    </div>

                    {/* Cost Counter */}
                    <div className="border-t-2 border-red-200 pt-4 mt-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="transform hover:scale-105 transition-transform">
                          <div className="text-2xl font-bold text-red-900">6</div>
                          <div className="text-xs text-zinc-600">Prompts</div>
                        </div>
                        <div className="transform hover:scale-105 transition-transform">
                          <div className="text-2xl font-bold text-red-900">~3m</div>
                          <div className="text-xs text-zinc-600">Time wasted</div>
                        </div>
                        <div className="transform hover:scale-105 transition-transform">
                          <div className="text-2xl font-bold text-red-900">High</div>
                          <div className="text-xs text-zinc-600">Frustration</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: The Sorcery Way */}
              <div className="relative group">
                <div className="absolute -top-4 left-6 bg-emerald-100 border border-emerald-200 text-emerald-900 px-4 py-1 rounded-full text-sm font-semibold z-10 shadow-sm group-hover:shadow-md transition-shadow">
                  With Sorcery UI
                </div>
                
                <div className="border-2 border-emerald-200 rounded-2xl bg-emerald-50/30 p-6 h-full hover:shadow-lg transition-all duration-300 hover:border-emerald-300">
                  <div className="space-y-6">
                    {/* Step 1: Paste */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-emerald-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center group-hover:scale-110 transition-transform">1</div>
                        <div className="text-sm font-semibold text-zinc-900">Paste AI code (or have it imported in by your agent via MCP)</div>
                      </div>
                      <div className="font-mono text-xs text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-200 hover:bg-zinc-100 transition-colors">
                        &lt;Card className="p-8"&gt;...&lt;/Card&gt;
                      </div>
                    </div>

                    {/* Step 2: Visual Editor */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-emerald-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center group-hover:scale-110 transition-transform">2</div>
                        <div className="text-sm font-semibold text-zinc-900">Click. Adjust. Done.</div>
                      </div>
                      
                      {/* Visual representation */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded border border-zinc-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                          <div className="text-xs font-mono text-zinc-600">Padding:</div>
                          <div className="flex gap-2">
                            <div className="px-2 py-1 bg-white border border-zinc-300 rounded text-xs font-mono text-zinc-400 hover:border-zinc-400 transition-colors cursor-not-allowed">p-8</div>
                            <div className="text-zinc-400">→</div>
                            <div className="px-2 py-1 bg-emerald-100 border border-emerald-300 rounded text-xs font-mono text-emerald-900 hover:bg-emerald-200 transition-colors cursor-pointer">p-10</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded border border-zinc-200 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                          <div className="text-xs font-mono text-zinc-600">Button:</div>
                          <div className="flex gap-2">
                            <div className="px-2 py-1 bg-white border border-zinc-300 rounded text-xs font-mono text-zinc-400 hover:border-zinc-400 transition-colors cursor-not-allowed">bg-zinc-700</div>
                            <div className="text-zinc-400">→</div>
                            <div className="px-2 py-1 bg-emerald-100 border border-emerald-300 rounded text-xs font-mono text-emerald-900 hover:bg-emerald-200 transition-colors cursor-pointer">bg-zinc-900</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Export */}
                    <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all hover:border-emerald-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center group-hover:scale-110 transition-transform">3</div>
                        <div className="text-sm font-semibold text-zinc-900">Export updated code</div>
                      </div>
                      <div className="font-mono text-xs text-zinc-600 bg-zinc-50 p-2 rounded border border-zinc-200 hover:bg-zinc-100 transition-colors">
                        &lt;Card className="p-10"&gt;...&lt;/Card&gt;
                      </div>
                      <div className="text-xs text-emerald-700 mt-2 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                        Logic preserved, only styles changed
                      </div>
                    </div>

                    {/* Cost Counter */}
                    <div className="border-t-2 border-emerald-200 pt-4 mt-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="transform hover:scale-105 transition-transform">
                          <div className="text-2xl font-bold text-emerald-900">0</div>
                          <div className="text-xs text-zinc-600">Prompts</div>
                        </div>
                        <div className="transform hover:scale-105 transition-transform">
                          <div className="text-2xl font-bold text-emerald-900">~15s</div>
                          <div className="text-xs text-zinc-600">Total time</div>
                        </div>
                        <div className="transform hover:scale-105 transition-transform">
                          <div className="text-2xl font-bold text-emerald-900">Zero</div>
                          <div className="text-xs text-zinc-600">Frustration</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom insight */}
            <div className="mt-12 text-center">
              <div className="inline-block bg-zinc-900 text-white px-6 py-3 rounded-xl hover:bg-zinc-800 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <p className="text-sm font-medium">
                  Real editing. Real components. Real React runtime. <span className="text-zinc-400">Not prompts.</span>
                </p>
              </div>
            </div>

            {/* CTA after comparison removed per request */}
         </div>
      </section>

      {/* Screenshot Workflow Showcase */}
      <section className="px-6 pb-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold mb-4">
              <Camera className="h-3 w-3" />
              NEW: AI Design Extraction
            </div>
            <h2 className="text-4xl font-bold mb-4 text-zinc-900">From Screenshot to Code in Seconds</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Upload any UI screenshot. Get shadcn-style components, design tokens, and Tailwind config instantly.
            </p>
          </div>

          <div className="relative rounded-2xl border-2 border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 shadow-xl overflow-hidden">
            {/* Workflow Steps */}
            <div className="grid md:grid-cols-3 divide-x divide-zinc-200">
              {[
                {
                  step: '1',
                  icon: Upload,
                  title: 'Upload Screenshot',
                  desc: 'Drag & drop any UI design',
                  color: 'zinc'
                },
                {
                  step: '2',
                  icon: Brain,
                  title: 'AI Extraction',
                  desc: 'Extract components & tokens',
                  color: 'zinc'
                },
                {
                  step: '3',
                  icon: Download,
                  title: 'Export Code',
                  desc: 'Production-ready React',
                  color: 'zinc'
                }
              ].map((item) => (
                <div key={item.step} className="p-8 text-center group hover:bg-white/50 transition-colors">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-500 to-zinc-600 text-white mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold text-zinc-600 mb-2">STEP {item.step}</div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-600">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Demo Visual */}
            <div className="p-12 bg-white/60 backdrop-blur-sm border-t-2 border-zinc-200">
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
                  <div className="text-sm font-semibold text-zinc-600 flex items-center gap-2">
                    <Code2 className="h-4 w-4" /> Generated Components
                  </div>
                  <div className="aspect-video bg-zinc-900 text-white rounded-xl border-2 border-zinc-400 p-4 font-mono text-xs overflow-hidden shadow-xl">
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

      {/* The Problem & Solution */}
      <section className="py-24 px-6 relative bg-zinc-50 border-y border-zinc-200">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">The "Last Mile" Problem</h2>
              <div className="space-y-4 text-zinc-600 text-lg leading-relaxed font-light">
                <p>
                  AI assistants are incredible. They generate 90% of what you need instantly. 
                  But that final 10%, the padding tweaks, color adjustments, and responsive spacing, takes forever through prompts.
                </p>
                <p>
                  You describe changes, wait for regeneration, and repeat. 
                  Each iteration costs tokens, time, and mental energy.
                </p>
              </div>
            </div>
            
            <div className="relative bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
               <div className="absolute -top-4 -left-4 bg-zinc-900 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  The Vision
               </div>
               <h3 className="text-xl font-semibold text-zinc-900 mb-4 mt-2">Visually remix & refine.</h3>
               <p className="text-zinc-600 mb-6 font-light">
                 Sorcery UI isn't a replacement—it's an addition to your workflow. 
                 A richer set of tools to visually edit, clone, and remix React components with opinionated standards.
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

      {/* Social Proof / Usage Stats */}
      <section className="py-16 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">100+</div>
              <div className="text-sm text-zinc-600">Early testers</div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">2.5k+</div>
              <div className="text-sm text-zinc-600">Components edited</div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">~85%</div>
              <div className="text-sm text-zinc-600">Time saved</div>
            </div>
            <div className="group hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">Free</div>
              <div className="text-sm text-zinc-600">Beta access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-zinc-900">Why Sorcery UI?</h2>
              <p className="text-zinc-500 font-light">Built for serious frontend developers and teams who need runtime-editable components and design-system primitives.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  icon: <Layers className="w-6 h-6 text-zinc-900" />,
                  title: "Logic-Preserving Edits",
                  desc: "Sorcery UI parses your code into a visual tree. Edit structure and styles without breaking logic."
                },
                {
                  icon: <Sparkles className="w-6 h-6 text-zinc-900" />,
                  title: "Design System First",
                  desc: "Built with a preference for composable, shadcn-like architectures. Build and tweak your own design systems with real inspiration."
                },
                {
                  icon: <Cpu className="w-6 h-6 text-zinc-900" />,
                  title: "Universal Workflow",
                  desc: "Use it in the browser today. Soon to be integrated with your IDEs and vibe coding tools via MCP for a seamless workflow."
                },
                {
                  icon: <MousePointer2 className="w-6 h-6 text-zinc-900" />,
                  title: "For Frontend Pros",
                  desc: "More than visual tweaks: unlike Cursor's quick edits or Figma-to-code exports, Sorcery UI provides editable runtime components and design-system primitives for production-quality development."
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                  <div className="mb-6 p-3 rounded-xl bg-zinc-50 border border-zinc-100 w-fit group-hover:scale-110 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-zinc-900">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed font-light">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA after features removed (kept only in hero, navbar, and bottom) */}

        </div>
      </section>

      {/* Waitlist / Early Access Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 via-white to-zinc-50 -z-10"></div>
        
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-zinc-900 text-white text-xs font-semibold mb-6">
              <Users className="h-3 w-3" />
              Join the community
            </div>
            <h2 className="text-4xl font-bold mb-4 text-zinc-900">Get Early Access & Support</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              MCP integration, custom workflows, and team features are coming. Join the waitlist for priority access, 
              custom integration support, and input on the roadmap.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-zinc-900" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Priority Early Access</h3>
              <p className="text-sm text-zinc-600">Be first to test upcoming features like MCP server integration and team collaboration</p>
            </div>
            
            <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-zinc-900" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Custom Integration</h3>
              <p className="text-sm text-zinc-600">Get help setting up Sorcery UI in your workflow with personalized onboarding</p>
            </div>
            
            <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-zinc-900" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Roadmap Input</h3>
              <p className="text-sm text-zinc-600">Shape the future of Sorcery UI with direct feedback to the development team</p>
            </div>
          </div>

          {/* Google Form Embed */}
          <div className="bg-white border-2 border-zinc-200 rounded-2xl p-8 shadow-lg">
            <div className="max-w-xl mx-auto text-center">
              <h3 className="text-xl font-semibold text-zinc-900 mb-4">Sign up for the waitlist</h3>
              <p className="text-sm text-zinc-600 mb-6">
                Fill out this quick form to join. We'll reach out within 24 hours with early access details.
              </p>
              
              {/* Google Form Button */}
              <a 
                href="https://forms.gle/ZE48yyJdBwcKs92T7"
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20"
              >
                Open Waitlist Form <ExternalLink className="h-4 w-4" />
              </a>
              
              <p className="text-xs text-zinc-500 mt-4">
                No spam. Updates only when there's something worth sharing.
              </p>
            </div>
          </div>

          {/* Single editor CTA moved below trust signals */}

          {/* Trust signals */}
          <div className="mt-12 text-center">
            <p className="text-sm text-zinc-500 mb-4">Trusted by developers at</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
              <div className="text-zinc-400 font-semibold text-sm">Startups</div>
              <div className="w-px h-4 bg-zinc-300"></div>
              <div className="text-zinc-400 font-semibold text-sm">Indie Hackers</div>
              <div className="w-px h-4 bg-zinc-300"></div>
              <div className="text-zinc-400 font-semibold text-sm">Open Source Projects</div>
            </div>
          </div>

          {/* Distinct editor CTA below trust signals */}
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="h-12 px-10 text-base bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg transition-all duration-200">
              <Link to="/editor">
                Start Editing Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-zinc-500 mt-3">Free beta • No credit card • No installation</p>
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
                &copy; {new Date().getFullYear()} Sorcery UI | <a href="https://ratishpanda.in" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 transition-colors underline">Contact</a>
            </div>
        </div>
      </footer>
    </div>
  );
}