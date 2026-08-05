'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Eye, RefreshCw } from 'lucide-react';

export function EmailPreview() {
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 5000,
  });

  const campaignId = dashboard?.activeCampaign?.id;

  const { data: preview, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['preview', campaignId],
    queryFn: () => api.previewEmail(campaignId),
    enabled: true,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Preview Next Email
            </CardTitle>
            <CardDescription>AI-personalized preview of the next email to be sent</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Generating preview...</p>
        ) : !preview ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No contacts available for preview
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20 shrink-0">To:</span>
                <span>{preview.recipient}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20 shrink-0">Company:</span>
                <span>{preview.company}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-20 shrink-0">Subject:</span>
                <span className="font-medium">{preview.subject}</span>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{preview.body}</pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Resume.pdf will be attached automatically
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
