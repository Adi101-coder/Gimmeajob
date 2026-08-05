import { createEmailWorker } from './queue/email.worker.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { disconnectRedis } from './config/redis.js';
import { closeEmailQueue } from './queue/email.queue.js';
import { logger } from './config/logger.js';

let worker: ReturnType<typeof createEmailWorker>;

async function start(): Promise<void> {
  await connectDatabase();
  worker = createEmailWorker();
  logger.info('Worker process started');
}

async function shutdown(): Promise<void> {
  logger.info('Shutting down worker...');
  if (worker) await worker.close();
  await closeEmailQueue();
  await disconnectRedis();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start().catch((error) => {
  logger.error('Failed to start worker', { error });
  process.exit(1);
});
