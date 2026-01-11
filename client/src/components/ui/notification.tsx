import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './dialog';
import { Button } from './button';
import { X, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'info' | 'success' | 'error' | 'warning';

export interface NotificationPayload {
  id?: string;
  title?: string;
  message?: string;
  details?: unknown;
  type?: NotificationType;
  duration?: number; // ms
  action?: {
    label: string;
    callback?: () => void;
  };
}

// Simple cross-module API: consumers can import `showNotification` to emit notifications
export function showNotification(payload: NotificationPayload) {
  window.dispatchEvent(new CustomEvent('app:notify', { detail: payload }));
}

interface NotificationContextValue {
  notify: (payload: NotificationPayload) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [list, setList] = useState<NotificationPayload[]>([]);
  const [activeDetails, setActiveDetails] = useState<NotificationPayload | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent).detail as NotificationPayload;
      // ensure id
      const id = payload.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setList((s) => [...s, { ...payload, id }]);
    };
    window.addEventListener('app:notify', handler as EventListener);
    return () => window.removeEventListener('app:notify', handler as EventListener);
  }, []);

  const notify = (payload: NotificationPayload) => showNotification(payload);

  const remove = (id?: string) => {
    if (!id) return;
    setList((s) => s.filter((n) => n.id !== id));
  };

  useEffect(() => {
    // Set up auto-dismiss for notifications with a duration
    const timers: number[] = [];
    list.forEach((n) => {
      if (n.duration && n.id) {
        const t = window.setTimeout(() => remove(n.id), n.duration);
        timers.push(t);
      }
    });
    return () => timers.forEach((t) => clearTimeout(t));
  }, [list]);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {/* Notification toasts container */}
      <div style={{ zIndex: 2147483647 }} className="fixed right-4 top-4 flex flex-col gap-3 max-w-sm w-full">
        {list.map((n) => (
          <div key={n.id} className={cn('flex items-start gap-3 p-3 rounded-lg shadow-md border', n.type === 'error' ? 'bg-red-600/10 border-red-600/20 text-red-600' : n.type === 'success' ? 'bg-green-600/10 border-green-600/20 text-green-600' : 'bg-card border-border text-foreground')}>
            <div className="shrink-0 mt-0.5">
              {n.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : n.type === 'error' ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold truncate">{n.title ?? (n.type === 'error' ? 'Error' : 'Notification')}</div>
                <div className="flex items-center gap-2">
                  {n.action && (
                    <button
                      className="text-xs px-2 py-0.5 rounded bg-muted/20 hover:bg-muted/30"
                      onClick={() => {
                        try {
                          n.action?.callback?.();
                        } catch (err) {
                          console.error('Notification action error', err);
                        }
                        remove(n.id);
                      }}
                    >
                      {n.action.label}
                    </button>
                  )}
                  <button className="text-xs opacity-70 hover:opacity-100" onClick={() => remove(n.id)} aria-label="Close notification"><X className="h-4 w-4" /></button>
                </div>
              </div>
              {n.message && <div className="text-xs text-muted-foreground truncate">{n.message}</div>}
              {n.details && <div className="mt-2"><button onClick={() => setActiveDetails(n)} className="text-[11px] text-muted-foreground underline">View details</button></div>}
            </div>
          </div>
        ))}
      </div>

      {/* Error details dialog */}
      {activeDetails && (
        <Dialog open={!!activeDetails} onOpenChange={(v) => !v && setActiveDetails(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{activeDetails.title ?? 'Details'}</DialogTitle>
              <DialogDescription>{activeDetails.message ?? 'More details provided by server'}</DialogDescription>
            </DialogHeader>
            <div className="mt-2 max-h-[55vh] overflow-auto">
              <pre className="text-xs bg-muted p-3 rounded">{typeof activeDetails.details === 'string' ? activeDetails.details : JSON.stringify(activeDetails.details, null, 2)}</pre>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveDetails(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </NotificationContext.Provider>
  );
};

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

export default NotificationProvider;
