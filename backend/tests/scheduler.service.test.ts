import { describe, it, expect } from 'vitest';
import { SchedulerService } from '../src/services/campaign.service.js';
import type { AppConfig } from '../src/types/index.js';

const mockConfig: AppConfig = {
  dailyEmailLimit: 5,
  workingHours: { start: '09:00', end: '17:00', timezone: 'UTC' },
  defaultSchedule: { mode: 'schedule', time: '09:00' },
  smtp: {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    fromName: 'Test',
    fromEmail: 'test@test.com',
  },
  llm: { model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 1024 },
  retry: { count: 3, delayMs: 5000 },
  randomDelay: { minSeconds: 1, maxSeconds: 5 },
  emailSubject: 'Test {{JOB_ROLE}}',
};

describe('SchedulerService', () => {
  const scheduler = new SchedulerService();

  it('should compute schedule times within working hours', () => {
    const start = new Date('2026-08-06T09:00:00');
    const times = scheduler.computeScheduleTimes(3, mockConfig, start);

    expect(times).toHaveLength(3);
    times.forEach((time) => {
      const hours = time.getHours();
      expect(hours).toBeGreaterThanOrEqual(9);
      expect(hours).toBeLessThanOrEqual(17);
    });
  });

  it('should distribute emails across days when exceeding daily limit', () => {
    const start = new Date('2026-08-06T09:00:00');
    const times = scheduler.computeScheduleTimes(8, mockConfig, start);

    expect(times).toHaveLength(8);

    const day1 = times.filter((t) => t.getDate() === 6).length;
    const day2 = times.filter((t) => t.getDate() === 7).length;

    expect(day1).toBeLessThanOrEqual(5);
    expect(day2).toBeGreaterThan(0);
  });

  it('should return times in chronological order', () => {
    const start = new Date('2026-08-06T09:00:00');
    const times = scheduler.computeScheduleTimes(5, mockConfig, start);

    for (let i = 1; i < times.length; i++) {
      expect(times[i].getTime()).toBeGreaterThanOrEqual(times[i - 1].getTime() - 60000);
    }
  });

  it('should burst immediate sends with short gaps', () => {
    const start = new Date('2026-08-06T10:00:00');
    const times = scheduler.computeImmediateScheduleTimes(3, mockConfig, start);
    expect(times).toHaveLength(3);
    const spanMs = times[2].getTime() - times[0].getTime();
    expect(spanMs).toBeLessThan(30 * 60 * 1000);
    expect(times[1].getTime()).toBeGreaterThan(times[0].getTime());
  });

  it('should schedule all spread-mode emails in one day when daily limit is unlimited', () => {
    const unlimitedConfig = { ...mockConfig, dailyEmailLimit: 0 };
    const start = new Date('2026-08-06T09:00:00');
    const times = scheduler.computeScheduleTimes(8, unlimitedConfig, start);
    expect(times).toHaveLength(8);
    expect(times.every((t) => t.getDate() === 6)).toBe(true);
  });
});
