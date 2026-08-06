'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { api, type EmailLog } from '@/lib/api';
import { cn, formatDate, getInitials, getLogStatusColor } from '@/lib/utils';
import { Calendar, Edit3, RefreshCw, Send } from 'lucide-react';

interface EmailPreviewProps {
  selectedLog: EmailLog | null;
}

export function EmailPreview({ selectedLog }: EmailPreviewProps) {
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 5000,
  });

  const campaignId = dashboard?.activeCampaign?.id;

  const { data: preview, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['preview', campaignId],
    queryFn: () => api.previewEmail(campaignId),
    enabled: !selectedLog,
  });

  const display = selectedLog
    ? {
        recipient: selectedLog.recipient,
        company: selectedLog.company,
        subject: selectedLog.subject ?? 'No subject',
        body: selectedLog.errorMessage ?? 'Email sent successfully. Body not stored for sent emails.',
        contactName: selectedLog.contact?.name ?? selectedLog.recipient,
        status: selectedLog.status,
        sentAt: selectedLog.sentAt,
      }
    : preview
      ? { ...preview, status: 'PREVIEW', sentAt: null }
      : null;

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-white">
              {selectedLog ? selectedLog.recipient : 'Next email'}
            </h3>
            {display && (
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', getLogStatusColor(display.status ?? 'SKIPPED'))}>
                {display.status}
              </span>
            )}
          </div>
          {display && (
            <p className="mt-1 text-sm text-white/50">{display.company}</p>
          )}
        </div>
        {!selectedLog && (
          <Button variant="ghost" size="icon" className="text-white/60 hover:bg-white/10 hover:text-white" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        )}
      </div>

      {isLoading && !selectedLog ? (
        <p className="flex flex-1 items-center justify-center text-sm text-white/50">Generating preview...</p>
      ) : !display ? (
        <p className="flex flex-1 items-center justify-center text-sm text-white/50">No preview available</p>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {getInitials(display.contactName)}
            </div>
            <div>
              <p className="font-medium text-white">{display.contactName}</p>
              <p className="text-sm text-white/50">{display.company}</p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Recipient', value: display.recipient.split('@')[0] },
              { label: 'Company', value: display.company.slice(0, 12) },
              { label: 'Subject', value: (display.subject ?? '').slice(0, 12) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/8 p-3">
                <p className="text-[10px] uppercase tracking-wide text-white/40">{item.label}</p>
                <p className="mt-1 truncate text-sm font-medium text-white">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto rounded-2xl bg-white/5 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">Email body</p>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80">{display.body}</pre>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white">
                <Edit3 className="h-4 w-4" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white">
                <Calendar className="h-4 w-4" />
              </button>
            </div>
            {!selectedLog && (
              <p className="text-xs text-white/40">Resume.pdf attached automatically</p>
            )}
            {selectedLog && display.sentAt && (
              <p className="text-xs text-white/40">{formatDate(display.sentAt)}</p>
            )}
            {!selectedLog && (
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Ready to send
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
