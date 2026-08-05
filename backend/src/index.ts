import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger } from './config/logger.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { campaignService } from './services/campaign.service.js';
import { CampaignStatus } from '@prisma/client';
import { prisma } from './config/database.js';

const app = express();

app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

async function resumeScheduledCampaigns(): Promise<void> {
  const scheduled = await prisma.campaign.findMany({
    where: { status: { in: [CampaignStatus.SCHEDULED, CampaignStatus.RUNNING] } },
  });

  for (const campaign of scheduled) {
    if (campaign.mode === 'schedule' && campaign.status === CampaignStatus.SCHEDULED) {
      const startDate = campaign.scheduledDate ?? new Date();
      if (campaign.scheduledTime) {
        const [h, m] = campaign.scheduledTime.split(':').map(Number);
        startDate.setHours(h, m, 0, 0);
      }
      if (startDate <= new Date()) {
        await campaignService.activateCampaign(campaign.id);
        logger.info('Activated scheduled campaign on startup', { campaignId: campaign.id });
      }
    } else if (campaign.status === CampaignStatus.RUNNING) {
      await campaignService.activateCampaign(campaign.id);
      logger.info('Resumed running campaign on startup', { campaignId: campaign.id });
    }
  }
}

async function start(): Promise<void> {
  await connectDatabase();
  await resumeScheduledCampaigns();

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
}

start().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

export default app;
