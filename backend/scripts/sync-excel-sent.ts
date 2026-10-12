/**
 * One-time / occasional: mark Excel rows for every successful send in the DB.
 * Run from backend/: npm run sync:excel-sent
 */
import { LogStatus } from '@prisma/client';
import { prisma } from '../src/config/database.js';
import { excelParserService } from '../src/services/excel-parser.service.js';

async function main(): Promise<void> {
  const logs = await prisma.emailLog.findMany({
    where: { status: LogStatus.SUCCESS },
    select: { recipient: true, sentAt: true },
    orderBy: { sentAt: 'asc' },
  });

  const byEmail = new Map<string, Date>();
  for (const log of logs) {
    byEmail.set(log.recipient.trim().toLowerCase(), log.sentAt);
  }

  let marked = 0;
  for (const [email, sentAt] of byEmail) {
    if (await excelParserService.markEmailAsSent(email, sentAt)) {
      marked++;
    }
  }

  console.log(JSON.stringify({ successLogs: logs.length, uniqueEmails: byEmail.size, rowsUpdated: marked }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
