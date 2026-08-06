import { Router, type Request } from 'express';
import { campaignService } from '../services/campaign.service.js';
import { configService } from '../services/config.service.js';
import { logService } from '../services/log.service.js';
import { excelParserService } from '../services/excel-parser.service.js';
import { testEmailService } from '../services/test-email.service.js';
import { validateDeliverability } from '../utils/email-deliverability.js';
import { CreateCampaignSchema, LogQuerySchema, TestEmailSchema } from '../types/index.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = Router();

function getParamId(req: Request, key: string): string {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const health = await campaignService.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  })
);

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const stats = await campaignService.getDashboardStats();
    res.json(stats);
  })
);

router.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const config = await configService.loadConfig();
    res.json(config);
  })
);

router.put(
  '/config',
  asyncHandler(async (req, res) => {
    const config = await configService.updateConfig(req.body);
    res.json(config);
  })
);

router.get(
  '/import-report',
  asyncHandler(async (_req, res) => {
    const result = await excelParserService.parseFile();
    res.json(result);
  })
);

router.post(
  '/campaigns',
  asyncHandler(async (req, res) => {
    const input = CreateCampaignSchema.parse(req.body);
    const campaign = await campaignService.createCampaign(input);
    res.status(201).json(campaign);
  })
);

router.get(
  '/campaigns/:id',
  asyncHandler(async (req, res) => {
    const progress = await campaignService.getCampaignProgress(getParamId(req, 'id'));
    res.json(progress);
  })
);

router.post(
  '/campaigns/:id/pause',
  asyncHandler(async (req, res) => {
    await campaignService.pauseCampaign(getParamId(req, 'id'));
    res.json({ message: 'Campaign paused' });
  })
);

router.post(
  '/campaigns/:id/resume',
  asyncHandler(async (req, res) => {
    await campaignService.resumeCampaign(getParamId(req, 'id'));
    res.json({ message: 'Campaign resumed' });
  })
);

router.post(
  '/campaigns/:id/stop',
  asyncHandler(async (req, res) => {
    await campaignService.stopCampaign(getParamId(req, 'id'));
    res.json({ message: 'Campaign stopped' });
  })
);

router.get(
  '/campaigns/:id/preview',
  asyncHandler(async (req, res) => {
    const preview = await campaignService.previewNextEmail(getParamId(req, 'id'));
    res.json(preview);
  })
);

router.get(
  '/preview',
  asyncHandler(async (_req, res) => {
    const preview = await campaignService.previewNextEmail();
    res.json(preview);
  })
);

router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    const query = LogQuerySchema.parse(req.query);
    const result = await logService.searchLogs(query);
    res.json(result);
  })
);

router.post(
  '/test-email',
  asyncHandler(async (req, res) => {
    const input = TestEmailSchema.parse(req.body);
    const result = await testEmailService.sendTestEmail(input.to, input.attachResume);

    if (!result.success) {
      res.status(502).json({
        error: result.error ?? 'Failed to send test email',
        attachedResume: result.attachedResume,
      });
      return;
    }

    res.json({
      message: 'Test email sent successfully',
      to: input.to,
      messageId: result.messageId,
      attachedResume: result.attachedResume,
    });
  })
);

router.get(
  '/deliverability',
  asyncHandler(async (_req, res) => {
    const config = await configService.loadConfig();
    const report = validateDeliverability(config);
    res.json(report);
  })
);

export default router;
