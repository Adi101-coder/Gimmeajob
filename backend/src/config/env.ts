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
  dataDir: process.env.DATA_DIR ?? path.join(projectRoot, 'data'),
  templatesDir: process.env.TEMPLATES_DIR ?? path.join(projectRoot, 'templates'),
  resumesDir: process.env.RESUMES_DIR ?? path.join(projectRoot, 'resumes'),
  configPath: process.env.CONFIG_PATH ?? path.join(projectRoot, 'config', 'config.json'),
  logsDir: process.env.LOGS_DIR ?? path.join(projectRoot, 'logs'),
  projectRoot,
};

export const paths = {
  excelFile: () => path.join(env.dataDir, 'hr_database.xlsx'),
  emailTemplate: () => path.join(env.templatesDir, 'email_template.txt'),
  resume: () => path.join(env.resumesDir, 'Resume.pdf'),
};
