'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Mail, Send } from 'lucide-react';

interface TestEmailPanelProps {
  compact?: boolean;
}

export function TestEmailPanel({ compact = false }: TestEmailPanelProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [attachResume, setAttachResume] = useState(true);

  const mutation = useMutation({
    mutationFn: () => api.sendTestEmail({ to: email, attachResume }),
    onSuccess: (data) => {
      toast({
        title: 'Test email sent',
        description: `Check inbox for ${data.to}`,
      });
    },
    onError: (err: Error) => {
      toast({
        title: 'Test email failed',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'Enter a test email address', variant: 'destructive' });
      return;
    }
    mutation.mutate();
  };

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-2 shrink-0 text-sm font-medium">
          <Mail className="h-4 w-4 text-primary" />
          Test SMTP
        </div>
        <Input
          type="email"
          placeholder="Enter testing mail e.g. yourname@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mutation.isPending}
          className="h-10 flex-1 rounded-full border-primary/20 bg-card"
        />
        <Button
          type="submit"
          size="sm"
          disabled={mutation.isPending || !email.trim()}
          className="shrink-0 gap-2 rounded-full px-5"
        >
          <Send className="h-4 w-4" />
          {mutation.isPending ? 'Sending...' : 'Send test'}
        </Button>
        <p className="text-xs text-muted-foreground sm:col-span-full">
          Resume attached by default
        </p>
        {mutation.isSuccess && (
          <p className="text-xs text-emerald-600 sm:col-span-full">Sent — check inbox & spam</p>
        )}
      </form>
    );
  }

  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Send test email</h3>
          <p className="text-sm text-muted-foreground">
            Verify Gmail SMTP before starting a campaign
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Enter testing mail e.g. yourname@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mutation.isPending}
        />

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <input
            type="checkbox"
            checked={attachResume}
            onChange={(e) => setAttachResume(e.target.checked)}
            disabled={mutation.isPending}
            className="h-4 w-4 rounded accent-primary"
          />
          <span className="text-sm">Attach resume with test email</span>
        </label>

        <Button type="submit" disabled={mutation.isPending || !email.trim()} className="gap-2">
          <Send className="h-4 w-4" />
          {mutation.isPending ? 'Sending...' : 'Send test email'}
        </Button>

        {mutation.isSuccess && (
          <p className={cn('rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700')}>
            Test email sent to {mutation.data.to}. Check your inbox (and spam).
          </p>
        )}
      </form>
    </div>
  );
}
