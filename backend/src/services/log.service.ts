import { prisma } from '../config/database.js';
import type { LogStatus } from '@prisma/client';
import type { LogQuerySchema } from '../types/index.js';
import type { z } from 'zod';

type LogQuery = z.infer<typeof LogQuerySchema>;

export class LogService {
  async createLog(data: {
    campaignId: string;
    contactId: string;
    recipient: string;
    company: string;
    subject?: string;
    status: LogStatus;
    smtpResponse?: string;
    aiStatus?: string;
    errorMessage?: string;
  }) {
    return prisma.emailLog.create({ data });
  }

  async searchLogs(query: LogQuery) {
    const { search, status, campaignId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (search) {
      where.OR = [
        { recipient: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { errorMessage: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        include: {
          contact: { select: { name: true, position: true } },
        },
      }),
      prisma.emailLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRecentLogs(campaignId: string, limit = 50) {
    return prisma.emailLog.findMany({
      where: { campaignId },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }

  async getSummary() {
    const [totalSuccess, totalFailed, totalRetry] = await Promise.all([
      prisma.emailLog.count({ where: { status: 'SUCCESS' } }),
      prisma.emailLog.count({ where: { status: 'FAILED' } }),
      prisma.emailLog.count({ where: { status: 'RETRY' } }),
    ]);
    return { totalSuccess, totalFailed, totalRetry };
  }

  async exportSuccessCsv(): Promise<string> {
    const logs = await prisma.emailLog.findMany({
      where: { status: 'SUCCESS' },
      orderBy: { sentAt: 'asc' },
      include: { contact: { select: { name: true, position: true } } },
    });

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = 'sentAt,recipient,name,company,position,subject,campaignId,smtpResponse';
    const rows = logs.map((log) =>
      [
        log.sentAt.toISOString(),
        escape(log.recipient),
        escape(log.contact?.name ?? ''),
        escape(log.company),
        escape(log.contact?.position ?? ''),
        escape(log.subject ?? ''),
        log.campaignId,
        escape(log.smtpResponse ?? ''),
      ].join(',')
    );
    return [header, ...rows].join('\n');
  }
}

export const logService = new LogService();
