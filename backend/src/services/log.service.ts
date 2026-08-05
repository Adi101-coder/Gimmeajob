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
}

export const logService = new LogService();
