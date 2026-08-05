'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { getStatusColor } from '@/lib/utils';
import { Mail, Users, CheckCircle, XCircle, Clock } from 'lucide-react';

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

  const stats = [
    {
      title: "Today's Progress",
      value: `${dashboard?.todaySent ?? 0} / ${dashboard?.dailyLimit ?? 0}`,
      icon: Mail,
      description: 'Emails sent today',
    },
    {
      title: 'Emails Remaining',
      value: String(dashboard?.emailsRemaining ?? 0),
      icon: Clock,
      description: 'Remaining today',
    },
    {
      title: 'Total Contacts',
      value: String(dashboard?.totalContacts ?? 0),
      icon: Users,
      description: 'Valid recruiters loaded',
    },
    {
      title: 'Campaign Sent',
      value: campaign ? `${campaign.sentCount}/${campaign.totalContacts}` : '—',
      icon: CheckCircle,
      description: campaign ? `${campaign.failedCount} failed` : 'No active campaign',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaign && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Campaign Status</CardTitle>
              <span className={`text-sm font-semibold ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Role: {campaign.jobRole}</span>
              <span>{progress}% complete</span>
            </div>
            <Progress value={progress} />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-400" />
                {campaign.sentCount} sent
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-400" />
                {campaign.failedCount} failed
              </span>
              <span>{campaign.skippedCount} skipped</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
