import { configService } from './config.service.js';
import { emailService } from './email.service.js';
import { resumeService } from './resume.service.js';
import { logger } from '../config/logger.js';

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

    const subject = 'GimmeAJob — SMTP Test Email';
    const body = [
      'Hello,',
      '',
      'This is a test email from GimmeAJob.',
      '',
      'If you received this message, your SMTP configuration is working correctly.',
      attachResume ? 'Your resume was attached to confirm attachments work too.' : 'No resume was attached for this test.',
      '',
      `Sent at: ${new Date().toLocaleString('en-US', { timeZone: config.workingHours.timezone })}`,
      '',
      '— GimmeAJob',
    ].join('\n');

    let attachment: { filename: string; content: Buffer } | undefined;

    if (attachResume) {
      const resume = await resumeService.getResumeBuffer();
      attachment = { filename: resume.filename, content: resume.buffer };
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
