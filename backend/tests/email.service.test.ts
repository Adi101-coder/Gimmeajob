import { describe, it, expect } from 'vitest';
import { EmailService } from '../src/services/email.service.js';

describe('EmailService', () => {
  const service = new EmailService();

  it('should detect temporary SMTP failures', () => {
    expect(service.isTemporaryFailure('Connection timeout')).toBe(true);
    expect(service.isTemporaryFailure('421 Service temporarily unavailable')).toBe(true);
    expect(service.isTemporaryFailure('450 Mailbox busy')).toBe(true);
    expect(service.isTemporaryFailure('ECONNRESET')).toBe(true);
    expect(service.isTemporaryFailure('Rate limit exceeded')).toBe(true);
  });

  it('should not classify permanent failures as temporary', () => {
    expect(service.isTemporaryFailure('550 Mailbox not found')).toBe(false);
    expect(service.isTemporaryFailure('Invalid recipient')).toBe(false);
    expect(service.isTemporaryFailure('Authentication failed')).toBe(false);
  });

  it('should report SMTP configuration status from environment', () => {
    expect(typeof service.isConfigured()).toBe('boolean');
  });
});
