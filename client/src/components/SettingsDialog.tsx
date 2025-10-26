/**
 * Settings Dialog Component
 *
 * A modal dialog for application settings including layout preferences.
 * Provides layout switching with mobile restrictions for experimental mode.
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings as SettingsIcon } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * Props for the SettingsDialog component.
 */
interface SettingsDialogProps {
  currentLayout: 'vibe' | 'experimental';
  onLayoutChange: (layout: 'vibe' | 'experimental') => void;
  children?: React.ReactNode;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  currentLayout,
  onLayoutChange,
  children,
}) => {
  const { isMobile } = useResponsive();
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <SettingsIcon className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your editor experience and preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="layout" className="text-sm font-medium">
              Editor Layout
            </Label>
            <Select
              value={currentLayout}
              onValueChange={(value: 'vibe' | 'experimental') => onLayoutChange(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vibe">
                  <div>
                    <div className="font-medium">Vibe Layout</div>
                    <div className="text-xs text-muted-foreground">
                      Traditional IDE-style with segmented controls
                    </div>
                  </div>
                </SelectItem>
                <SelectItem 
                  value="experimental" 
                  disabled={isMobile}
                >
                  <div>
                    <div className="font-medium">
                      Experimental Layout
                      {isMobile && <span className="text-xs text-muted-foreground ml-1">(Desktop only)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Advanced panel system for larger screens with full toggle control
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
