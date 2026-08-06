const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface DashboardStats {
  activeCampaign: CampaignProgress | null;
  todaySent: number;
  dailyLimit: number;
  emailsRemaining: number;
  totalContacts: number;
  importReport: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    lastImportedAt: string | null;
  } | null;
}

export interface CampaignProgress {
  id: string;
  jobRole: string;
  status: string;
  totalContacts: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  todaySentCount: number;
  dailyLimit: number;
  emailsRemaining: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface EmailPreview {
  recipient: string;
  company: string;
  subject: string;
  body: string;
  contactName: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  company: string;
  subject: string | null;
  status: string;
  smtpResponse: string | null;
  aiStatus: string | null;
  errorMessage: string | null;
  sentAt: string;
  contact?: { name: string; position: string };
}

export interface AppConfig {
  dailyEmailLimit: number;
  workingHours: { start: string; end: string; timezone: string };
  defaultSchedule: { mode: string; time: string };
  smtp: { host: string; port: number; secure: boolean; fromName: string; fromEmail: string };
  llm: { model: string; temperature: number; maxTokens: number };
  retry: { count: number; delayMs: number };
  randomDelay: { minSeconds: number; maxSeconds: number };
  emailSubject: string;
}

export interface CreateCampaignInput {
  jobRole: string;
  dailyLimit?: number;
  mode: 'immediate' | 'schedule';
  scheduledDate?: string;
  scheduledTime?: string;
}

export const api = {
  getDashboard: () => fetchApi<DashboardStats>('/dashboard'),
  getConfig: () => fetchApi<AppConfig>('/config'),
  updateConfig: (config: Partial<AppConfig>) =>
    fetchApi<AppConfig>('/config', { method: 'PUT', body: JSON.stringify(config) }),
  getHealth: () => fetchApi<Record<string, unknown>>('/health'),
  createCampaign: (input: CreateCampaignInput) =>
    fetchApi<{ id: string }>('/campaigns', { method: 'POST', body: JSON.stringify(input) }),
  pauseCampaign: (id: string) =>
    fetchApi<{ message: string }>(`/campaigns/${id}/pause`, { method: 'POST' }),
  resumeCampaign: (id: string) =>
    fetchApi<{ message: string }>(`/campaigns/${id}/resume`, { method: 'POST' }),
  stopCampaign: (id: string) =>
    fetchApi<{ message: string }>(`/campaigns/${id}/stop`, { method: 'POST' }),
  getCampaignProgress: (id: string) => fetchApi<CampaignProgress>(`/campaigns/${id}`),
  previewEmail: (campaignId?: string) =>
    fetchApi<EmailPreview | null>(campaignId ? `/campaigns/${campaignId}/preview` : '/preview'),
  getLogs: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return fetchApi<{ logs: EmailLog[]; pagination: { page: number; total: number; totalPages: number } }>(
      `/logs?${query.toString()}`
    );
  },
  getImportReport: () =>
    fetchApi<{
      totalRows: number;
      validRows: number;
      invalidRows: number;
      duplicateRows: number;
      errors: Array<{ row: number; reason: string; email?: string }>;
    }>('/import-report'),
  sendTestEmail: (input: { to: string; attachResume?: boolean }) =>
    fetchApi<{ message: string; to: string; messageId?: string; attachedResume: boolean }>(
      '/test-email',
      { method: 'POST', body: JSON.stringify(input) }
    ),
};
