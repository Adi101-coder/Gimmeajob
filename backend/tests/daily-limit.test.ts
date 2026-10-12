import { describe, it, expect } from 'vitest';
import { emailsRemainingToday, isUnlimitedDailyLimit } from '../src/utils/daily-limit.js';

describe('daily-limit', () => {
  it('treats zero or negative as unlimited', () => {
    expect(isUnlimitedDailyLimit(0)).toBe(true);
    expect(isUnlimitedDailyLimit(-1)).toBe(true);
    expect(isUnlimitedDailyLimit(20)).toBe(false);
  });

  it('returns null remaining when unlimited', () => {
    expect(emailsRemainingToday(0, 5)).toBe(null);
    expect(emailsRemainingToday(20, 5)).toBe(15);
  });
});
