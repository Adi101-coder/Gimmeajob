import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_CAMPAIGN_SUBJECT, DEFAULT_CAMPAIGN_BODY } from '../templates/emailTemplate.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const templateTxtPath = path.join(projectRoot, 'templates', 'email_template.txt');
const configPath = path.join(projectRoot, 'config', 'config.json');

fs.writeFileSync(templateTxtPath, DEFAULT_CAMPAIGN_BODY.trim() + '\n', 'utf-8');

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
config.emailSubject = DEFAULT_CAMPAIGN_SUBJECT;
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

console.log('Synced email template:');
console.log('  -> templates/email_template.txt');
console.log('  -> config/config.json (emailSubject)');
