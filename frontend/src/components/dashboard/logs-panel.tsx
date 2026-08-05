'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { getLogStatusColor, formatDate } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function LogsPanel() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['logs', search, status, page],
    queryFn: () =>
      api.getLogs({
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        page,
        limit: 15,
      }),
    refetchInterval: 10000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Logs</CardTitle>
        <CardDescription>Searchable history of all sent and failed emails</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by recipient, company..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="RETRY">Retry</SelectItem>
              <SelectItem value="SKIPPED">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading logs...</p>
        ) : !data?.logs.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No logs found</p>
        ) : (
          <div className="space-y-2">
            {data.logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{log.recipient}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getLogStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate">
                    {log.company}
                    {log.contact?.name && ` · ${log.contact.name}`}
                  </p>
                  {log.errorMessage && (
                    <p className="text-destructive text-xs truncate">{log.errorMessage}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(log.sentAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
