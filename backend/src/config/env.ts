import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const backendRoot = process.cwd();
const possibleRoots = [
  path.resolve(backendRoot, '..'),
  backendRoot,
  path.resolve(backendRoot, '../..'),
];

for (const root of possibleRoots) {
  const envPath = path.join(root, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}
dotenv.config();

function resolveProjectRoot(): string {
  if (process.env.PROJECT_ROOT) return process.env.PROJECT_ROOT;

  for (const root of possibleRoots) {
    if (fs.existsSync(path.join(root, 'config', 'config.json'))) {
      return root;
    }
  }
  return path.resolve(backendRoot, '..');
}

const projectRoot = resolveProjectRoot();

function resolvePath(configured: string | undefined, defaultRelative: string): string {
  if (!configured) return path.join(projectRoot, defaultRelative);
  if (path.isAbsolute(configured)) return configured;
  return path.resolve(projectRoot, configured.replace(/^\.\//, ''));
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  llmProvider: process.env.LLM_PROVIDER ?? 'openai',
  dataDir: resolvePath(process.env.DATA_DIR, 'data'),
  templatesDir: resolvePath(process.env.TEMPLATES_DIR, 'templates'),
  resumesDir: resolvePath(process.env.RESUMES_DIR, 'resumes'),
  configPath: resolvePath(process.env.CONFIG_PATH, path.join('config', 'config.json')),
  logsDir: resolvePath(process.env.LOGS_DIR, 'logs'),
  projectRoot,
};

export const paths = {
  excelFile: () => path.join(env.dataDir, 'hr_database.xlsx'),
  emailTemplate: () => path.join(env.templatesDir, 'email_template.txt'),
  resume: () => path.join(env.resumesDir, 'Resume.pdf'),
};
