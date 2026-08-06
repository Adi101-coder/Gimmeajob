'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api, type EmailLog } from '@/lib/api';
import { cn, formatDate, getInitials, getLogStatusColor } from '@/lib/utils';
import { Calendar, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';

interface FilterBarProps {
  search: string;
  status: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  activeFilterCount: number;
}

export function FilterBar({ search, status, onSearchChange, onStatusChange, activeFilterCount }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft">
      <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm">
        <Filter className="h-3.5 w-3.5" />
        Active filters ({activeFilterCount})
      </div>

      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="h-9 w-[140px] rounded-full border-border bg-surface">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="SUCCESS">Success</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
          <SelectItem value="RETRY">Retry</SelectItem>
          <SelectItem value="SKIPPED">Skipped</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        All time
      </div>

      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search recipient or company..."
          className="h-9 rounded-full border-border bg-surface pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}

type LogTab = 'all' | 'SUCCESS' | 'FAILED' | 'pending';

interface LogsListProps {
  selectedId: string | null;
  onSelect: (log: EmailLog | null) => void;
  search: string;
  status: string;
  tab: LogTab;
  onTabChange: (tab: LogTab) => void;
}

export function LogsList({ selectedId, onSelect, search, status, tab, onTabChange }: LogsListProps) {
  const [page, setPage] = useState(1);

  const effectiveStatus = tab === 'all' ? (status !== 'all' ? status : undefined) : tab === 'pending' ? undefined : tab;

  const { data, isLoading } = useQuery({
    queryKey: ['logs', search, effectiveStatus, page],
    queryFn: () =>
      api.getLogs({
        search: search || undefined,
        status: effectiveStatus,
        page,
        limit: 20,
      }),
    refetchInterval: 10000,
  });

  const tabs: { id: LogTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All emails' },
    { id: 'pending', label: 'Pending' },
    { id: 'SUCCESS', label: 'Sent' },
    { id: 'FAILED', label: 'Failed' },
  ];

  const logs = data?.logs ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 border-b border-white/10 px-4 py-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
              tab === t.id ? 'bg-primary text-primary-foreground' : 'text-white/60 hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-white/50">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/50">No emails found</p>
        ) : (
          logs.map((log) => (
            <button
              key={log.id}
              onClick={() => onSelect(log)}
              className={cn(
                'mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all',
                selectedId === log.id ? 'bg-white/15' : 'hover:bg-white/8'
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                {getInitials(log.contact?.name ?? log.recipient)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">
                    {log.contact?.name ?? log.recipient}
                  </span>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', getLogStatusColor(log.status))}>
                    {log.status}
                  </span>
                </div>
                <p className="truncate text-xs text-white/50">{log.company}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-white/80">
                {log.status === 'SUCCESS' ? '✓' : '—'}
              </span>
            </button>
          ))
        )}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <span className="text-xs text-white/50">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LogsPanelWrapper({
  selectedId,
  onSelect,
  search,
  status,
  tab,
  onTabChange,
}: LogsListProps) {
  return (
    <LogsList
      selectedId={selectedId}
      onSelect={onSelect}
      search={search}
      status={status}
      tab={tab}
      onTabChange={onTabChange}
    />
  );
}
