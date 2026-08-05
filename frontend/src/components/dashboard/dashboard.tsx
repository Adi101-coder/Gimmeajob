'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { CampaignForm } from '@/components/dashboard/campaign-form';
import { EmailPreview } from '@/components/dashboard/email-preview';
import { LogsPanel } from '@/components/dashboard/logs-panel';
import { SettingsPanel } from '@/components/dashboard/settings-panel';
import { Toaster } from '@/components/ui/use-toast';
import { Briefcase } from 'lucide-react';

export function Dashboard() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5000, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">GimmeAJob</h1>
              <p className="text-xs text-muted-foreground">Personal Job Application Assistant</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          <StatsCards />

          <div className="grid gap-6 lg:grid-cols-2">
            <CampaignForm />
            <EmailPreview />
          </div>

          <Tabs defaultValue="logs" className="w-full">
            <TabsList>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="logs">
              <LogsPanel />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
