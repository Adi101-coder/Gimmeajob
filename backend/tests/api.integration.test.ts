import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import routes from '../src/routes/index.js';
import { errorHandler } from '../src/middleware/error.middleware.js';

function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', routes);
  app.use(errorHandler);
  return app;
}

describe('API Integration', () => {
  const app = createTestApp();

  it('GET /api/health should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBeLessThanOrEqual(503);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('excel');
    expect(res.body).toHaveProperty('template');
    expect(res.body).toHaveProperty('resume');
  });

  it('GET /api/config should return configuration', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dailyEmailLimit');
    expect(res.body).toHaveProperty('smtp');
    expect(res.body).toHaveProperty('llm');
    expect(res.body.dailyEmailLimit).toBeGreaterThan(0);
  });

  it('GET /api/import-report should return excel parse result', async () => {
    const res = await request(app).get('/api/import-report');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('validRows');
    expect(res.body).toHaveProperty('errors');
    expect(res.body.validRows).toBeGreaterThan(0);
  });

  it('POST /api/campaigns should validate input', async () => {
    const res = await request(app).post('/api/campaigns').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/logs should return paginated logs or handle DB unavailable', async () => {
    const res = await request(app).get('/api/logs');
    if (res.status === 200) {
      expect(res.body).toHaveProperty('logs');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.logs)).toBe(true);
    } else {
      expect(res.status).toBe(500);
    }
  });
});
