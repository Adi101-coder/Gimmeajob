'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Settings } from 'lucide-react';

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
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading settings...</CardContent>
      </Card>
    );
  }

  const settings = [
    { label: 'Daily Email Limit', value: String(config.dailyEmailLimit) },
    { label: 'Working Hours', value: `${config.workingHours.start} – ${config.workingHours.end} (${config.workingHours.timezone})` },
    { label: 'SMTP Host', value: `${config.smtp.host}:${config.smtp.port}` },
    { label: 'From Email', value: config.smtp.fromEmail },
    { label: 'LLM Model', value: config.llm.model },
    { label: 'Temperature', value: String(config.llm.temperature) },
    { label: 'Retry Count', value: String(config.retry.count) },
    { label: 'Random Delay', value: `${config.randomDelay.minSeconds}s – ${config.randomDelay.maxSeconds}s` },
    { label: 'Email Subject', value: config.emailSubject },
  ];

  const healthItems = health
    ? [
        { label: 'Database', ok: health.database },
        { label: 'Excel File', ok: health.excel },
        { label: 'Email Template', ok: health.template },
        { label: 'Resume', ok: health.resume },
        { label: 'SMTP Configured', ok: health.smtp },
        { label: 'LLM Configured', ok: health.llm },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Settings
        </CardTitle>
        <CardDescription>
          Configuration loaded from config/config.json. Edit the file to change settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {settings.map((s) => (
            <div key={s.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-medium mt-1 break-all">{s.value}</p>
            </div>
          ))}
        </div>

        {healthItems.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">System Health</h4>
            <div className="flex flex-wrap gap-2">
              {healthItems.map((item) => (
                <span
                  key={item.label}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.ok
                      ? 'bg-green-400/10 text-green-400'
                      : 'bg-red-400/10 text-red-400'
                  }`}
                >
                  {item.label}: {item.ok ? 'OK' : 'Missing'}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
