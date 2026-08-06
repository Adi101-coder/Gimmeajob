import { describe, it, expect } from 'vitest';
import {
  buildHumanTestEmail,
  buildResumeFilename,
  textToHtml,
  validateDeliverability,
} from '../src/utils/email-deliverability.js';
import type { AppConfig } from '../src/types/index.js';

const baseConfig: AppConfig = {
  dailyEmailLimit: 20,
  workingHours: { start: '09:00', end: '17:00', timezone: 'UTC' },
  defaultSchedule: { mode: 'schedule', time: '09:00' },
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    fromName: 'Adit Katiyar',
    fromEmail: 'test@gmail.com',
    replyTo: 'test@gmail.com',
  },
  deliverability: { includeListUnsubscribe: true, useHtmlAlternative: true },
  llm: { model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 1024 },
  retry: { count: 3, delayMs: 5000 },
  randomDelay: { minSeconds: 30, maxSeconds: 120 },
  emailSubject: 'Application for {{JOB_ROLE}} at {{COMPANY_NAME}}',
};

describe('email-deliverability', () => {
  it('should build human-like test email without spam words', () => {
    const { subject, body } = buildHumanTestEmail('Adit Katiyar');
    expect(subject).not.toMatch(/test|smtp|verify/i);
    expect(body).toContain('Adit Katiyar');
    expect(body).toContain('Dear Hiring Manager');
  });

  it('should build safe resume filename', () => {
    expect(buildResumeFilename('Adit Katiyar')).toBe('Adit_Katiyar_Resume.pdf');
  });

  it('should convert text to html', () => {
    const html = textToHtml('Hello\n\nWorld');
    expect(html).toContain('<p');
    expect(html).toContain('Hello');
    expect(html).toContain('World');
  });

  it('should flag gmail bulk sending warnings', () => {
    const report = validateDeliverability(baseConfig);
    expect(report.issues.some((i) => i.message.includes('Gmail'))).toBe(true);
    expect(report.score).toBeGreaterThan(0);
  });
});
