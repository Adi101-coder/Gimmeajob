import nodemailer from 'nodemailer';
import type Transporter from 'nodemailer/lib/mailer/index.js';
import { Resend } from 'resend';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import type { AppConfig } from '../types/index.js';
import {
  buildDeliverabilityHeaders,
  getReplyTo,
  textToHtml,
} from '../utils/email-deliverability.js';

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
  private resendClient: Resend | null = null;

  private usesResend(): boolean {
    return env.emailProvider === 'resend';
  }

  private getResendClient(): Resend {
    if (!this.resendClient) {
      this.resendClient = new Resend(env.resendApiKey);
    }
    return this.resendClient;
  }

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
      tls: {
        minVersion: 'TLSv1.2',
      },
    });
    this.lastConfigHash = configHash;
    return this.transporter;
  }

  private formatFromAddress(config: AppConfig): string {
    return `${config.smtp.fromName} <${config.smtp.fromEmail}>`;
  }

  async verifyConnection(_config: AppConfig): Promise<boolean> {
    if (this.usesResend()) {
      return Boolean(env.resendApiKey);
    }

    try {
      const transport = this.buildTransporter(_config);
      await transport.verify();
      return true;
    } catch (error) {
      logger.error('SMTP verification failed', { error });
      return false;
    }
  }

  private async sendViaResend(
    config: AppConfig,
    options: SendEmailOptions
  ): Promise<SendEmailResult> {
    if (!env.resendApiKey) {
      return {
        success: false,
        error: 'Resend API key not configured. Set RESEND_API_KEY in environment.',
      };
    }

    try {
      const resend = this.getResendClient();
      const replyTo = getReplyTo(config);
      const useHtml = config.deliverability?.useHtmlAlternative !== false;

      const { data, error } = await resend.emails.send({
        from: this.formatFromAddress(config),
        to: options.to,
        replyTo,
        subject: options.subject,
        text: options.body,
        html: useHtml ? textToHtml(options.body) : undefined,
        headers: buildDeliverabilityHeaders(config),
        attachments: options.attachment
          ? [
              {
                filename: options.attachment.filename,
                content: options.attachment.content,
              },
            ]
          : undefined,
      });

      if (error) {
        logger.error('Failed to send email via Resend', { to: options.to, error: error.message });
        return { success: false, error: error.message };
      }

      logger.info('Email sent successfully via Resend', {
        to: options.to,
        messageId: data?.id,
      });

      return {
        success: true,
        messageId: data?.id,
        response: 'Sent via Resend',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Resend error';
      logger.error('Failed to send email via Resend', { to: options.to, error: message });
      return { success: false, error: message };
    }
  }

  private async sendViaSmtp(
    config: AppConfig,
    options: SendEmailOptions
  ): Promise<SendEmailResult> {
    if (!env.smtpUser || !env.smtpPassword) {
      return {
        success: false,
        error: 'SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD in environment.',
      };
    }

    if (config.smtp.fromEmail.toLowerCase() !== env.smtpUser.toLowerCase()) {
      return {
        success: false,
        error: `fromEmail (${config.smtp.fromEmail}) must match SMTP_USER (${env.smtpUser}) for Gmail deliverability`,
      };
    }

    try {
      const transport = this.buildTransporter(config);
      const replyTo = getReplyTo(config);
      const useHtml = config.deliverability?.useHtmlAlternative !== false;

      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: config.smtp.fromName,
          address: config.smtp.fromEmail,
        },
        to: options.to,
        replyTo,
        subject: options.subject,
        text: options.body,
        headers: buildDeliverabilityHeaders(config),
      };

      if (useHtml) {
        mailOptions.html = textToHtml(options.body);
      }

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

  async sendEmail(config: AppConfig, options: SendEmailOptions): Promise<SendEmailResult> {
    if (this.usesResend()) {
      return this.sendViaResend(config, options);
    }
    return this.sendViaSmtp(config, options);
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
      /429/i,
    ];
    return temporaryPatterns.some((pattern) => pattern.test(error));
  }

  isConfigured(): boolean {
    if (this.usesResend()) {
      return Boolean(env.resendApiKey);
    }
    return Boolean(env.smtpUser && env.smtpPassword);
  }
}

export const emailService = new EmailService();
