import type { AppConfig } from '../types/index.js';
import { env } from '../config/env.js';

export interface DeliverabilityIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
  fix: string;
}

export interface DeliverabilityReport {
  score: number;
  issues: DeliverabilityIssue[];
  recommendations: string[];
}

export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#222;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;margin:0;padding:16px;">${paragraphs}</body></html>`;
}

export function buildResumeFilename(fromName: string): string {
  const safe = fromName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  return safe ? `${safe}_Resume.pdf` : 'Resume.pdf';
}

export function getReplyTo(config: AppConfig): string {
  return config.smtp.replyTo ?? config.smtp.fromEmail;
}

export function buildDeliverabilityHeaders(config: AppConfig): Record<string, string> {
  const replyTo = getReplyTo(config);
  const headers: Record<string, string> = {
    'Reply-To': replyTo,
    'X-Priority': '3',
    Importance: 'normal',
  };

  if (config.deliverability?.includeListUnsubscribe !== false) {
    headers['List-Unsubscribe'] = `<mailto:${replyTo}?subject=Please%20remove%20me%20from%20future%20emails>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  return headers;
}

export function validateDeliverability(config: AppConfig): DeliverabilityReport {
  const issues: DeliverabilityIssue[] = [];
  const recommendations: string[] = [];
  const usesResend = (process.env.EMAIL_PROVIDER ?? env.emailProvider ?? 'smtp').toLowerCase() === 'resend';
  const resendApiKey = process.env.RESEND_API_KEY ?? env.resendApiKey;

  if (usesResend) {
    if (!resendApiKey) {
      issues.push({
        level: 'error',
        message: 'Resend API key not configured',
        fix: 'Set RESEND_API_KEY in .env',
      });
    }

    if (config.smtp.fromEmail.endsWith('@resend.dev')) {
      issues.push({
        level: 'warning',
        message: 'Using Resend test sender (onboarding@resend.dev)',
        fix: 'Verify your own domain in Resend and update smtp.fromEmail before sending campaigns',
      });
      recommendations.push('Test sender only delivers to your Resend account email until a domain is verified');
    }
  } else {
    if (!env.smtpUser || !env.smtpPassword) {
      issues.push({
        level: 'error',
        message: 'SMTP credentials not configured',
        fix: 'Set SMTP_USER and SMTP_PASSWORD in .env',
      });
    }

    if (env.smtpUser && config.smtp.fromEmail.toLowerCase() !== env.smtpUser.toLowerCase()) {
      issues.push({
        level: 'error',
        message: 'fromEmail does not match SMTP_USER',
        fix: `Set config.json smtp.fromEmail to ${env.smtpUser}`,
      });
    }

    if (config.smtp.fromEmail.endsWith('@gmail.com') && config.dailyEmailLimit > 50) {
      issues.push({
        level: 'warning',
        message: 'High daily limit for personal Gmail',
        fix: 'Keep dailyEmailLimit at 20 or below to reduce spam flags',
      });
    }

    if (config.smtp.fromEmail.endsWith('@gmail.com')) {
      issues.push({
        level: 'warning',
        message: 'Sending campaigns from personal Gmail',
        fix: 'Use a custom domain with SPF, DKIM, and DMARC for better inbox placement',
      });
      recommendations.push('Consider Google Workspace or SendGrid with your own domain');
    }
  }

  if (!config.smtp.fromName || config.smtp.fromName.length < 2) {
    issues.push({
      level: 'warning',
      message: 'Sender name is missing or too short',
      fix: 'Set a real full name in smtp.fromName',
    });
  }

  if (config.smtp.fromName.toLowerCase().includes('gimmeajob')) {
    issues.push({
      level: 'warning',
      message: 'Sender name looks like an app, not a person',
      fix: 'Use your real name in smtp.fromName (e.g. Adit Katiyar)',
    });
  }

  const spammySubjectPatterns = [/test/i, /smtp/i, /verify/i, /free/i, /urgent/i];
  if (spammySubjectPatterns.some((p) => p.test(config.emailSubject))) {
    issues.push({
      level: 'info',
      message: 'Email subject may trigger spam filters',
      fix: 'Use a natural subject like "Application for {{JOB_ROLE}} at {{COMPANY_NAME}}"',
    });
  }

  recommendations.push('Mark test emails as Not spam in Gmail to train filters');
  recommendations.push('Send 5–10 emails per day when starting, then increase slowly');
  recommendations.push('Personalize each email — avoid identical copy across all recipients');

  const errorCount = issues.filter((i) => i.level === 'error').length;
  const warningCount = issues.filter((i) => i.level === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 30 - warningCount * 10);

  return { score, issues, recommendations };
}

export function buildHumanTestEmail(fromName: string): { subject: string; body: string } {
  return {
    subject: `Application inquiry — ${fromName}`,
    body: [
      `Dear Hiring Manager,`,
      '',
      `I hope you are doing well. I am reaching out regarding opportunities that align with my background and experience.`,
      '',
      `I have attached my resume for your review. I would welcome the chance to discuss how I can contribute to your team.`,
      '',
      `Thank you for your time and consideration.`,
      '',
      `Best regards,`,
      fromName,
    ].join('\n'),
  };
}
