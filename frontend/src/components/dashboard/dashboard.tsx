'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { TopNav, type NavTab } from '@/components/dashboard/top-nav';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { CampaignHeader, CampaignFormPanel } from '@/components/dashboard/campaign-form';
import { EmailPreview } from '@/components/dashboard/email-preview';
import { FilterBar, LogsPanelWrapper } from '@/components/dashboard/logs-panel';
import { SettingsPanel } from '@/components/dashboard/settings-panel';
import { Toaster } from '@/components/ui/use-toast';
import type { EmailLog } from '@/lib/api';

export function Dashboard() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5000, retry: 1 },
        },
      })
  );

  const [activeTab, setActiveTab] = useState<NavTab>('campaign');
  const [showForm, setShowForm] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [logTab, setLogTab] = useState<'all' | 'SUCCESS' | 'FAILED' | 'pending'>('all');

  const activeFilterCount = (search ? 1 : 0) + (status !== 'all' ? 1 : 0);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <TopNav activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
          {activeTab === 'campaign' && (
            <>
              <CampaignHeader showForm={showForm} onToggleForm={() => setShowForm((v) => !v)} />

              {showForm && <CampaignFormPanel />}

              <StatsCards />

              <FilterBar
                search={search}
                status={status}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                activeFilterCount={activeFilterCount}
              />

              {/* Dark split panel — like invoice list + detail */}
              <div className="overflow-hidden rounded-3xl bg-panel shadow-panel">
                <div className="grid min-h-[560px] lg:grid-cols-[340px_1fr]">
                  <div className="border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
                    <LogsPanelWrapper
                      selectedId={selectedLog?.id ?? null}
                      onSelect={setSelectedLog}
                      search={search}
                      status={status}
                      tab={logTab}
                      onTabChange={setLogTab}
                    />
                  </div>
                  <EmailPreview selectedLog={selectedLog} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'logs' && (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold tracking-tight">Email Logs</h1>
              </div>

              <FilterBar
                search={search}
                status={status}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                activeFilterCount={activeFilterCount}
              />

              <div className="overflow-hidden rounded-3xl bg-panel shadow-panel">
                <div className="grid min-h-[600px] lg:grid-cols-[380px_1fr]">
                  <div className="border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
                    <LogsPanelWrapper
                      selectedId={selectedLog?.id ?? null}
                      onSelect={setSelectedLog}
                      search={search}
                      status={status}
                      tab={logTab}
                      onTabChange={setLogTab}
                    />
                  </div>
                  <EmailPreview selectedLog={selectedLog} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
