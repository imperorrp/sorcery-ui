/**
 * Keyboard Shortcuts Help Component
 *
 * A modal/dialog showing all available keyboard shortcuts in the editor.
 * Can be triggered by pressing '?' key.
 *
 * @author Sorcery UI Team
 */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Individual shortcut row component
 */
const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <span className="text-sm text-foreground">{description}</span>
    <div className="flex gap-1">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-muted-foreground mx-1">+</span>}
          <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  </div>
);

/**
 * Shortcut category section
 */
const ShortcutSection: React.FC<{ title: string; shortcuts: Array<{ keys: string[]; description: string }> }> = ({
  title,
  shortcuts,
}) => (
  <div className="mb-4">
    <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
    <div className="space-y-1">
      {shortcuts.map((shortcut, index) => (
        <ShortcutRow key={index} keys={shortcut.keys} description={shortcut.description} />
      ))}
    </div>
  </div>
);

/**
 * Keyboard shortcuts help dialog
 */
export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ open, onOpenChange }) => {
  const shortcuts = {
    navigation: [
      { keys: ['Ctrl', '1'], description: 'Switch to Preview' },
      { keys: ['Ctrl', '2'], description: 'Switch to Code View' },
      { keys: ['Ctrl', '3'], description: 'Switch to Config View' },
    ],
    actions: [
      { keys: ['Ctrl', 'R'], description: 'Render Component' },
      { keys: ['Ctrl', 'K'], description: 'Quick Config View' },
      { keys: ['Ctrl', 'S'], description: 'Apply Changes' },
    ],
    panels: [
      { keys: ['Ctrl', 'B'], description: 'Toggle Inspector Panel' },
      { keys: ['Ctrl', 'J'], description: 'Toggle Navigator Panel' },
    ],
    editing: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'F'], description: 'Search in Code' },
    ],
    general: [
      { keys: ['?'], description: 'Show Keyboard Shortcuts' },
      { keys: ['Esc'], description: 'Close Dialogs/Deselect' },
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and work faster in Sorcery UI.
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">?</kbd> anytime to view this help.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <ShortcutSection title="Navigation" shortcuts={shortcuts.navigation} />
          <ShortcutSection title="Actions" shortcuts={shortcuts.actions} />
          <ShortcutSection title="Panels" shortcuts={shortcuts.panels} />
          <ShortcutSection title="Editing" shortcuts={shortcuts.editing} />
          <ShortcutSection title="General" shortcuts={shortcuts.general} />
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> On macOS, use <kbd className="px-1 py-0.5 text-xs bg-background border border-border rounded">Cmd</kbd> instead of <kbd className="px-1 py-0.5 text-xs bg-background border border-border rounded">Ctrl</kbd>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
