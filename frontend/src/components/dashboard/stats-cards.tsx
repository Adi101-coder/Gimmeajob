'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn, getStatusColor } from '@/lib/utils';
import { CheckCircle, Clock, Mail, Users, XCircle } from 'lucide-react';

export function StatsCards() {
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 5000,
  });

  const campaign = dashboard?.activeCampaign;
  const progress = campaign
    ? Math.round((campaign.sentCount / Math.max(campaign.totalContacts, 1)) * 100)
    : 0;

  const kpis = [
    { label: 'Sent today', value: `${dashboard?.todaySent ?? 0}`, sub: `of ${dashboard?.dailyLimit ?? 0} limit` },
    { label: 'Remaining today', value: `${dashboard?.emailsRemaining ?? 0}`, sub: 'emails left' },
    { label: 'Avg. campaign progress', value: campaign ? `${progress}%` : '—', sub: campaign ? campaign.jobRole : 'No active campaign' },
  ];

  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const progressBars = campaign
    ? [progress, Math.min(progress + 15, 100), Math.min(progress + 8, 100), Math.min(progress + 22, 100)]
    : [0, 0, 0, 0];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Left — KPI overview */}
      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <div className="grid grid-cols-3 gap-4 border-b border-border pb-6">
          {kpis.map((kpi) => (
            <div key={kpi.label}>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{kpi.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium">Campaign timeline</p>
            {campaign && (
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', getStatusColor(campaign.status))}>
                {campaign.status}
              </span>
            )}
          </div>
          <div className="flex items-end justify-between gap-3">
            {months.map((month, i) => (
              <div key={month} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative h-16 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-primary transition-all"
                    style={{ height: `${Math.max(progressBars[i % progressBars.length], 8)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{month}</span>
              </div>
            ))}
          </div>
          {campaign && (
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                {campaign.sentCount} sent
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                {campaign.failedCount} failed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right — Quick stats cards */}
      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Total contacts loaded</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">{dashboard?.totalContacts ?? 0}</p>
        <p className="mt-1 text-sm text-muted-foreground">Valid HR contacts from Excel</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: Mail, label: 'Sent', value: campaign?.sentCount ?? 0, active: true },
            { icon: Clock, label: 'Pending', value: campaign ? campaign.totalContacts - campaign.sentCount - campaign.failedCount : 0, active: false },
            { icon: Users, label: 'Total', value: dashboard?.totalContacts ?? 0, active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                'rounded-2xl border p-4 transition-all',
                item.active ? 'border-primary bg-primary/10' : 'border-border bg-surface'
              )}
            >
              <item.icon className={cn('h-4 w-4', item.active ? 'text-foreground' : 'text-muted-foreground')} />
              <p className="mt-3 text-xl font-semibold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {dashboard?.importReport && (
          <p className="mt-4 text-xs text-muted-foreground">
            Last import: {dashboard.importReport.validRows} valid · {dashboard.importReport.invalidRows} skipped
          </p>
        )}
      </div>
    </div>
  );
}
