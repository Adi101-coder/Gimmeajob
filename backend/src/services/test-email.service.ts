import { configService } from './config.service.js';
import { emailService } from './email.service.js';
import { resumeService } from './resume.service.js';
import { templateService } from './template.service.js';
import { logger } from '../config/logger.js';
import { buildResumeFilename } from '../utils/email-deliverability.js';

export interface TestEmailResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
  attachedResume: boolean;
}

export class TestEmailService {
  async sendTestEmail(to: string, attachResume = true): Promise<TestEmailResult> {
    const config = await configService.loadConfig();
    const template = await templateService.loadTemplate(true);
    const variables = templateService.buildVariables(
      { name: 'Hiring Manager', company: 'Sample Company', position: 'Recruiter' },
      'Junior Software Engineer'
    );
    const body = templateService.renderTemplate(template, variables);
    const subject = templateService.renderSubject(config.emailSubject, variables);

    let attachment: { filename: string; content: Buffer } | undefined;

    if (attachResume) {
      const resume = await resumeService.getResumeBuffer();
      attachment = {
        filename: buildResumeFilename(config.smtp.fromName),
        content: resume.buffer,
      };
    }

    const result = await emailService.sendEmail(config, {
      to,
      subject,
      body,
      attachment,
    });

    if (result.success) {
      logger.info('Test email sent', { to, attachResume });
    } else {
      logger.warn('Test email failed', { to, error: result.error });
    }

    return {
      success: result.success,
      messageId: result.messageId,
      response: result.response,
      error: result.error,
      attachedResume: attachResume && !!attachment,
    };
  }
}

export const testEmailService = new TestEmailService();
