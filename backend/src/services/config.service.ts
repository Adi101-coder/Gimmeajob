import fs from 'fs/promises';
import { env } from '../config/env.js';
import { AppConfigSchema, type AppConfig } from '../types/index.js';
import { logger } from '../config/logger.js';
import { prisma } from '../config/database.js';

export class ConfigService {
  private cachedConfig: AppConfig | null = null;
  private lastLoadedAt = 0;
  private readonly cacheTtlMs = 30_000;

  async loadConfig(force = false): Promise<AppConfig> {
    const now = Date.now();
    if (!force && this.cachedConfig && now - this.lastLoadedAt < this.cacheTtlMs) {
      return this.cachedConfig;
    }

    try {
      const raw = await fs.readFile(env.configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const config = AppConfigSchema.parse(parsed);
      this.cachedConfig = config;
      this.lastLoadedAt = now;

      try {
        await prisma.appSettings.upsert({
          where: { id: 'default' },
          create: { id: 'default', config: config as object },
          update: { config: config as object },
        });
      } catch (dbError) {
        logger.warn('Could not persist config to database', { error: dbError });
      }

      return config;
    } catch (error) {
      logger.error('Failed to load config', { path: env.configPath, error });
      throw new Error(`Failed to load configuration from ${env.configPath}`);
    }
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
    const current = await this.loadConfig(true);
    const merged = { ...current, ...updates };
    const validated = AppConfigSchema.parse(merged);

    await fs.writeFile(env.configPath, JSON.stringify(validated, null, 2), 'utf-8');
    this.cachedConfig = validated;
    this.lastLoadedAt = Date.now();

    try {
      await prisma.appSettings.upsert({
        where: { id: 'default' },
        create: { id: 'default', config: validated as object },
        update: { config: validated as object },
      });
    } catch (dbError) {
      logger.warn('Could not persist config to database', { error: dbError });
    }

    logger.info('Configuration updated');
    return validated;
  }

  invalidateCache(): void {
    this.cachedConfig = null;
    this.lastLoadedAt = 0;
  }
}

export const configService = new ConfigService();
