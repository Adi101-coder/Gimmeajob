'use client';

import * as React from 'react';
import { ToastProvider, ToastViewport } from '@/components/ui/toast';

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Array<{ id: string; title: string; description?: string; variant?: 'default' | 'destructive' }>>([]);

  const toast = React.useCallback(
    ({ title, description, variant = 'default' }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, title, description, variant }]);

      if (typeof window !== 'undefined') {
        const el = document.createElement('div');
        el.className = `fixed bottom-4 right-4 z-50 rounded-lg border p-4 shadow-lg animate-in slide-in-from-bottom-2 ${
          variant === 'destructive' ? 'border-destructive bg-destructive text-destructive-foreground' : 'bg-card text-card-foreground'
        }`;
        el.innerHTML = `<p class="font-semibold text-sm">${title}</p>${description ? `<p class="text-sm opacity-90 mt-1">${description}</p>` : ''}`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
      }
    },
    []
  );

  return { toast, toasts };
}
