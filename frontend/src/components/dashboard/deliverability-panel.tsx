'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';

export function DeliverabilityPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['deliverability'],
    queryFn: api.getDeliverability,
    refetchInterval: 60000,
  });

  if (isLoading || !data) {
    return (
      <div className="rounded-3xl bg-card p-6 shadow-soft text-sm text-muted-foreground">
        Checking deliverability...
      </div>
    );
  }

  const levelIcon = (level: string) => {
    if (level === 'error') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (level === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Deliverability score</h3>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-sm font-semibold',
            data.score >= 80 ? 'bg-emerald-100 text-emerald-700' : data.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          )}
        >
          {data.score}/100
        </span>
      </div>

      {data.issues.length > 0 && (
        <div className="mb-4 space-y-2">
          {data.issues.map((issue, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm">
              {levelIcon(issue.level)}
              <div>
                <p className="font-medium">{issue.message}</p>
                <p className="text-xs text-muted-foreground">{issue.fix}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.issues.length === 0 && (
        <p className="mb-4 flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> No critical issues detected
        </p>
      )}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tips</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {data.recommendations.slice(0, 4).map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
