import { z } from 'zod';

export const WorkingHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1),
});

export const AppConfigSchema = z.object({
  dailyEmailLimit: z.number().int().positive(),
  workingHours: WorkingHoursSchema,
  defaultSchedule: z.object({
    mode: z.enum(['immediate', 'schedule']),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  smtp: z.object({
    host: z.string().min(1),
    port: z.number().int().positive(),
    secure: z.boolean(),
    fromName: z.string().min(1),
    fromEmail: z.string().email(),
  }),
  llm: z.object({
    model: z.string().min(1),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().positive(),
  }),
  retry: z.object({
    count: z.number().int().min(0),
    delayMs: z.number().int().min(0),
  }),
  randomDelay: z.object({
    minSeconds: z.number().int().min(0),
    maxSeconds: z.number().int().positive(),
  }),
  emailSubject: z.string().min(1),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const CreateCampaignSchema = z.object({
  jobRole: z.string().min(1, 'Job role is required'),
  dailyLimit: z.number().int().positive().optional(),
  mode: z.enum(['immediate', 'schedule']),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const LogQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['SUCCESS', 'FAILED', 'SKIPPED', 'RETRY']).optional(),
  campaignId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export interface ExcelRow {
  Name: string;
  Company: string;
  Position: string;
  Email: string;
}

export interface ParsedContact {
  name: string;
  company: string;
  position: string;
  email: string;
}

export interface ValidationError {
  row: number;
  email?: string;
  reason: string;
}

export interface ImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  contacts: ParsedContact[];
  errors: ValidationError[];
}

export interface TemplateVariables {
  HR_NAME: string;
  COMPANY_NAME: string;
  POSITION: string;
  JOB_ROLE: string;
  TODAY: string;
}

export interface EmailPreview {
  recipient: string;
  company: string;
  subject: string;
  body: string;
  contactName: string;
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
