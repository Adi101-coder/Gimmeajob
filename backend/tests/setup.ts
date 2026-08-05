import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

process.env.NODE_ENV = 'test';
process.env.PROJECT_ROOT = projectRoot;
process.env.CONFIG_PATH = path.join(projectRoot, 'config', 'config.json');
process.env.DATA_DIR = path.join(projectRoot, 'data');
process.env.TEMPLATES_DIR = path.join(projectRoot, 'templates');
process.env.RESUMES_DIR = path.join(projectRoot, 'resumes');
process.env.LOGS_DIR = path.join(projectRoot, 'logs');
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
