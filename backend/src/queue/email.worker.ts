import { Worker, Job } from 'bullmq';
import { getRedisClient, QUEUE_NAME } from '../config/redis.js';
import { prisma } from '../config/database.js';
import { configService } from '../services/config.service.js';
import { templateService } from '../services/template.service.js';
import { llmService } from '../services/llm.service.js';
import { emailService } from '../services/email.service.js';
import { resumeService } from '../services/resume.service.js';
import { logService } from '../services/log.service.js';
import { logger } from '../config/logger.js';
import { CampaignStatus, LogStatus, QueueItemStatus } from '@prisma/client';
import { buildResumeFilename } from '../utils/email-deliverability.js';

interface EmailJobData {
  queueItemId: string;
  campaignId: string;
}

function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { queueItemId, campaignId } = job.data;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.status === CampaignStatus.PAUSED || campaign.status === CampaignStatus.STOPPED) {
    logger.info('Skipping job - campaign not active', { campaignId, status: campaign?.status });
    return;
  }

  const queueItem = await prisma.emailQueueItem.findUnique({
    where: { id: queueItemId },
    include: { contact: true },
  });

  if (!queueItem || queueItem.status !== QueueItemStatus.PENDING) {
    logger.info('Skipping job - queue item not pending', { queueItemId, status: queueItem?.status });
    return;
  }

  const todayStart = getTodayStart();
  if (campaign.lastSentAt && campaign.lastSentAt < todayStart) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { todaySentCount: 0 },
    });
    campaign.todaySentCount = 0;
  }

  if (campaign.todaySentCount >= campaign.dailyLimit) {
    logger.info('Daily limit reached, rescheduling', { campaignId });
    const config = await configService.loadConfig();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [h, m] = config.workingHours.start.split(':').map(Number);
    tomorrow.setHours(h, m, 0, 0);

    await prisma.emailQueueItem.update({
      where: { id: queueItemId },
      data: { scheduledAt: tomorrow },
    });

    const { getEmailQueue } = await import('./email.queue.js');
    const queue = getEmailQueue();
    const delay = tomorrow.getTime() - Date.now();
    await queue.add('send-email', { queueItemId, campaignId }, { jobId: queueItemId, delay });
    return;
  }

  await prisma.emailQueueItem.update({
    where: { id: queueItemId },
    data: { status: QueueItemStatus.PROCESSING, attempts: { increment: 1 } },
  });

  const config = await configService.loadConfig();
  const contact = queueItem.contact;

  try {
    const template = await templateService.loadTemplate();
    const variables = templateService.buildVariables(contact, campaign.jobRole);
    const rendered = templateService.renderTemplate(template, variables);
    const subject = templateService.renderSubject(config.emailSubject, variables);

    let body = rendered;
    let aiStatus = 'skipped';

    if (llmService.isConfigured()) {
      const personalized = await llmService.personalizeEmail(
        {
          recruiterName: contact.name,
          company: contact.company,
          recruiterPosition: contact.position,
          targetRole: campaign.jobRole,
          template: rendered,
        },
        config
      );
      body = personalized.body;
      aiStatus = personalized.status;
    }

    const { buffer } = await resumeService.getResumeBuffer();
    const filename = buildResumeFilename(config.smtp.fromName);

    let lastError = '';
    let sent = false;

    for (let attempt = 0; attempt <= config.retry.count; attempt++) {
      const result = await emailService.sendEmail(config, {
        to: contact.email,
        subject,
        body,
        attachment: { filename, content: buffer },
      });

      if (result.success) {
        await prisma.emailQueueItem.update({
          where: { id: queueItemId },
          data: {
            status: QueueItemStatus.SENT,
            processedAt: new Date(),
            subject,
            body,
          },
        });

        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            sentCount: { increment: 1 },
            todaySentCount: { increment: 1 },
            lastSentAt: new Date(),
          },
        });

        await logService.createLog({
          campaignId,
          contactId: contact.id,
          recipient: contact.email,
          company: contact.company,
          subject,
          status: LogStatus.SUCCESS,
          smtpResponse: result.response,
          aiStatus,
        });

        sent = true;
        logger.info('Email sent', { to: contact.email, campaignId });
        break;
      }

      lastError = result.error ?? 'Unknown error';

      if (attempt < config.retry.count && emailService.isTemporaryFailure(lastError)) {
        await logService.createLog({
          campaignId,
          contactId: contact.id,
          recipient: contact.email,
          company: contact.company,
          subject,
          status: LogStatus.RETRY,
          errorMessage: lastError,
          aiStatus,
        });
        await new Promise((r) => setTimeout(r, config.retry.delayMs));
      } else {
        break;
      }
    }

    if (!sent) {
      await prisma.emailQueueItem.update({
        where: { id: queueItemId },
        data: { status: QueueItemStatus.FAILED, lastError, processedAt: new Date() },
      });

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      });

      await logService.createLog({
        campaignId,
        contactId: contact.id,
        recipient: contact.email,
        company: contact.company,
        subject,
        status: LogStatus.FAILED,
        errorMessage: lastError,
        aiStatus,
      });

      logger.error('Email failed after retries', { to: contact.email, error: lastError });
    }

    await checkCampaignCompletion(campaignId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await prisma.emailQueueItem.update({
      where: { id: queueItemId },
      data: { status: QueueItemStatus.FAILED, lastError: message, processedAt: new Date() },
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { failedCount: { increment: 1 } },
    });

    await logService.createLog({
      campaignId,
      contactId: contact.id,
      recipient: contact.email,
      company: contact.company,
      status: LogStatus.FAILED,
      errorMessage: message,
      aiStatus: 'error',
    });

    logger.error('Email job failed', { queueItemId, error: message });
    throw error;
  }
}

async function checkCampaignCompletion(campaignId: string): Promise<void> {
  const pending = await prisma.emailQueueItem.count({
    where: {
      campaignId,
      status: { in: [QueueItemStatus.PENDING, QueueItemStatus.PROCESSING] },
    },
  });

  if (pending === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.COMPLETED, completedAt: new Date() },
    });
    logger.info('Campaign completed', { campaignId });
  }
}

export function createEmailWorker(): Worker {
  const worker = new Worker<EmailJobData>(QUEUE_NAME, processEmailJob, {
    connection: getRedisClient(),
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    logger.debug('Job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Job failed', { jobId: job?.id, error: err.message });
  });

  worker.on('error', (err) => {
    logger.error('Worker error', { error: err.message });
  });

  logger.info('Email worker started');
  return worker;
}
