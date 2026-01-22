// components/ui/Toast.tsx
'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number; // ms
  actionLabel?: string;
  onAction?: () => void;
};

type ToastCtx = {
  toasts: ToastItem[];
  show: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID();
    const item: ToastItem = { id, duration: 3500, variant: 'default', ...t };
    setToasts((list) => [...list, item]);
    if (item.duration && item.duration > 0) {
      setTimeout(() => dismiss(id), item.duration);
    }
  }, [dismiss]);

  const value = useMemo(() => ({ toasts, show, dismiss }), [toasts, show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'min-w-[280px] max-w-[360px] rounded-md border px-3 py-2 text-sm shadow-panel bg-panel',
              'border-border',
              t.variant === 'success' ? 'ring-1 ring-emerald-400/30' : '',
              t.variant === 'error' ? 'ring-1 ring-rose-400/30' : '',
              t.variant === 'warning' ? 'ring-1 ring-amber-400/30' : '',
            ].join(' ')}
          >
            {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
            {t.description && <div className="text-muted">{t.description}</div>}
            {t.actionLabel && (
              <div className="mt-2 flex justify-end">
                <button
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-subtle/60"
                  onClick={() => { t.onAction?.(); dismiss(t.id); }}
                >
                  {t.actionLabel}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
