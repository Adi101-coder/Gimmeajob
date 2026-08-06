'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Mail, Send } from 'lucide-react';

export function TestEmailPanel() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [attachResume, setAttachResume] = useState(true);

  const mutation = useMutation({
    mutationFn: () => api.sendTestEmail({ to: email, attachResume }),
    onSuccess: (data) => {
      toast({
        title: 'Test email sent',
        description: `Delivered to ${data.to}${data.attachedResume ? ' with resume attached' : ''}.`,
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
      toast({ title: 'Enter an email address', variant: 'destructive' });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Send test email</h3>
          <p className="text-sm text-muted-foreground">
            Send a one-off email to verify SMTP is working before starting a campaign
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testEmail">Recipient email</Label>
          <Input
            id="testEmail"
            type="email"
            placeholder="your.email@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mutation.isPending}
          />
          <p className="text-xs text-muted-foreground">
            Tip: send to yourself first to confirm delivery and check spam folder
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <input
            type="checkbox"
            checked={attachResume}
            onChange={(e) => setAttachResume(e.target.checked)}
            disabled={mutation.isPending}
            className="h-4 w-4 rounded accent-primary"
          />
          <div>
            <p className="text-sm font-medium">Attach resume</p>
            <p className="text-xs text-muted-foreground">Also tests Resume.pdf attachment</p>
          </div>
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
