import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}

export const QUEUE_NAME = 'email-campaign-queue';
