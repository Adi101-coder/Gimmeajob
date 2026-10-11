import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

function secretsMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  if (!env.apiSecret) {
    res.status(503).json({ error: 'API_SECRET is not configured' });
    return;
  }

  const headerKey = req.header('x-api-key') ?? '';
  const authorization = req.header('authorization') ?? '';
  const bearer = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';
  const provided = headerKey || bearer;

  if (!secretsMatch(provided, env.apiSecret)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
