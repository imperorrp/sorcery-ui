/**
 * Help Modal Component
 *
 * Tutorial/onboarding modal that explains how to use Sorcery UI.
 * Shows automatically when opening the editor pages.
 *
 * @author Sorcery UI Team
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Code2,
  MousePointer2,
  Layers,
  Settings,
  Download,
  Zap,
  Eye,
  TreePine,
  Palette,
} from 'lucide-react';

interface HelpModalProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
}

/**
 * HelpModal - Interactive tutorial for Sorcery UI
 *
 * Features:
 * - Multi-tab guide (Getting Started, Workflow, Shortcuts, Tips)
 * - Visual icons and clear instructions
 * - localStorage persistence to show only once
 * - Can be reopened anytime via help button
 *
 * @param {HelpModalProps} props - open state and change handler
 * @returns {JSX.Element} The help modal dialog
 */
export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState('start');

  // Reset to first tab when modal opens
  useEffect(() => {
    if (open) {
      // Defer setting the active tab until the dialog has mounted to avoid
      // timing issues where the Tabs component doesn't pick up the value.
      // Using requestAnimationFrame ensures the tab selection happens
      // after the next paint when the dialog content is present in the DOM.
      const raf = requestAnimationFrame(() => setActiveTab('start'));
      return () => cancelAnimationFrame(raf);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full sm:w-auto sm:max-w-3xl sm:max-h-[85vh] sm:rounded-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Welcome to Sorcery UI</DialogTitle>
          <DialogDescription className="text-base">
            Your visual editor for React components that preserves code logic
          </DialogDescription>
        </DialogHeader>

        <Tabs
          key={open ? 'open' : 'closed'}
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
            <TabsTrigger value="start">Getting Started</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="tips">Pro Tips</TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="start" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What is Sorcery UI?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sorcery UI is a visual editor for React components that lets you refine styles and structure 
                without breaking your code logic. It's designed to solve the "last mile" problem of AI-generated 
                components—making those final tweaks without endless prompting.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Key Features</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    icon: MousePointer2,
                    title: 'Visual Editing',
                    desc: 'Click elements and adjust styles visually with Tailwind controls',
                  },
                  {
                    icon: Code2,
                    title: 'Logic Preservation',
                    desc: 'Your hooks, state, and event handlers stay intact',
                  },
                  {
                    icon: Layers,
                    title: 'Real Environment',
                    desc: 'Not screenshots—actual React runtime with props and context',
                  },
                  {
                    icon: Download,
                    title: 'Clean Export',
                    desc: 'Export formatted JSX/TSX ready for production',
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex gap-3 p-3 rounded-lg border bg-card">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Interface Overview</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Code2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Code Panel</p>
                    <p className="text-muted-foreground">Paste or edit your component code. Supports JSX and TSX.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Preview Panel</p>
                    <p className="text-muted-foreground">See your component render in real-time. Click to select elements.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Palette className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Inspector Panel</p>
                    <p className="text-muted-foreground">Adjust Tailwind classes, spacing, colors, and more visually.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <TreePine className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Navigator Panel</p>
                    <p className="text-muted-foreground">Browse your component tree structure hierarchically.</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Workflow</h3>
              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    icon: Upload,
                    title: 'Paste Your Component',
                    desc: 'Switch to Code view and paste your React component (JSX or TSX). Can be AI-generated or hand-written.',
                  },
                  {
                    step: '2',
                    icon: Settings,
                    title: 'Configure (Optional)',
                    desc: 'Switch to Config view to add props, dependencies (CDN), or context providers if needed.',
                  },
                  {
                    step: '3',
                    icon: Zap,
                    title: 'Render',
                    desc: 'Click the Render button (or press Ctrl+Enter) to parse and render your component.',
                  },
                  {
                    step: '4',
                    icon: MousePointer2,
                    title: 'Select & Edit',
                    desc: 'Switch to Preview. Click any element to select it. Use the Inspector panel to adjust styles visually.',
                  },
                  {
                    step: '5',
                    icon: Download,
                    title: 'Export Code',
                    desc: 'Switch back to Code view to see your updated component. Copy the clean, formatted code.',
                  },
                ].map((step) => (
                  <div key={step.step} className="flex gap-4 p-4 rounded-lg border bg-card">
                    <div className="shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {step.step}
                      </div>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-primary" />
                        <h4 className="font-medium">{step.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selection Tips</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-muted-foreground">
                    <strong>Click</strong> an element in Preview to select it
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-muted-foreground">
                    <strong>Shift+Click</strong> on overlapping elements for drill-down selection menu
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p className="text-muted-foreground">
                    Use the <strong>Navigator</strong> panel to select elements from the tree
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Shortcuts Tab */}
          <TabsContent value="shortcuts" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <div className="grid gap-3">
                {[
                  { keys: ['Ctrl', 'Enter'], desc: 'Render component' },
                  { keys: ['1'], desc: 'Switch to Preview' },
                  { keys: ['2'], desc: 'Switch to Code' },
                  { keys: ['3'], desc: 'Switch to Config' },
                  { keys: ['Ctrl', 'I'], desc: 'Toggle Inspector panel' },
                  { keys: ['Ctrl', 'N'], desc: 'Toggle Navigator panel' },
                  { keys: ['Esc'], desc: 'Deselect element' },
                  { keys: ['?'], desc: 'Show keyboard shortcuts' },
                ].map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <span className="text-sm text-muted-foreground">{shortcut.desc}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                            {key}
                          </kbd>
                          {j < shortcut.keys.length - 1 && <span className="text-muted-foreground">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Pro Tips Tab */}
          <TabsContent value="tips" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pro Tips</h3>
              <div className="space-y-3">
                {[
                  {
                    icon: Layers,
                    title: 'Multi-Component Projects',
                    tip: 'Use the Project dropdown to create multi-component projects. Edit parent and child components together with proper relationships.',
                  },
                  {
                    icon: Settings,
                    title: 'Props & Context',
                    tip: 'Configure props in JSON format in the Config panel. Add context providers to test your component in realistic environments.',
                  },
                  {
                    icon: Code2,
                    title: 'CDN Dependencies',
                    tip: 'Need external libraries? Add them via CDN URLs in the Config panel. Great for icons, animations, or utility libraries.',
                  },
                  {
                    icon: Zap,
                    title: 'Quick Iterations',
                    tip: 'Make multiple visual tweaks, then switch to Code view only when done. All changes are applied to your source code instantly.',
                  },
                  {
                    icon: Palette,
                    title: 'Tailwind Focused',
                    tip: 'Sorcery UI works best with Tailwind CSS. The Inspector panel gives you visual controls for all common Tailwind utilities.',
                  },
                  {
                    icon: Eye,
                    title: 'Smart Boundaries',
                    tip: 'Child components are automatically detected and protected. You can\'t accidentally edit into them from the parent component.',
                  },
                ].map((tip) => (
                  <div key={tip.title} className="flex gap-3 p-4 rounded-lg border bg-card">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <tip.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground">{tip.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2 text-sm">Need More Help?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Check out the documentation or press <kbd className="px-2 py-0.5 text-xs font-semibold bg-background rounded border">?</kbd> anytime 
                to see keyboard shortcuts.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  View Documentation (coming soon)
                </a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const prevIndex = ['start', 'workflow', 'shortcuts', 'tips'].indexOf(activeTab);
              if (prevIndex > 0) {
                setActiveTab(['start', 'workflow', 'shortcuts', 'tips'][prevIndex - 1]);
              }
            }}
            disabled={activeTab === 'start'}
          >
            ← Previous
          </Button>
          
          {activeTab === 'tips' ? (
            <Button onClick={() => onOpenChange(false)}>
              Get Started
            </Button>
          ) : (
            <Button
              onClick={() => {
                const nextIndex = ['start', 'workflow', 'shortcuts', 'tips'].indexOf(activeTab);
                if (nextIndex < 3) {
                  setActiveTab(['start', 'workflow', 'shortcuts', 'tips'][nextIndex + 1]);
                }
              }}
            >
              Next →
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Custom hook to manage help modal visibility and first-time user experience.
 * 
 * @returns Object with isOpen state and handlers
 */
export function useHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Always show help modal when opening editor
    setIsOpen(true);
  }, []);

  const openHelp = () => setIsOpen(true);
  const closeHelp = () => setIsOpen(false);

  return {
    isOpen,
    openHelp,
    closeHelp,
    setIsOpen,
  };
}
