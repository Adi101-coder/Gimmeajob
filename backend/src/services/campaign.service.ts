import { env, paths } from '../config/env.js';
import { prisma } from '../config/database.js';
import { configService } from './config.service.js';
import { excelParserService } from './excel-parser.service.js';
import { templateService } from './template.service.js';
import { resumeService } from './resume.service.js';
import { llmService } from './llm.service.js';
import { emailService } from './email.service.js';
import { logger } from '../config/logger.js';
import type { AppConfig, CreateCampaignInput, EmailPreview } from '../types/index.js';
import { emailsRemainingToday, isUnlimitedDailyLimit } from '../utils/daily-limit.js';
import { CampaignStatus, LogStatus, QueueItemStatus } from '@prisma/client';

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function randomDelay(minSeconds: number, maxSeconds: number): number {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
}

function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export class SchedulerService {
  computeScheduleTimes(
    count: number,
    config: AppConfig,
    startFrom?: Date
  ): Date[] {
    const now = startFrom ?? new Date();
    const { start, end } = config.workingHours;
    const startMinutes = parseTimeToMinutes(start);
    const endMinutes = parseTimeToMinutes(end);
    const windowMinutes = endMinutes - startMinutes;

    if (windowMinutes <= 0) {
      throw new Error('Invalid working hours configuration');
    }

    const times: Date[] = [];
    let currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let index = 0;

    while (times.length < count) {
      const dayStart = new Date(currentDay);
      dayStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

      const dayEnd = new Date(currentDay);
      dayEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

      const dayCap = isUnlimitedDailyLimit(config.dailyEmailLimit)
        ? count - times.length
        : config.dailyEmailLimit;
      const emailsForDay = Math.min(count - times.length, dayCap);
      const intervalMs = (windowMinutes * 60 * 1000) / Math.max(emailsForDay, 1);

      for (let i = 0; i < emailsForDay && times.length < count; i++) {
        const scheduled = new Date(dayStart.getTime() + i * intervalMs);
        const jitter = randomDelay(
          config.randomDelay.minSeconds,
          config.randomDelay.maxSeconds
        ) / 10;
        scheduled.setTime(scheduled.getTime() + jitter);

        if (scheduled > dayEnd) {
          scheduled.setTime(dayEnd.getTime() - 60000);
        }

        if (scheduled <= now) {
          scheduled.setTime(now.getTime() + (index + 1) * 60000);
        }

        times.push(new Date(scheduled));
        index++;
      }

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return times;
  }

  /** Send-now mode: short gaps between emails (randomDelay), no daily cap. */
  computeImmediateScheduleTimes(count: number, config: AppConfig, startFrom?: Date): Date[] {
    const now = startFrom ?? new Date();
    const times: Date[] = [];
    let cursor = now.getTime();

    for (let i = 0; i < count; i++) {
      if (times.length > 0) {
        cursor += randomDelay(config.randomDelay.minSeconds, config.randomDelay.maxSeconds);
      }
      times.push(new Date(cursor));
    }

    return times;
  }

  async syncContacts(): Promise<string[]> {
    const result = await excelParserService.parseFile();

    await prisma.importReport.create({
      data: {
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        duplicateRows: result.duplicateRows,
        errors: result.errors as object[],
      },
    });

    const currentEmails = result.contacts.map((contact) => contact.email);

    for (const contact of result.contacts) {
      await prisma.contact.upsert({
        where: { email: contact.email },
        create: {
          name: contact.name,
          company: contact.company,
          position: contact.position,
          email: contact.email,
          isValid: true,
        },
        update: {
          name: contact.name,
          company: contact.company,
          position: contact.position,
          isValid: true,
        },
      });
    }

    if (currentEmails.length === 0) {
      await prisma.contact.updateMany({ data: { isValid: false } });
    } else {
      await prisma.contact.updateMany({
        where: { email: { notIn: currentEmails } },
        data: { isValid: false },
      });
    }

    return currentEmails;
  }
}

export class CampaignService {
  private scheduler = new SchedulerService();

  async getDashboardStats() {
    const config = await configService.loadConfig();
    const todayStart = getTodayStart();

    const [activeCampaign, todayLogs, totalContacts, lastImport, totalSentAllTime] = await Promise.all([
      prisma.campaign.findFirst({
        where: { status: { in: [CampaignStatus.RUNNING, CampaignStatus.PAUSED, CampaignStatus.SCHEDULED] } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.emailLog.count({
        where: { sentAt: { gte: todayStart }, status: LogStatus.SUCCESS },
      }),
      prisma.contact.count({ where: { isValid: true } }),
      prisma.importReport.findFirst({ orderBy: { createdAt: 'desc' } }),
      prisma.emailLog.count({ where: { status: LogStatus.SUCCESS } }),
    ]);

    const dailyLimit = activeCampaign?.dailyLimit ?? config.dailyEmailLimit;
    const todaySent = activeCampaign?.todaySentCount ?? todayLogs;
    const emailsRemaining = emailsRemainingToday(dailyLimit, todaySent);

    return {
      activeCampaign: activeCampaign ? this.formatProgress(activeCampaign, emailsRemaining) : null,
      todaySent,
      dailyLimit,
      emailsRemaining,
      totalContacts,
      totalSentAllTime,
      importReport: lastImport
        ? {
            totalRows: lastImport.totalRows,
            validRows: lastImport.validRows,
            invalidRows: lastImport.invalidRows,
            duplicateRows: lastImport.duplicateRows,
            lastImportedAt: lastImport.createdAt.toISOString(),
          }
        : null,
    };
  }

  private formatProgress(
    campaign: {
      id: string;
      jobRole: string;
      status: CampaignStatus;
      totalContacts: number;
      sentCount: number;
      failedCount: number;
      skippedCount: number;
      todaySentCount: number;
      dailyLimit: number;
      startedAt: Date | null;
      completedAt: Date | null;
    },
    emailsRemaining: number | null
  ) {
    return {
      id: campaign.id,
      jobRole: campaign.jobRole,
      status: campaign.status,
      totalContacts: campaign.totalContacts,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      skippedCount: campaign.skippedCount,
      todaySentCount: campaign.todaySentCount,
      dailyLimit: campaign.dailyLimit,
      emailsRemaining,
      startedAt: campaign.startedAt?.toISOString() ?? null,
      completedAt: campaign.completedAt?.toISOString() ?? null,
    };
  }

  async createCampaign(input: CreateCampaignInput) {
    const config = await configService.loadConfig();

    await this.validatePrerequisites();

    const currentEmails = await this.scheduler.syncContacts();
    if (currentEmails.length === 0) {
      throw new Error('No valid contacts found in Excel file');
    }

    const sheetContacts = await prisma.contact.findMany({
      where: { isValid: true, email: { in: currentEmails } },
    });

    const alreadySent = await prisma.emailLog.findMany({
      where: {
        status: LogStatus.SUCCESS,
        contactId: { in: sheetContacts.map((contact) => contact.id) },
      },
      select: { contactId: true },
      distinct: ['contactId'],
    });
    const alreadySentIds = new Set(alreadySent.map((log) => log.contactId));
    const contacts = sheetContacts.filter((contact) => !alreadySentIds.has(contact.id));

    if (contacts.length === 0) {
      throw new Error(
        'No new contacts to email. Everyone in the current spreadsheet has already been emailed.'
      );
    }

    const dailyLimit = config.dailyEmailLimit;
    const scheduledDate = input.scheduledDate ? new Date(input.scheduledDate) : null;

    const campaign = await prisma.campaign.create({
      data: {
        jobRole: input.jobRole,
        dailyLimit,
        mode: input.mode,
        scheduledDate,
        scheduledTime: input.scheduledTime ?? config.defaultSchedule.time,
        status: input.mode === 'immediate' ? CampaignStatus.RUNNING : CampaignStatus.SCHEDULED,
        totalContacts: contacts.length,
        startedAt: input.mode === 'immediate' ? new Date() : null,
      },
    });

    let scheduleTimes: Date[];
    if (input.mode === 'immediate') {
      scheduleTimes = this.scheduler.computeImmediateScheduleTimes(contacts.length, config);
    } else {
      const startDate = scheduledDate ?? new Date();
      if (input.scheduledTime) {
        const [h, m] = input.scheduledTime.split(':').map(Number);
        startDate.setHours(h, m, 0, 0);
      }
      scheduleTimes = this.scheduler.computeScheduleTimes(
        contacts.length,
        { ...config, dailyEmailLimit: dailyLimit },
        startDate
      );
    }

    await prisma.emailQueueItem.createMany({
      data: contacts.map((contact, i) => ({
        campaignId: campaign.id,
        contactId: contact.id,
        status: QueueItemStatus.PENDING,
        scheduledAt: scheduleTimes[i],
      })),
    });

    if (input.mode === 'immediate') {
      await this.activateCampaign(campaign.id);
    }

    logger.info('Campaign created', { campaignId: campaign.id, contacts: contacts.length });
    return campaign;
  }

  async activateCampaign(campaignId: string) {
    const { getEmailQueue } = await import('../queue/email.queue.js');
    const queue = getEmailQueue();

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    const pendingItems = await prisma.emailQueueItem.findMany({
      where: { campaignId, status: QueueItemStatus.PENDING },
      orderBy: { scheduledAt: 'asc' },
    });

    for (const item of pendingItems) {
      const delay = item.scheduledAt
        ? Math.max(0, item.scheduledAt.getTime() - Date.now())
        : 0;

      await queue.add(
        'send-email',
        { queueItemId: item.id, campaignId },
        {
          jobId: item.id,
          delay,
          attempts: 1,
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );
    }
  }

  async pauseCampaign(campaignId: string) {
    const { getEmailQueue } = await import('../queue/email.queue.js');
    const queue = getEmailQueue();

    const items = await prisma.emailQueueItem.findMany({
      where: { campaignId, status: QueueItemStatus.PENDING },
    });

    for (const item of items) {
      const job = await queue.getJob(item.id);
      if (job) {
        await job.remove();
      }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.PAUSED, pausedAt: new Date() },
    });

    logger.info('Campaign paused', { campaignId });
  }

  async resumeCampaign(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error('Campaign not found');

    const config = await configService.loadConfig();

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.RUNNING,
        pausedAt: null,
        dailyLimit: config.dailyEmailLimit,
      },
    });

    await this.activateCampaign(campaignId);
    logger.info('Campaign resumed', { campaignId });
  }

  async stopCampaign(campaignId: string) {
    const { getEmailQueue } = await import('../queue/email.queue.js');
    const queue = getEmailQueue();

    const items = await prisma.emailQueueItem.findMany({
      where: {
        campaignId,
        status: { in: [QueueItemStatus.PENDING, QueueItemStatus.PROCESSING] },
      },
    });

    for (const item of items) {
      const job = await queue.getJob(item.id);
      if (job) await job.remove();
    }

    await prisma.emailQueueItem.updateMany({
      where: { campaignId, status: QueueItemStatus.PENDING },
      data: { status: QueueItemStatus.CANCELLED },
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.STOPPED, completedAt: new Date() },
    });

    logger.info('Campaign stopped', { campaignId });
  }

  async getCampaignProgress(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error('Campaign not found');

    const emailsRemaining = emailsRemainingToday(campaign.dailyLimit, campaign.todaySentCount);
    return this.formatProgress(campaign, emailsRemaining);
  }

  async previewNextEmail(campaignId?: string): Promise<EmailPreview | null> {
    const config = await configService.loadConfig();

    let campaign;
    if (campaignId) {
      campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    } else {
      campaign = await prisma.campaign.findFirst({
        where: { status: { in: [CampaignStatus.RUNNING, CampaignStatus.SCHEDULED, CampaignStatus.PAUSED] } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!campaign) {
      const contact = await prisma.contact.findFirst({ where: { isValid: true } });
      const previewContact = contact ?? {
        name: 'Recruiter',
        email: 'recruiter@example.com',
        company: 'your company',
        position: 'Recruiter',
      };

      const template = await templateService.loadTemplate(true);
      const variables = templateService.buildVariables(previewContact, 'Full Stack Developer');
      const rendered = templateService.renderTemplate(template, variables);
      const subject = templateService.renderSubject(config.emailSubject, variables);

      if (contact && llmService.isConfigured()) {
        const personalized = await llmService.personalizeEmail(
          {
            recruiterName: previewContact.name,
            company: previewContact.company,
            recruiterPosition: previewContact.position,
            targetRole: 'Full Stack Developer',
            template: rendered,
          },
          config
        );
        return {
          recipient: previewContact.email,
          company: previewContact.company,
          subject,
          body: personalized.body,
          contactName: previewContact.name,
        };
      }

      return {
        recipient: previewContact.email,
        company: previewContact.company,
        subject,
        body: rendered,
        contactName: previewContact.name,
      };
    }

    const nextItem = await prisma.emailQueueItem.findFirst({
      where: { campaignId: campaign.id, status: QueueItemStatus.PENDING },
      orderBy: { scheduledAt: 'asc' },
      include: { contact: true },
    });

    if (!nextItem) return null;

    const template = await templateService.loadTemplate();
    const variables = templateService.buildVariables(nextItem.contact, campaign.jobRole);
    const rendered = templateService.renderTemplate(template, variables);
    const subject = templateService.renderSubject(config.emailSubject, variables);

    let body = rendered;
    if (llmService.isConfigured()) {
      const personalized = await llmService.personalizeEmail(
        {
          recruiterName: nextItem.contact.name,
          company: nextItem.contact.company,
          recruiterPosition: nextItem.contact.position,
          targetRole: campaign.jobRole,
          template: rendered,
        },
        config
      );
      body = personalized.body;
    }

    return {
      recipient: nextItem.contact.email,
      company: nextItem.contact.company,
      subject,
      body,
      contactName: nextItem.contact.name,
    };
  }

  async validatePrerequisites() {
    const [excelExists, templateExists, resumeExists] = await Promise.all([
      excelParserService.fileExists(),
      templateService.templateExists(),
      resumeService.resumeExists(),
    ]);

    const errors: string[] = [];
    if (!excelExists) errors.push(`Excel file (${paths.excelFile()}) not found`);
    if (!templateExists) errors.push('Email template (templates/email_template.txt) not found');
    if (!resumeExists) errors.push(`Resume (resumes/${env.resumeFilename}) not found`);

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
  }

  async getHealthStatus() {
    const [excelExists, templateExists, resumeExists] = await Promise.all([
      excelParserService.fileExists(),
      templateService.templateExists(),
      resumeService.resumeExists(),
    ]);

    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    return {
      status: dbOk && excelExists && templateExists && resumeExists ? 'healthy' : 'degraded',
      database: dbOk,
      excel: excelExists,
      template: templateExists,
      resume: resumeExists,
      smtp: emailService.isConfigured(),
      llm: llmService.isConfigured(),
    };
  }
}

export const campaignService = new CampaignService();
export const schedulerService = new SchedulerService();
