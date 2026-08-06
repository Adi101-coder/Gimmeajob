'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';
import { TestEmailPanel } from '@/components/dashboard/test-email-panel';

export function SettingsPanel() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: api.getConfig,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });

  if (isLoading || !config) {
    return (
      <div className="rounded-3xl bg-card p-12 text-center text-muted-foreground shadow-soft">
        Loading settings...
      </div>
    );
  }

  const settings = [
    { label: 'Daily email limit', value: String(config.dailyEmailLimit) },
    { label: 'Working hours', value: `${config.workingHours.start} – ${config.workingHours.end}` },
    { label: 'Timezone', value: config.workingHours.timezone },
    { label: 'SMTP host', value: `${config.smtp.host}:${config.smtp.port}` },
    { label: 'From email', value: config.smtp.fromEmail },
    { label: 'From name', value: config.smtp.fromName },
    { label: 'LLM model', value: config.llm.model },
    { label: 'Temperature', value: String(config.llm.temperature) },
    { label: 'Retry count', value: String(config.retry.count) },
    { label: 'Random delay', value: `${config.randomDelay.minSeconds}s – ${config.randomDelay.maxSeconds}s` },
    { label: 'Email subject', value: config.emailSubject },
  ];

  const healthItems = health
    ? [
        { label: 'Database', ok: health.database },
        { label: 'Excel file', ok: health.excel },
        { label: 'Email template', ok: health.template },
        { label: 'Resume', ok: health.resume },
        { label: 'SMTP configured', ok: health.smtp },
        { label: 'LLM configured', ok: health.llm },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Edit config/config.json to change values</p>
      </div>

      <TestEmailPanel />

      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <h3 className="mb-4 text-base font-semibold">System health</h3>
        <div className="flex flex-wrap gap-2">
          {healthItems.map((item) => (
            <span
              key={item.label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
                item.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              )}
            >
              {item.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-sm font-medium break-all">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
