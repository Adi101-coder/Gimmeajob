import { Queue } from 'bullmq';
import { getRedisClient, QUEUE_NAME } from '../config/redis.js';

let emailQueue: Queue | null = null;

export function getEmailQueue(): Queue {
  if (!emailQueue) {
    emailQueue = new Queue(QUEUE_NAME, {
      connection: getRedisClient(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }
  return emailQueue;
}

export async function closeEmailQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
  }
}
