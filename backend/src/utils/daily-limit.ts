/** Config or campaign dailyLimit <= 0 means no cap on sends per day. */
export function isUnlimitedDailyLimit(limit: number): boolean {
  return limit <= 0;
}

export function emailsRemainingToday(dailyLimit: number, todaySent: number): number | null {
  if (isUnlimitedDailyLimit(dailyLimit)) {
    return null;
  }
  return Math.max(0, dailyLimit - todaySent);
}
