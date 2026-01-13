/**
 * DesignImportDialog
 *
 * Modal UI that allows users to upload a screenshot and invoke the server
 * AI pipeline to extract a design system. The dialog returns a `DesignSystemResponse`
 * object which contains `designTokens` and `components` that the UI previews
 * and can import into the active project.
 *
 * Responsibilities:
 * - Upload image files (or allow re-upload)
 * - Show progress and success states while AI is processing
 * - Display component and token previews when analysis completes
 * - Apply the generated tokens and components to the current project on import
 *
 * The UI intentionally keeps behavior simple — it delegates AI interaction to
 * `client/src/lib/aiService.ts` and uses helper functions in `client/src/lib/importUtils.ts`
 * to convert the AI's returned tokens into text for the editors.
 */
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Loader2, CheckCircle2, FileCode, Palette } from 'lucide-react';
import { generateDesignSystem, type DesignSystemResponse } from '@/lib/aiService';
import { useNotification } from './ui/notification';
import { jsonCssToCssString, jsonConfigToString } from '@/lib/importUtils';
import { useComponentStore } from '@/store/componentStore';

interface DesignImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DesignImportDialog: React.FC<DesignImportDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DesignSystemResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState('');

  // Store Actions
  const {
    setThemeCss,
    setTailwindConfig,
    addComponent,
    updateComponentCode,
    updateComponentName,
  } = useComponentStore();

  /**
   * handleFileChange - Upload handler for selected image file.
   * Sends the selected image to the server AI service and stores the
   * resulting design system data in local state for preview.
   */
  const { notify } = useNotification();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!apiKey.trim()) {
      notify({ type: 'error', title: 'Missing API Key', message: 'Please enter your AI API key before uploading.', duration: 6000 });
      // Reset input so same file can be selected again after key entry
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsLoading(true);
    try {
      const data = await generateDesignSystem(file, apiKey.trim());
      setResult(data);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to analyze image';
      const details = (err as unknown as { details?: unknown })?.details ?? undefined;
      notify({ type: 'error', title: 'Analysis Failed', message, details, duration: 10000 });
    } finally {
      setIsLoading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * handleImport - Applies the AI-generated design system into the current project.
   * This includes:
   *  - Setting global theme CSS variables
   *  - Updating the Tailwind config
   *  - Adding/importing generated components into the component library
   */
  const handleImport = () => {
    if (!result) return;

    // 1. Apply Design Tokens (Global Theme)
    const cssString = jsonCssToCssString(
      result.designTokens.cssVars.root,
      result.designTokens.cssVars.dark
    );
    setThemeCss(cssString);

    const configString = jsonConfigToString(result.designTokens.tailwindConfig);
    setTailwindConfig(configString);

    // 2. Import Components
    // Iterate through generated components and add them to the project
    result.components.forEach((comp) => {
      // Create new component (automatically becomes active)
      addComponent();

      // Get fresh state to find the ID we just created
      const state = useComponentStore.getState();
      const project = state.projects[state.activeProjectId!];
      const newId = project.activeComponentId;

      if (newId) {
        updateComponentName(newId, comp.name);
        updateComponentCode(comp.code);
      }
    });

    onOpenChange(false);
    setResult(null); // Reset for next time
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Design System Extraction</DialogTitle>
          <DialogDescription>
            Enter your AI API key, then upload a UI screenshot. AI will extract design tokens and rebuild the components.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/50 transition-colors hover:bg-muted/80">
            {isLoading ? (
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Analyzing pixels... extracting tokens... generating code...
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="grid gap-2 text-left w-full max-w-md mx-auto">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="ai-api-key">AI API Key</label>
                  <input
                    id="ai-api-key"
                    type="password"
                    placeholder="Enter your AI provider API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">Required: the key is sent securely with your upload and used only for this analysis.</p>
                </div>
                <div
                  className="p-4 bg-background rounded-full inline-block shadow-sm cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                >
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <Button variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} disabled={!apiKey.trim()}>
                    Upload Screenshot
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports PNG, JPG, WebP. API key required.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg border border-green-500/20">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Analysis Complete</span>
            </div>

            <Tabs defaultValue="components">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="components">Components ({result.components.length})</TabsTrigger>
                <TabsTrigger value="tokens">Design Tokens</TabsTrigger>
              </TabsList>

              <TabsContent value="components" className="space-y-4 mt-4">
                <div className="grid gap-3">
                  {result.components.map((comp, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border rounded-lg bg-card">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <FileCode className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{comp.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{comp.description}</p>
                        <div className="flex gap-2 mt-2">
                           {comp.dependencies.map(dep => (
                             <span key={dep} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                               {dep}
                             </span>
                           ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tokens" className="space-y-4 mt-4">
                 {(() => {
                 // Safely extract colors object from a loosely-typed tailwindConfig
                 const tc = (result.designTokens?.tailwindConfig as unknown) as { theme?: { extend?: { colors?: unknown } } } | undefined;
                 const tailwindColorsStr = JSON.stringify(tc?.theme?.extend?.colors ?? {}, null, 2);
                 return (
                   <div className="grid grid-cols-2 gap-4">              
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Colors Detected
                      </h4>
                      <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-40">
                        {tailwindColorsStr}
                      </pre>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">CSS Variables</h4>
                      <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.designTokens.cssVars.root, null, 2)}
                      </pre>
                    </div>
                   </div>
                 );
                 })()}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setResult(null)}>Cancel</Button>
              <Button onClick={handleImport}>Import All</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};