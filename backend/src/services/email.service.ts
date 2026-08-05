import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer/index.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { AppConfig } from '../types/index.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  attachment?: {
    filename: string;
    content: Buffer;
    contentType?: string;
  };
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private lastConfigHash: string = '';

  private buildTransporter(config: AppConfig): Transporter {
    const configHash = JSON.stringify({ smtp: config.smtp, user: env.smtpUser });
    if (this.transporter && this.lastConfigHash === configHash) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPassword,
      },
    });
    this.lastConfigHash = configHash;
    return this.transporter;
  }

  async verifyConnection(config: AppConfig): Promise<boolean> {
    try {
      const transport = this.buildTransporter(config);
      await transport.verify();
      return true;
    } catch (error) {
      logger.error('SMTP verification failed', { error });
      return false;
    }
  }

  async sendEmail(config: AppConfig, options: SendEmailOptions): Promise<SendEmailResult> {
    if (!env.smtpUser || !env.smtpPassword) {
      return {
        success: false,
        error: 'SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD in environment.',
      };
    }

    try {
      const transport = this.buildTransporter(config);
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.body,
      };

      if (options.attachment) {
        mailOptions.attachments = [
          {
            filename: options.attachment.filename,
            content: options.attachment.content,
            contentType: options.attachment.contentType ?? 'application/pdf',
          },
        ];
      }

      const info = await transport.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: options.to,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      logger.error('Failed to send email', { to: options.to, error: message });
      return { success: false, error: message };
    }
  }

  isTemporaryFailure(error: string): boolean {
    const temporaryPatterns = [
      /timeout/i,
      /connection/i,
      /ECONNRESET/i,
      /ETIMEDOUT/i,
      /421/i,
      /450/i,
      /451/i,
      /452/i,
      /temporary/i,
      /rate limit/i,
      /too many/i,
    ];
    return temporaryPatterns.some((pattern) => pattern.test(error));
  }

  isConfigured(): boolean {
    return Boolean(env.smtpUser && env.smtpPassword);
  }
}

export const emailService = new EmailService();
